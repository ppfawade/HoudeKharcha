# HoudeKharcha

## Overview
A fully offline, on-device INR expense tracker built with Expo (React Native). No cloud sync, no ads — all data stored locally via AsyncStorage.

## Architecture
- **Framework**: Expo (React Native) ~53.0.0
- **Language**: JavaScript (React Native)
- **Entry point**: `index.js` → `App.js` (single-file app)
- **Storage**: AsyncStorage (on-device only, no backend)
- **Platform**: Web (via Expo web) + Android/iOS (via Expo Go / EAS Build)

## Key Features
- Monthly total tracker with INR currency
- Daily ₹500 spend limit with progress bar
- Transaction history with swipe to edit/delete
- Month-grouped history view
- Share expense summary as PNG

## Running the App

### Development (Web)
The app runs via `npx expo start --web --port 5000` on port 5000.

### Mobile (Expo Go)
Users can scan the QR code in the app preview to test on physical devices via Expo Go.

### Android APK Build
Built via EAS Build (GitHub Actions CI/CD configured in `.github/workflows/eas-build.yml`).

## Dependencies Added for Web
- `react-dom@18.3.1` — matches React 18.3.1
- `react-native-web@0.21.2` — Expo web renderer
- `@expo/metro-runtime@5.0.5` — Metro bundler runtime for web

## Configuration Notes
- `app.json`: Removed `expo-haptics` from plugins array (only needed for native builds, causes issues in Node 20 web environment)
- The app uses AsyncStorage for all data persistence; no backend or database needed

## Project Structure
```
HoudeKharcha/
├── App.js          # Entire app in one file
├── index.js        # Entry point
├── app.json        # Expo config
├── package.json    # Dependencies
├── babel.config.js # Babel config (includes reanimated plugin)
└── assets/         # Icons and splash screens
```
