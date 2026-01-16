# 🎙️ Pendant - Raspberry Pi Recording App

A React Native mobile application for managing and viewing recordings from a Raspberry Pi Zero-based wearable pendant device.

## 📱 Overview

This app interfaces with a custom Raspberry Pi Zero pendant that captures audio/video clips and sensor data. The mobile app provides:

- Real-time device status monitoring
- WiFi-based data synchronization
- Media playback and management
- Cloud backup (optional)
- Offline support with sync queue

---

## ✨ Features

### Core Functionality

- ✅ **Network Management**: WiFi detection, status monitoring, permission handling
- 🔄 **Device Communication**: Connect to Raspberry Pi pendant via local network
- 📹 **Media Library**: Browse, search, and filter recordings
- ▶️ **Playback**: Built-in video/audio player with controls
- 📤 **Export/Share**: Save to gallery or share to other apps
- 🔄 **Auto-Sync**: Background synchronization when on WiFi
- 💾 **Offline Mode**: Queue actions when offline, sync later

### Device Monitoring

- Battery level indicator
- Storage usage tracking
- Recording count statistics
- Last sync timestamp
- Connection status

---

## 🛠️ Tech Stack

- **Framework**: React Native (Expo SDK 54)
- **Styling**: NativeWind (TailwindCSS for RN)
- **Navigation**: Expo Router (file-based routing)
- **Network**: expo-network for WiFi management
- **UI Components**: Custom components with lucide-react-native icons
- **Type Safety**: TypeScript throughout

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator / Physical device

### Installation

```bash
# Navigate to project directory
cd /home/hyperion/Code/WEB\ DEV/React-Native/pendant

# Install dependencies (already done)
npm install

# Start development server
npm run dev

# Run on specific platform
npm run android  # Android
npm run ios      # iOS
npm run web      # Web (limited functionality)
```

### First Run

1. Start the Expo development server: `npm run dev`
2. Scan QR code with Expo Go app (or run in simulator)
3. Grant network permissions when prompted
4. Connect to the same WiFi as your pendant device

---

## 📚 Documentation

### For Mobile App Developers

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete app architecture, features, and implementation roadmap
- **[UI_DESIGN_SPECS.md](./UI_DESIGN_SPECS.md)** - UI/UX specifications, mockups, and design patterns

### For Raspberry Pi Setup

- **[RASPBERRY_PI_SETUP.md](./RASPBERRY_PI_SETUP.md)** - Backend server setup guide for the pendant device

### Key Files

- `lib/permissions.ts` - Network permission utilities
- `lib/network-context.tsx` - Global network state provider
- `app/index.tsx` - Home screen with device status
- `app/_layout.tsx` - Root layout with providers

---

## 🎨 Project Structure

```
pendant/
├── app/                    # Expo Router screens
│   ├── index.tsx          # ✅ Home/Dashboard
│   ├── _layout.tsx        # ✅ Root layout
│   └── +html.tsx          # HTML wrapper
│
├── components/            # Reusable UI components
│   └── ui/               # Base UI primitives
│
├── lib/                   # Utilities and core logic
│   ├── permissions.ts    # ✅ Network permissions
│   ├── network-context.tsx # ✅ Network state provider
│   └── theme.ts          # Theme configuration
│
├── assets/               # Images, fonts, etc.
│
├── ARCHITECTURE.md       # ✅ Architecture guide
├── RASPBERRY_PI_SETUP.md # ✅ Backend setup
├── UI_DESIGN_SPECS.md    # ✅ Design specifications
└── package.json          # Dependencies
```

---

## 🔧 Configuration

### Android Permissions (app.json / AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
```

### iOS Permissions (Info.plist)

```xml
<key>NSLocalNetworkUsageDescription</key>
<string>Connect to your pendant device on the local network.</string>
```

---

## 📋 Implementation Status

### Phase 1: Foundation ✅ **COMPLETE**

- [x] Project setup with Expo
- [x] Network connectivity utilities
- [x] Network context provider
- [x] Basic home screen UI
- [x] Permission handling
- [x] Documentation

### Phase 2: Core Features 🔄 **NEXT**

- [ ] Pendant device discovery (mDNS)
- [ ] API client for Raspberry Pi
- [ ] Recordings list screen
- [ ] Local storage with AsyncStorage
- [ ] Sync engine

### Phase 3: Media Handling 📅 **PLANNED**

- [ ] Video/Audio player
- [ ] Thumbnail generation
- [ ] Clip detail screen
- [ ] Export to gallery
- [ ] Share functionality

### Phase 4: Polish & Optimization 📅 **PLANNED**

- [ ] Offline mode with queue
- [ ] Background sync
- [ ] Push notifications
- [ ] Settings screen
- [ ] Error handling & retry

---

## 🎯 Key Functionalities to Keep in Mind

### 1. **Network & WiFi Management**

- Continuous monitoring of WiFi connection status
- Permission requests with user-friendly prompts
- Graceful handling of connection losses
- Automatic reconnection when WiFi is available

### 2. **Pendant Communication**

- REST API client for Raspberry Pi server
- Device discovery on local network
- Real-time status updates (battery, storage)
- Robust error handling and retries

### 3. **Data Synchronization**

- Background sync when on WiFi
- Offline queue for pending operations
- Progress tracking for large file transfers
- Conflict resolution for concurrent changes

### 4. **Media Management**

- Efficient thumbnail caching
- Progressive video loading
- Smart storage management
- Batch operations (delete multiple clips)

### 5. **User Experience**

- Skeleton screens while loading
- Optimistic UI updates
- Clear error messages with recovery actions
- Smooth animations and transitions

### 6. **Security & Privacy**

- Secure local storage
- Optional authentication for multi-device
- Encrypted file transfers (HTTPS)
- Privacy controls for recordings

---

## 🔌 Raspberry Pi Integration

Your pendant device should run a web server (FastAPI recommended) that exposes these endpoints:

```typescript
GET  /api/status         // Device status (battery, storage, etc.)
GET  /api/recordings     // List all recordings
GET  /api/recording/:id  // Download specific recording
DELETE /api/recording/:id // Delete recording
POST /api/record         // Start recording
POST /api/stop-record    // Stop recording
```

See **[RASPBERRY_PI_SETUP.md](./RASPBERRY_PI_SETUP.md)** for complete backend setup.

---

## 📦 Additional Packages to Install

```bash
# File system operations
npx expo install expo-file-system

# Media library (export to gallery)
npx expo install expo-media-library

# Audio/Video playback
npx expo install expo-av

# Local storage
npx expo install @react-native-async-storage/async-storage

# HTTP requests
npm install axios
```

---

## 🐛 Troubleshooting

### App won't connect to pendant

1. Ensure both devices are on the same WiFi network
2. Check pendant server is running: `curl http://<pendant-ip>:8000/api/status`
3. Verify firewall settings on Raspberry Pi
4. Check network permissions in app settings

### Sync not working

1. Verify WiFi connection status in app
2. Check pendant storage isn't full
3. Review app logs for sync errors
4. Try manual sync from dashboard

### Poor performance

1. Clear app cache in settings
2. Reduce thumbnail quality in preferences
3. Enable WiFi-only sync
4. Delete old recordings

---

## 🤝 Contributing

This is a personal project for interfacing with a custom Raspberry Pi pendant. Feel free to adapt the code for your own IoT recording projects.

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🎓 Learning Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Raspberry Pi Documentation](https://www.raspberrypi.org/documentation/)

---

## 📞 Support

For issues related to:

- **Mobile App**: Check `ARCHITECTURE.md` and existing code
- **Raspberry Pi Backend**: See `RASPBERRY_PI_SETUP.md`
- **UI/UX Questions**: Refer to `UI_DESIGN_SPECS.md`

---

**Built with ❤️ for seamless pendant recording management**
