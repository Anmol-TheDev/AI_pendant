#!/usr/bin/env python3
"""
Audio Recording and Sending Script
Records audio in 10-second MP3 chunks, saves locally, then sends to backend API
"""
import sounddevice as sd
import numpy as np
import requests
import time
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from scipy.io.wavfile import write
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ================= CONFIG =================
# Backend API Configuration
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
API_ENDPOINT_PATH = os.getenv("API_ENDPOINT", "/transcribe-chunk")
API_ENDPOINT = f"{BACKEND_BASE_URL}{API_ENDPOINT_PATH}"

# Audio settings
SAMPLE_RATE = int(os.getenv("SAMPLE_RATE", "44100"))  # USB mic compatible rate
CHUNK_DURATION = int(os.getenv("CHUNK_DURATION", "10"))  # 10 seconds per chunk
CHANNELS = int(os.getenv("CHANNELS", "1"))  # Mono
USB_MIC_DEVICE = os.getenv("USB_MIC_DEVICE", "hw:2,0")  # Force USB microphone device

# Storage settings
AUDIO_FOLDER = os.getenv("AUDIO_FOLDER", "recorded_audio")
# =========================================

# Create audio storage folder
Path(AUDIO_FOLDER).mkdir(exist_ok=True)

print("=" * 60)
print("🎤 AUDIO RECORDING & SENDING SYSTEM")
print("=" * 60)
print(f"📁 Saving audio to: {AUDIO_FOLDER}/")
print(f"🌐 Backend API: {API_ENDPOINT}")
print(f"🔊 Sample Rate: {SAMPLE_RATE}Hz, Channels: {CHANNELS}")
print(f"⏱️  Chunk Duration: {CHUNK_DURATION} seconds")
print(f"💾 Format: MP3")
print("=" * 60)
print()

# Check if ffmpeg is available
def check_ffmpeg():
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

if not check_ffmpeg():
    print("❌ ffmpeg not found! Please install ffmpeg:")
    print("   macOS: brew install ffmpeg")
    print("   Linux: sudo apt-get install ffmpeg")
    exit(1)

# List available audio devices
print("Available audio devices:")
devices = sd.query_devices()
print(devices)
print()

# Try to find and use USB microphone device
usb_device_index = None
try:
    # First try the specified USB device string
    if USB_MIC_DEVICE.startswith("hw:"):
        # For ALSA device strings like "hw:2,0"
        for i, device in enumerate(devices):
            if USB_MIC_DEVICE in str(device.get('name', '')).lower() or device.get('max_input_channels', 0) > 0:
                usb_device_index = i
                break
    else:
        # Try to parse as device index
        usb_device_index = int(USB_MIC_DEVICE)
        
    if usb_device_index is not None and usb_device_index < len(devices):
        selected_device = devices[usb_device_index]
        print(f"Using USB microphone device [{usb_device_index}]: {selected_device['name']}")
        
        # Validate sample rate compatibility
        try:
            # Test if the device supports our sample rate
            sd.check_input_settings(device=usb_device_index, samplerate=SAMPLE_RATE, channels=CHANNELS)
        except sd.PortAudioError:
            # Try common USB mic sample rates
            for rate in [44100, 48000, 22050, 16000]:
                try:
                    sd.check_input_settings(device=usb_device_index, samplerate=rate, channels=CHANNELS)
                    SAMPLE_RATE = rate
                    print(f"Adjusted sample rate to {SAMPLE_RATE}Hz for USB microphone compatibility")
                    break
                except sd.PortAudioError:
                    continue
            else:
                print(f"⚠️  Warning: Could not find compatible sample rate for USB device")
    else:
        print(f"⚠️  Warning: USB device {USB_MIC_DEVICE} not found, using default input device")
        usb_device_index = None
        selected_device = sd.query_devices(kind='input')
        
except (ValueError, IndexError):
    print(f"⚠️  Warning: Invalid USB device specification {USB_MIC_DEVICE}, using default input device")
    usb_device_index = None
    selected_device = sd.query_devices(kind='input')

if usb_device_index is None:
    selected_device = sd.query_devices(kind='input')
    print(f"Using default input device: {selected_device['name']}")

print()

print("🎙️  Press Ctrl+C to stop recording")
print("🔴 Recording will start in 3 seconds...\n")
time.sleep(3)

chunk_number = 0

def convert_wav_to_mp3(wav_path, mp3_path):
    """Convert WAV file to MP3 using ffmpeg"""
    try:
        subprocess.run([
            'ffmpeg', '-i', wav_path, 
            '-codec:a', 'mp3', 
            '-b:a', '128k',
            '-y',  # Overwrite output file
            mp3_path
        ], capture_output=True, check=True)
        
        # Remove the temporary WAV file
        os.remove(wav_path)
        return True
    except subprocess.CalledProcessError as e:
        print(f"   ❌ FFmpeg error: {e}")
        return False


def send_to_backend(filepath, chunk_num, timestamp_str):
    """Send audio chunk to backend API"""
    try:
        with open(filepath, 'rb') as f:
            audio_bytes = f.read()
        
        files = {
            "audio_file": (os.path.basename(filepath), audio_bytes, "audio/mpeg")
        }
        
        data = {
            "chunk_number": chunk_num,
            "time": timestamp_str
        }
        
        print(f"   📤 Sending to backend...")
        response = requests.post(API_ENDPOINT, files=files, data=data, timeout=30)
        
        if response.status_code == 200:
            print(f"   ✅ Successfully sent to backend")
            print(f"   📊 Response: {response.json()}")
        else:
            print(f"   ❌ Backend error: {response.status_code}")
            print(f"   📄 Error: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Network error: {e}")
    except Exception as e:
        print(f"   ❌ Error sending: {e}")


try:
    print("🔴 RECORDING STARTED\n")
    
    while True:
        chunk_number += 1
        
        # Get timestamp in microseconds
        timestamp_us = int(time.time() * 1_000_000)
        # ISO 8601 format with milliseconds and UTC timezone
        timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        
        print(f"🎙️  Recording chunk {chunk_number} ({CHUNK_DURATION}s)...")
        
        # Record audio
        recording = sd.rec(
            int(CHUNK_DURATION * SAMPLE_RATE),
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype='int16',
            device=usb_device_index  # Use the USB microphone device
        )
        sd.wait()  # Wait until recording is finished
        
        print(f"   ⏸️  Recording complete")
        
        # Save as WAV first
        wav_filename = f"chunk_{chunk_number:04d}_{timestamp_str.replace(':', '-').replace('.', '_')}.wav"
        wav_filepath = os.path.join(AUDIO_FOLDER, wav_filename)
        write(wav_filepath, SAMPLE_RATE, recording)
        
        # Convert to MP3
        print(f"   🔄 Converting to MP3...")
        mp3_filename = f"chunk_{chunk_number:04d}_{timestamp_str.replace(':', '-').replace('.', '_')}.mp3"
        mp3_filepath = os.path.join(AUDIO_FOLDER, mp3_filename)
        
        if convert_wav_to_mp3(wav_filepath, mp3_filepath):
            print(f"   💾 Saved locally: {mp3_filename}")
            
            # Get file size
            file_size = os.path.getsize(mp3_filepath)
            print(f"   📏 Size: {file_size / 1024:.2f} KB")
            print(f"   🕐 Timestamp: {timestamp_str}")
            
            # Send to backend
            send_to_backend(mp3_filepath, chunk_number, timestamp_str)
        else:
            print(f"   ❌ Failed to convert to MP3")
        
        print()  # Empty line for readability

except KeyboardInterrupt:
    print("\n" + "=" * 60)
    print("🛑 RECORDING STOPPED")
    print("=" * 60)
    print(f"📊 Total chunks recorded: {chunk_number}")
    print(f"📁 Audio files saved in: {AUDIO_FOLDER}/")
    print(f"⏱️  Total duration: {chunk_number * CHUNK_DURATION} seconds")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()