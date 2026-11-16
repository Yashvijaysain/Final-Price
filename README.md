# Final Price — Android App Build Guide

This folder is a ready-to-build **Capacitor** Android project. It wraps your
Final Price calculator in a real native Android app shell, with your logo as
the app icon and splash screen.

---

## OPTION A — Fastest path to Play Store (no coding, ~15 minutes)

You don't even need this folder for this option — use the PWA file instead
(`flat-price-calculator.html`, already has offline support + manifest).

1. Host that HTML file somewhere public (Vercel, Netlify, GitHub Pages —
   just make sure it's reachable at a public URL, renamed to `index.html`
   at the root, e.g. `https://finalprice.vercel.app`).
2. Go to **https://www.pwabuilder.com**
3. Paste your URL and click "Start".
4. PWABuilder scores your PWA (it should score well — you already have a
   manifest, icons, and a service worker for offline support).
5. Click **"Package for Stores" → Android**. It generates a signed
   `.aab` (Android App Bundle) file ready to upload to Play Console.
6. Create a Google Play Developer account (one-time $25 fee) at
   https://play.google.com/console, create a new app, and upload the `.aab`.
7. For iOS, PWABuilder can also generate an Xcode project — you'll still
   need a Mac + Apple Developer account ($99/year) to build and submit it.

This is the quickest route to an installable, Play-Store-listed app using
what you already have.

---

## OPTION B — Native app from this Capacitor project (more control)

### Prerequisites (install on your own computer)
- **Android Studio** (free): https://developer.android.com/studio
- **Node.js** (v18+): https://nodejs.org

### Steps

1. Copy this whole `finalprice-app` folder to your computer.
2. Open a terminal inside the folder and run:
   ```
   npm install
   npx cap sync android
   ```
3. Open Android Studio → "Open an existing project" → select the
   `android` subfolder inside this project.
4. Let Android Studio finish Gradle sync (first time can take a few
   minutes — it downloads the Android SDK components it needs).
5. To test on your phone: enable USB debugging on your Android phone,
   plug it in, and click the green Run ▶ button in Android Studio.
6. To build a release for Play Store:
   - In Android Studio: **Build → Generate Signed Bundle / APK**
   - Choose **Android App Bundle (.aab)**
   - Create a new keystore (keep this file and its passwords safe —
     you'll need the same keystore for every future update)
   - Build the release `.aab`
7. Upload the `.aab` to Google Play Console (same $25 one-time developer
   fee as Option A).

### For iOS (App Store)
You'll need a Mac. On it:
```
npx cap add ios
npx cap sync ios
npx cap open ios
```
This opens Xcode. From there you build, sign with your Apple Developer
account ($99/year), and submit via App Store Connect.

---

## What's already set up in this project

- App name: **Final Price**
- App ID: `com.ngrealty.finalprice` (change this in `capacitor.config.json`
  before publishing if you want a different package name — it can't be
  changed after your first Play Store upload)
- App icon and splash screen: generated from your logo, dark background
- Offline support: the web app inside (`www/index.html`) already has a
  service worker for offline calculator use
- All your calculator functionality (dark/light mode, rate/BSP sync,
  all charge fields) works exactly as it does in the browser version

## Notes

- Both Play Store and App Store require a privacy policy URL and some
  basic store listing info (screenshots, description, category) — you'll
  fill these in when creating the store listing, not in this project.
- If you rename the app ID before your first upload, do it now — Google
  Play permanently locks the package name (`com.ngrealty.finalprice`)
  after the first successful upload.
