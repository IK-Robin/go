# RobinLinks — GitHub Pages + Firebase

A custom URL shortener with Google sign-in, custom aliases, QR codes, click counts, daily charts, enabled/disabled links, expiration, duplicate warnings, destination domain preview, and optional password protection.

## Important limitations

- Firebase Cloud Functions normally requires the **Blaze billing plan**. Monitor billing and quotas.
- This is a working starter project, **not production-hardened**. Add rate limits, bot filtering, abuse reporting, quotas, password-attempt throttling, and destination URL safety screening before public launch.
- Click counts are raw opens (including bots/repeats), not unique humans. The redirect waits for a database write.
- Country analytics show `Unknown` because Firebase Functions does not provide a trusted country code by default. Device analytics are estimated from User-Agent.
- The preview displays destination hostname; it does not fetch the page's thumbnail.
- QR code creation uses the CDN-hosted `qrcode` library and requires internet access.
- Existing links must have `ownerUid` matching the signed-in Firebase user's UID to appear in the dashboard. Existing links without `enabled` remain active. Existing links start counting at zero.
- Existing password-protected destinations cannot be hidden from people who previously learned them; protection applies to short-link resolution only.
- Changing security rules before deploying the new redirect page will break old redirects. Coordinate deployment carefully.

## Files

- `public/index.html` — GitHub Pages dashboard
- `public/404.html` — short-link loading/redirect page
- `public/firebase-config.js` — Firebase web app configuration (replace placeholders)
- `functions/index.js` — Cloud Functions API
- `functions/package.json` — Node dependencies
- `firestore.rules` — Firestore security rules
- `firebase.json` — Firebase deploy configuration

## Setup

1. In Firebase Console, enable Authentication > Google, and add `ik-robin.github.io` to authorized domains.
2. In `public/firebase-config.js`, paste your EXISTING Firebase web app configuration. Never paste service account secrets into GitHub.
3. In Firebase Console, ensure Cloud Firestore is enabled. Your collection should be named `links`.
4. Install Node.js 22 and Firebase CLI: `npm install -g firebase-tools`.
5. Open terminal in this project's root: `firebase login`, then `firebase use --add` and choose your EXISTING project.
6. `cd functions && npm install && cd ..`.
7. Upgrade to Firebase Blaze if prompted, then deploy functions: `firebase deploy --only functions`.
8. Copy the function base URL from deploy output into `API` in BOTH `public/index.html` and `public/404.html` (e.g. `https://asia-southeast1-YOUR_PROJECT_ID.cloudfunctions.net`).
9. Upload the **contents** of `public/` to your existing GitHub Pages repository's published root (`go` repo). Preserve your existing GitHub Pages settings. `404.html` must be at the published root.
10. After the new HTML pages have been published and confirmed reachable, deploy Firestore rules: `firebase deploy --only firestore:rules`.
11. Test Google login, creating a new alias, redirect, click count, QR, analytics, disabling, expiration, password, deletion.

## Migration of existing links

In Firestore Console, for each old `links/{alias}` document, add a string field `ownerUid` set to your Google account's Firebase Authentication UID. Do not change the document ID or URL. The new backend accepts old documents that lack `enabled`, `clicks`, `expiresAt`, and `passwordHash`.

## Security and privacy

- Owners can read their own link records and daily analytics; anonymous users cannot directly read Firestore documents.
- Cloud Functions use the Admin SDK and bypass Firestore security rules, so review and secure them carefully.
- Passwords are hashed with bcrypt before storage.
- Password attempt rate limits and per-user creation quotas are **not yet implemented**. Do not advertise this as a hardened public shortener.
- Firebase Auth Google sign-in requires an approved authorized domain, not admin approval for individual Google users.
- Delete is handled by the backend and recursively removes analytics subcollections.

## Troubleshooting

- `permission-denied` when listing links: verify Google auth and `ownerUid` fields.
- `404` for functions: check deployed project ID, region, and the API base URL in both HTML files.
- Browser CORS errors: check the GitHub Pages origin and the Cloud Functions `ORIGIN` constant.
- `404.html` never runs: verify GitHub Pages published folder/root and the URL `/go/s/alias`.
- Wrong Firebase project: compare `firebase-config.js` projectId with `firebase use` project.
