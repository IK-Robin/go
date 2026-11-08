RobinLinks SIMPLE — Firebase project link-shortener-288ce

GITHUB PAGES REPO ik-robin/go, publishing from main / (root):
  index.html
  404.html
  firebase-config.js

Upload ONLY those 3 files to the ROOT of your go GitHub repository. Do NOT upload folders named github-pages-upload, public, functions, or advanced-cloud-functions.

FIREBASE: Console > Firestore Database > Rules: paste firestore.rules and click Publish. Do not upload firestore.rules to GitHub expecting it to apply automatically.
Firebase Authentication > Sign-in method: Google enabled. Authorized domains: ik-robin.github.io.

Existing links stay in links/{alias}; existing links without ownerUid will redirect but will not show in personal dashboard. Add ownerUid to them in Firebase Console if needed.

Click events are stored in links/{alias}/clickEvents/{randomId}. Click count is the number of event documents. This is a best-effort anonymous client-side counter and can be spoofed or blocked. It may incur many Firestore writes and reads, and old click events remain if a link is deleted. It does not store IP or user agent. No charts, device/country analytics, QR library, passwords or Cloud Functions.

If create fails, verify the published rules, Google sign-in, and whether the alias already exists.
