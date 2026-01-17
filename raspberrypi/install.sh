#!/bin/bash
# Installation script for Audio Recording System

echo "🚀 Installing Audio Recording System..."
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

echo "✅ Python dependencies installed"
echo ""

# Check for ffmpeg (needed for MP3 conversion)
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  ffmpeg not found (needed for MP3 conversion)"
    echo ""
    
    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "📱 macOS detected"
        echo "Install ffmpeg with: brew install ffmpeg"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "🐧 Linux detected"
        echo "Install ffmpeg with: sudo apt-get install ffmpeg"
    fi
    echo ""
else
    echo "✅ ffmpeg found: $(ffmpeg -version | head -n 1)"
    echo ""
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env and set your BACKEND_BASE_URL"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "=" | tr -d '\n' | head -c 60; echo ""
echo "🎉 Installation complete!"
echo "=" | tr -d '\n' | head -c 60; echo ""
echo ""
echo "Next steps:"
echo "1. Edit .env file: nano .env"
echo "2. Set BACKEND_BASE_URL to your backend server"
echo "3. Run: python3 record_and_send.py"
echo ""
