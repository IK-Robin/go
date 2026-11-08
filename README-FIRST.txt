RobinLinks FIXED — project link-shortener-288ce

CAUSES FOUND IN YOUR ZIP:
- GitHub Pages files were nested in public/; Pages published from repository root needs index.html and 404.html at root.
- New dashboard depended on Cloud Functions, which are NOT deployed by uploading to GitHub.
- HTML alias pattern generated a browser regex error.
- public/firebase-config.js differed from the working config at repository root.

QUICKEST RESTORE (NO BLAZE REQUIRED):
1. Upload ONLY the 3 files inside github-pages-upload/ into the ROOT of your GitHub go repository. Do not upload the containing folder.
2. Firebase Console > Firestore Database > Rules: paste firestore-free.rules and Publish.
3. Keep Firebase Authentication Google enabled and ik-robin.github.io authorized.
4. Test https://ik-robin.github.io/go/ and https://ik-robin.github.io/go/s/rvai1.
5. Existing links with no ownerUid still redirect but are not visible in the personal dashboard. Add ownerUid manually using your Google Auth UID if needed.
6. IMPORTANT: Free mode cannot securely protect destinations with passwords or provide tamper-resistant click analytics. Do NOT treat the link as password-protected in this mode. Any legacy password-protected destination is exposed through public Firestore get. Use advanced mode to secure it.

ADVANCED MODE (BLAZE REQUIRED):
- advanced-cloud-functions/public contains the updated dashboard and redirect, with correct project ID and alias regex.
- advanced-cloud-functions/functions contains backend source; it MUST be deployed with firebase deploy --only functions.
- Deploy functions, replace GitHub root HTML with advanced public files, then deploy advanced firestore.rules.
- Functions must exist in asia-southeast1. Check firebase functions:list.
- Add abuse protections before public launch.

DO NOT deploy both rules files: choose the rules matching the mode you are using.
