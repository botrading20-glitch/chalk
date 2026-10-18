# Google Play groundwork

Prepared 2026-10-17 (LAUNCH-M7). **Nothing is submitted, and nothing here costs money until the owner decides.** Google's rules and fees change, so each fact below that comes from outside this repo is marked *check* and should be confirmed in the Play Console and Google's docs before acting.

## The route: a Trusted Web Activity

Setward is a PWA, so the free way onto Google Play is a Trusted Web Activity (TWA): a thin Android app that opens the live site full-screen in Chrome, with no browser bar once the site is verified. No code changes are needed in the app.

- Tooling, both free: [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) (command line, needs Node, a JDK and the Android SDK, which it can download) or [PWABuilder](https://www.pwabuilder.com) (web page, produces the Android package). *check* which is simpler on the day.
- The app opens the live address `https://botrading20-glitch.github.io/chalk/` (the manifest's `start_url` and `scope`, which must not change: NN-12). Updates to the site reach Android users at once; the store app only needs a new release for a change to the wrapper or its listing.
- What the repo already provides for it: a valid manifest with icons (192, 512, maskable), `categories`, `shortcuts` (Start workout, Log body weight), `screenshots`, a service worker that makes it installable offline, a static privacy page (`public/privacy.html`), an MIT licence, and a 1024 × 500 feature graphic (`branding/store/feature-graphic.png`).

## Digital Asset Links (the one real obstacle)

For Chrome to hide its address bar, the site must vouch for the app with a file at the **root of the origin**: `https://botrading20-glitch.github.io/.well-known/assetlinks.json`. The app lives under `/chalk/`, and a GitHub *project* site cannot serve a file at the origin root.

A free fix: create a second public repository named exactly `botrading20-glitch.github.io` (GitHub's "user site"). It serves the root of that origin. Put in it:

- `.well-known/assetlinks.json`, with the package name and the SHA-256 fingerprint of the **Play App Signing key** (Play Console → Release → Setup → App signing; the upload key's fingerprint is not the one to use);
- an empty `.nojekyll` file, because GitHub Pages' Jekyll step would otherwise skip the dot-directory.

The origin-root file covers every path on the origin, so `/chalk/` is verified. This repository's deploy workflow does not need to change. A custom domain would also work but costs money, so it is not the plan. Without verification the app still works, but Chrome shows a URL bar on top.

## Owner decisions (all open)

| Decision | Notes |
|----------|-------|
| Create a Play developer account | One-time registration fee, US$25 *check*; identity verification is required. This is a store fee, not hosting, so it does not break NN-01, but it is the first cost in the project: the owner decides. |
| Closed test before production | *check:* a new personal developer account has had to run a closed test with a minimum number of testers (12) for 14 days in a row before it can apply for production. That means recruiting people. |
| Package name | Cannot be changed after the first upload. Suggestion: `io.github.botrading20_glitch.setward` (lower case, underscores allowed, no hyphens). The name must match `assetlinks.json`. |
| Contact email | Play requires a public contact email for the listing. |
| Copyright holder in `LICENSE` | Currently "The Setward authors". Put a name there if the owner wants one. |
| Developer name shown on the listing | Personal name or a chosen display name. |

## Listing and forms

- **Listing text:** `branding/store/listing.md` (name, 80-character and full descriptions, category Health & Fitness, what's new).
- **Graphics:** icon 512 × 512 from `public/icon-512.png`; feature graphic from `branding/store/feature-graphic.png`. **Phone screenshots are not ready for Play:** the files in `public/store/` are 824 × 1830 (2.2:1) and Play allows at most 2:1. Retake them on a phone (1080 × 1920) or crop before uploading.
- **Privacy policy URL:** `https://botrading20-glitch.github.io/chalk/privacy.html` (static, same text as About → Privacy, in more detail).
- **Content rating:** answer the IARC questionnaire truthfully: no violence, no user-generated content shared with others, no purchases, no ads. Expect a rating for everyone.
- **Target audience:** not designed for children; choose adults and teens (13+) *check wording*.
- **Health apps declaration:** *check* whether Play asks for one for a Health & Fitness app. The honest answer: workout logging only, no medical features, no health data leaves the device unless the user turns on sync to their own repository.
- **Data safety form** (suggested answers, to be confirmed against the console's wording):
  - Does the app collect or share any required user data types? **No.** Workouts, routines, settings and body weight stay on the device.
  - Optional cloud sync is started by the user and sends data only to a private GitHub repository that the user owns, with a token the user created. The privacy page says so. If the console asks about it, describe it as a user-initiated transfer to the user's own storage.
  - Data encrypted in transit: yes (HTTPS). Users can request deletion: yes, in the app (Settings → Your data → Erase all data) and by deleting the repository.
  - Set videos (1.1): a video the user attaches to a set is stored only in the app's local storage on the phone. It is not synced, not in backups and never sent anywhere, so it is not collected or shared. The phone's camera app opens for recording (an `<input type="file" capture>`, no camera permission for the app).
  - No ads, no analytics, no third-party SDKs.
- **Permissions:** the TWA asks for none. The web app uses vibration, audio, the Wake Lock API and the share sheet, none of which need an Android permission. Recording a set video hands off to the phone's camera app, which needs no permission either.

## Before the first upload (testing)

1. Lighthouse / PWABuilder report on the live site: installable, no manifest errors (the new `shortcuts` and `screenshots` are checked there).
2. Build the wrapper, install it on a real phone, and run the phone checks in `RELEASE_CHECKLIST.md` inside it. Pay special attention to **the rest alert with the screen off** (`restAlert.ts`): audio and the Media Session lock-screen player may behave differently in a TWA than in the Chrome tab where they were tested.
3. Confirm the address bar is hidden (Digital Asset Links verified) and that the back button leaves the app from the Workout screen.
4. Confirm an offline start works from the wrapper.
5. Confirm the home-screen shortcuts open the right screens (`#/?action=start` and `#/?action=weigh`).
6. Retake the screenshots at 1080 × 1920.

## Out of scope

- The Apple App Store: it needs a Mac, a paid developer programme and a different wrapper. iPhone users install from Safari (Share → Add to Home Screen), and the app warns them about Safari clearing the data of sites that are not on the home screen.
- Paid features, ads and analytics: none, by NN-01.
