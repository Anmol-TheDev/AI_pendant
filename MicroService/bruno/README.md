# Bruno API Collection - Audio Transcription Microservice

This Bruno collection contains all API endpoints for testing the Audio Transcription Microservice.

## Setup

1. **Install Bruno**: Download from [usebruno.com](https://www.usebruno.com/)

2. **Open Collection**: 
   - Open Bruno
   - Click "Open Collection"
   - Select this `bruno` folder

3. **Configure Environment**:
   - Select "Local" environment in Bruno
   - Update variables in `environments/Local.bru`:
     - `base_url`: Your service URL (default: http://localhost:8000)
     - `backend_url`: Your backend URL
     - `elevenlabs_api_key`: Your ElevenLabs API key (if needed for testing)

4. **Update Audio File Paths**:
   - Edit each request
   - Update `@file(/path/to/audio.wav)` with actual file paths
   - Or use the file picker in Bruno UI

## Collection Structure

### 1. Health Check
- **Method**: GET
- **Endpoint**: `/health`
- **Purpose**: Verify service is running

### 2. Transcribe Audio Chunk
- **Method**: POST
- **Endpoint**: `/transcribe-chunk`
- **Body**: Multipart form with audio file
- **Purpose**: Main transcription endpoint

### 3. Transcribe Multiple Chunks
- **Method**: POST
- **Endpoint**: `/transcribe-chunk`
- **Purpose**: Example for chunk #2 (sequential processing)

### 4. Transcribe with Unix Timestamp
- **Method**: POST
- **Endpoint**: `/transcribe-chunk`
- **Purpose**: Example using Unix timestamp format

### 5. Backend Callback Example
- **Method**: POST
- **Endpoint**: `/daily-context/add`
- **Purpose**: Shows the payload sent to your backend

## Testing Workflow

1. **Start the service**:
   ```bash
   source venv/bin/activate
   gunicorn app.main:app -c gunicorn.conf.py
   ```

2. **Run Health Check**: Verify service is running

3. **Prepare test audio**: 
   ```bash
   # Generate test audio
   ffmpeg -f lavfi -i "sine=frequency=1000:duration=5" -ar 16000 test_audio.wav
   ```

4. **Update file paths** in Bruno requests

5. **Send transcription requests**: Use the transcribe endpoints

6. **Monitor logs**: Check terminal for processing status

## Environment Variables

### Local Environment
```
base_url: http://localhost:8000
backend_url: http://localhost:8000
elevenlabs_api_key: your_api_key_here
```

### Production Environment
```
base_url: https://api.yourdomain.com
backend_url: https://backend.yourdomain.com
elevenlabs_api_key: your_production_api_key_here
```

## Tips

- Use Bruno's **Tests** tab to validate responses
- Check **Docs** tab in each request for detailed information
- Use **Scripts** for pre-request setup (e.g., generate timestamps)
- Enable **Auto-save** for convenience
- Use **Collections Runner** to test multiple requests sequentially

## Sample Audio Files

Create test audio files:

```bash
# 5-second sine wave
ffmpeg -f lavfi -i "sine=frequency=1000:duration=5" -ar 16000 test_audio.wav

# Record from microphone (5 seconds)
ffmpeg -f alsa -i default -t 5 -ar 16000 recorded_audio.wav

# Convert existing audio
ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav
```

## Troubleshooting

### File Upload Issues
- Ensure file path is correct
- Use absolute paths or paths relative to Bruno collection
- Check file permissions

### Connection Refused
- Verify service is running: `curl http://localhost:8000/health`
- Check port number in environment variables
- Ensure no firewall blocking

### 500 Errors
- Check service logs for details
- Verify `.env` file has correct API keys
- Ensure all dependencies are installed

## Support

For issues or questions:
- Check service logs
- Review README.md in project root
- Verify environment configuration
