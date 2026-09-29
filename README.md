# Chirag Eye Care mobile

Bare React Native 0.84 + TypeScript app for the existing `chirag_eyecare` Express/MongoDB backend. Android and iOS projects are included. All application screens use native React Native components; there is no Expo or embedded web frontend. Native printing renders a separate HTML receipt through the operating system print service.

## Run on Android

Requirements: Node 22.11+, JDK 17, Android Studio, Android SDK 36, build-tools 36.0.0, NDK 27.1.12297006, and an emulator or USB-connected phone. Gradle can install missing SDK components after their licences are accepted.

```bash
cd chirag-mobile
npm ci
npm start
```

In another terminal:

```bash
cd chirag-mobile
npm run android
```

The app connects automatically to `https://chirag-eye-care.onrender.com/api/v1`. Sign in with your clinic email and password. The backend URL is fixed in `src/api.ts` and cannot be edited in the app. Sessions saved for a different server are cleared on startup so you can sign in to the configured clinic.

## UI dependencies

The shared UI uses Lucide icons through `lucide-react-native` and `react-native-svg`. After pulling this update, run `npm ci` and rebuild Android with `npm run android`; a Metro reload alone cannot add the native SVG module. For iOS, install pods before rebuilding as shown below.

## Run on iOS

On a Mac with Xcode and CocoaPods:

```bash
cd chirag-mobile
npm ci
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios
```

Use the Xcode workspace for device signing. iOS native compilation requires macOS and cannot be verified on this Linux workspace.

## APKs

```bash
cd android
./gradlew assembleDebug
./gradlew assemblePreview
```

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Run Metro for development.
- Preview APK: `android/app/build/outputs/apk/preview/app-preview.apk`. Contains the JavaScript bundle, uses the development signing key, and connects to HTTPS APIs. Intended for installation/testing, not Play Store distribution.
- Store builds: configure your own release signing key, then use `./gradlew bundleRelease`. Signing credentials are not committed.

## Feature coverage

| Existing web flow | Native mobile implementation |
| --- | --- |
| Login/logout | Existing `/auth/login`, `/auth/me`, secure Keychain/Keystore session, 401 expiration, password visibility, configurable server |
| Dashboard | Today’s patients/collections, weekly/monthly totals, dues, order counts, weekly trend, recent visits, quick actions |
| Patient list/registration/edit | Search name/phone/public ID; every page loaded; optional demographic, medical and registration investigation fields; explicit field clearing on edit |
| Patient profile | Billing totals, latest examination, all visits/orders/payments, full timeline, call action, registration receipt |
| Registration investigation | Both eyes: unaided/corrected/pinhole/near vision, SPH/CYL/axis/ADD/IOP; PD and remarks |
| Visits | Date filter in India time, all-date option, patient selection, complaint/symptoms, bilateral examination including VA, doctor notes, follow-up date, visit date and remarks |
| Diagnoses | Multiple custom/preset diagnoses, OD/OS/OU, provisional/confirmed, removable rows |
| Prescriptions | Catalogue or custom medicine, strength, quantity, unit price, eye, dosage, frequency, duration, instructions; add/remove items |
| Visit billing | Default consultation fee from settings, medicine totals, other charges, discount and calculated bill |
| Spectacle orders | Patient/visit association, latest eye readings prefilled, all optical/frame/lens/price/date/note fields, editable order, forward status transitions, unpaid cancellation |
| Payments | Outstanding bill selection, partial/full payments, Cash/UPI/Card/Other, payment date, reference/notes, overpayment prevention, today/cash/due summaries and search |
| Medicines | Search, create, edit all catalogue fields and deactivate through the active toggle |
| Receipts | Registration, consultation/prescription, spectacle order and payment; native print/Save PDF, escaped printable content, clinic header, bill/payment/due totals, share summary |
| Reports | Today/last seven days/month/custom dates, method breakdown, daily trend and share report |
| Settings | Doctor/shop name, contacts/address, registration number, default fee; password change |

Native UX includes safe-area layouts, bottom navigation, Android back handling, keyboard avoidance, calendar date selection, searchable choice sheets, loading/error/empty states, refresh, and discard confirmation for patient/visit/order/payment forms. Saved forms are removed from navigation history to prevent accidental resubmission.

Print opens the OS print dialog. Android can select “Save as PDF”; iOS uses AirPrint / the system print preview sharing flow. Payment receipts use the backend's billing-only response and do not include clinical notes. The app records already-received payments; it does not charge a card or verify UPI automatically.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/chirag.android.js --max-workers 2
```

Tests cover app launch, authentication storage/expiration, pagination, backend envelopes, patient field clearing, clinical values including zero, visit/prescription payloads, billing validation, cancelled-order exclusions, dates, and printable receipt escaping. `backend-contract.test.ts` validates mobile payloads against the actual sibling backend Zod schemas and therefore requires `../chirag eyecare` and its dependencies.

Backend's isolated API tests:

```bash
cd '../chirag eyecare'
npm test
```

## Code map

- `App.tsx`: login, session bootstrap and stack/tab navigation.
- `src/api.ts`: authenticated API, secure session persistence, timeout/error handling, complete pagination.
- `src/forms.tsx`: patient, consultation, prescription, spectacle, medicine and settings forms and payload validation.
- `src/screens.tsx`: dashboard, lists, patient history, payments, orders, reports, receipts and password.
- `src/ui.tsx`: native components, calendar, searchable option sheets and visual styles.
- `src/receipts.ts`: escaped, printable receipt layouts.
- `patches/react-native-print+0.11.0.patch`: Android namespace/SDK compatibility and activity checks; reapplied by `npm ci`.

`.npmrc` excludes peer auto-installation because the print package declares a Windows peer even though this project targets Android/iOS. The lockfile fixes dependency versions. The backend and web application are kept in their existing directories.

For an isolated manual UI smoke test (no production data), run `node scripts/demo-backend.mjs`, then `node scripts/seed-demo.mjs` in another terminal. The first script prints its temporary test login and serves the actual backend on port 4100. Use `adb reverse tcp:4100 tcp:4100` and `http://localhost:4100/api/v1` in a debug app. Stopping the server removes the temporary database. Demo records are never bundled into the app.

The app icon adapts the web app’s existing eye/lamp mark. Regenerate checked-in Android/iOS icons with `python3 scripts/generate-icons.py` (Pillow required).

Official native setup reference: [React Native without a framework](https://reactnative.dev/docs/0.84/getting-started-without-a-framework).
