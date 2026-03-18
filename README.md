# HoudeKharcha 🪙
**होउ दे खर्च · Private INR Expense Tracker**

A fully offline, on-device expense tracker built with Expo (React Native).
No cloud sync. No ads. Your data stays on your phone.

---

## Features

| Feature | Detail |
|---|---|
| Storage | On-device only via AsyncStorage — no cloud, fully private |
| Currency | INR (₹) throughout |
| Daily Limit | ₹500 with colour-coded progress bar (auto-resets daily) |
| Monthly Total | Auto-resets on the 1st of each month via date filtering |
| Date Selection | Pre-filled "Today"; tap to pick any past date; shows "Today"/"Yesterday"/date |
| Haptics | Success on add/update, medium on delete, selection on swipe |
| Swipe Actions | Swipe left on any transaction → Edit (blue) or Delete (red) |
| Edit Expense | Pre-filled modal with original date, amount, note, category |
| Delete | Confirmation alert before deletion; haptic on confirm |
| Month Grouping | History separated by month headers with per-month totals |
| Share | Captures summary cards A+B+C as PNG, opens share sheet |

---

## Bento Dashboard Cards

- **Card A** – Monthly total (Emerald accent, large bold figure)
- **Card B** – Today's spend vs ₹500 daily limit with colour-coded progress bar
- **Card C** – Transaction count today with category dot indicators
- **Card D** – Month-grouped scrollable history; swipe left to edit/delete

---

## Building the APK

### Option A — GitHub Actions (automated, recommended)

Every push to `main` triggers an EAS build that produces a downloadable `.apk`.

**One-time setup:**

1. **Create an Expo account** at https://expo.dev
2. **Run locally once** to link the project:
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure   # fills in projectId in app.json automatically
   ```
3. **Add your Expo token to GitHub secrets:**
   - Go to your repo → Settings → Secrets and variables → Actions
   - Add secret: `EXPO_TOKEN` = your token from https://expo.dev/accounts/[you]/settings/access-tokens
4. **Push to main** — the workflow at `.github/workflows/eas-build.yml` runs automatically.
5. **Download the APK** from the GitHub Actions run → Artifacts → `HoudeKharcha-APK`.

---

### Option B — Build locally

```bash
# 1. Clone repo
git clone https://github.com/ppfawade/HoudeKharcha.git
cd HoudeKharcha

# 2. Install dependencies
npm install

# 3. Login to EAS
eas login

# 4. Configure project (first time only — updates app.json with projectId)
eas build:configure

# 5. Build APK
eas build --platform android --profile preview

# 6. When build completes, EAS prints a download URL for the .apk
```

---

### Option C — Run in Expo Go (no build needed)

```bash
npm install
npx expo start
```
Scan the QR code with **Expo Go** on your Android/iOS device.

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for Option C)

### Install dependencies

```bash
npm install
# or install individually:
npx expo install @react-native-async-storage/async-storage
npx expo install expo-haptics
npx expo install expo-sharing
npx expo install react-native-view-shot
npx expo install lucide-react-native react-native-svg
npx expo install react-native-gesture-handler
npx expo install @react-native-community/datetimepicker
```

---

## Project Structure

```
HoudeKharcha/
├── App.js                        # Entire app — single file
├── app.json                      # Expo config (name, package, icons)
├── eas.json                      # EAS Build profiles (preview APK / production AAB)
├── package.json                  # Dependencies
├── babel.config.js               # Babel config (includes reanimated plugin)
├── index.js                      # Entry point
├── assets/
│   ├── icon.png                  # App icon (1024×1024)
│   ├── splash.png                # Splash screen (1284×2778)
│   ├── adaptive-icon.png         # Android adaptive icon (1024×1024)
│   └── favicon.png               # Web favicon (48×48)
└── .github/
    └── workflows/
        └── eas-build.yml         # CI/CD: auto-build APK on push to main
```

---

## Color Palette

| Token | Hex |
|---|---|
| Background | `#0F172A` |
| Card | `#1E293B` |
| Accent (Emerald) | `#10B981` |
| Text | `#F1F5F9` |
| Muted | `#94A3B8` |

---

## Notes

- `react-native-view-shot` captures the `bentoWrapper` ref (Cards A, B, C only) — history list excluded from share image.
- Dates are stored at noon local time to prevent timezone-related off-by-one day bugs.
- `@react-native-community/datetimepicker` uses spinner on iOS and calendar on Android.
- The modal auto-closes 900 ms after a successful add/edit.
- All data lives in `AsyncStorage` under key `@houde_kharcha_expenses`.
