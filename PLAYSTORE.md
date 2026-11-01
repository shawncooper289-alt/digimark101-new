# DigiMark101 Play Store

The public site at https://www.digimark101.com is now a Progressive Web App. It can be packaged as a Trusted Web Activity (TWA) and submitted to the Google Play Store.

## What is ready

- `public/manifest.webmanifest` — standalone display, theme, start URL
- `public/sw.js` — basic service worker for installability
- Layout metadata and viewport for mobile/PWA
- Icons expected at `/icon-192.png`, `/icon-512.png`, `/icon-maskable-512.png` (add these before final packaging)

## Generate the Android app (Bubblewrap)

1. Install the Bubblewrap CLI:
   ```bash
   npm i -g @bubblewrap/cli
   ```
2. From a clean folder:
   ```bash
   bubblewrap init --manifest=https://www.digimark101.com/manifest.webmanifest
   ```
3. Follow the prompts (package name, app name, signing key).
4. Build the AAB:
   ```bash
   bubblewrap build
   ```
5. The output `app-release-bundle.aab` is what you upload to Play Console.

## Play Console checklist

- Google Play Developer account
- Signed AAB from Bubblewrap
- Privacy policy URL (already on the site at /privacy)
- Store listing: short description, full description, screenshots (phone + tablet), feature graphic
- Content rating questionnaire
- App category: Business or Productivity
- Target audience and data safety form

## Icons

Add these PNG files to `public/` before running Bubblewrap:

- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-maskable-512.png` (512×512, safe zone for adaptive icons)

Use a dark background matching `#0b0d0e` and the DigiMark101 / Ava mark.

## After deploy

Once the site is live with the manifest and icons, the Bubblewrap package will open digimark101.com full-screen on Android and can be published on the Play Store.
