import io
import numpy as np
import soundfile as sf
import noisereduce as nr
import webrtcvad
from scipy import signal
import logging
from app.config import settings

logger = logging.getLogger(__name__)

def filter_audio(audio_data: bytes, filename: str = "audio") -> bytes:
    """
    Apply audio filtering pipeline:
    1. Noise reduction
    2. Silence removal (VAD)
    3. Re-encode to wav, 16khz, mono
    """
    try:
        # Load audio
        audio_io = io.BytesIO(audio_data)
        data, sample_rate = sf.read(audio_io)
        
        # Convert to mono if stereo
        if len(data.shape) > 1:
            data = np.mean(data, axis=1)
        
        logger.info(f"Loaded audio: {len(data)} samples at {sample_rate}Hz")
        
        # Noise reduction
        data = nr.reduce_noise(y=data, sr=sample_rate)
        logger.info("Applied noise reduction")
        
        # Resample to 16kHz if needed
        if sample_rate != settings.sample_rate:
            num_samples = int(len(data) * settings.sample_rate / sample_rate)
            data = signal.resample(data, num_samples)
            sample_rate = settings.sample_rate
            logger.info(f"Resampled to {settings.sample_rate}Hz")
        
        # Apply VAD for silence removal
        data = remove_silence(data, sample_rate)
        logger.info("Applied VAD silence removal")
        
        # Normalize audio
        data = data / np.max(np.abs(data))
        
        # Convert to int16
        data = (data * 32767).astype(np.int16)
        
        # Write to WAV format
        output_io = io.BytesIO()
        sf.write(output_io, data, sample_rate, format='WAV', subtype='PCM_16')
        output_io.seek(0)
        
        logger.info("Audio filtering complete")
        return output_io.read()
    
    except Exception as e:
        logger.error(f"Audio filtering failed: {str(e)}")
        raise

def remove_silence(audio: np.ndarray, sample_rate: int, frame_duration: int = 30) -> np.ndarray:
    """
    Remove silence using WebRTC VAD.
    """
    vad = webrtcvad.Vad(2)  # Aggressiveness mode 2
    
    # Frame size in samples
    frame_size = int(sample_rate * frame_duration / 1000)
    
    # Pad audio to be divisible by frame_size
    padding = frame_size - (len(audio) % frame_size)
    if padding != frame_size:
        audio = np.pad(audio, (0, padding), mode='constant')
    
    # Convert to int16 for VAD
    audio_int16 = (audio * 32767).astype(np.int16)
    
    # Process frames
    frames = []
    for i in range(0, len(audio_int16), frame_size):
        frame = audio_int16[i:i + frame_size]
        if len(frame) == frame_size:
            is_speech = vad.is_speech(frame.tobytes(), sample_rate)
            if is_speech:
                frames.append(audio[i:i + frame_size])
    
    if not frames:
        logger.warning("VAD removed all audio, returning original")
        return audio
    
    return np.concatenate(frames)
