# DigiMark101 Play Store (TWA) Setup

The site is now a proper PWA. Use Bubblewrap to generate the Android App Bundle for Google Play.

## Prerequisites
- Node.js 18+
- Google Play Developer account ($25 one-time)
- Domain ownership of digimark101.com

## Steps

1. Install Bubblewrap:
```bash
npm install -g @bubblewrap/cli
```

2. Initialize from the live manifest:
```bash
mkdir digimark101-twa && cd digimark101-twa
bubblewrap init --manifest=https://www.digimark101.com/manifest.webmanifest
```

During prompts:
- Application ID: `com.digimark101.app` (or your preferred package name)
- App name: DigiMark101
- Use the generated keystore or provide your own
- Theme color: #0b0d0e

3. Build:
```bash
bubblewrap build
```

This produces `app-release-bundle.aab` (upload this to Play Console) and a signed APK for testing.

4. After the first build, add Digital Asset Links:
   - Bubblewrap prints the SHA-256 fingerprint.
   - Create `public/.well-known/assetlinks.json` with the package name and fingerprint.
   - Redeploy the site.

5. In Play Console:
   - Create the app
   - Upload the AAB to internal testing first
   - Complete store listing (use the icons, screenshots of the studio, Ava description)
   - Note: New personal accounts need a closed test with 12 testers for 14 days before production.

The public site already has the improved manifest. Deploy this commit and the icons will be live.

Owner office (avaskye.online) remains separate and private.
