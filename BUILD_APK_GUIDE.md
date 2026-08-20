# 🎮 Jungle Warfare Pro - Android APK Build Guide

This project includes automated **GitHub Actions CI/CD** to build your installable Android `.apk` file directly in the cloud, as well as local build options.

---

## 🚀 Method 1: Automated GitHub Actions (Recommended - No Android Studio Needed)

1. **Push your code to GitHub**:
   - Push this entire repository (including the `.github/workflows/build-apk.yml` file) to your GitHub repository.
2. **Go to GitHub Actions**:
   - In your GitHub repo, click on the **"Actions"** tab at the top.
   - Click on the **"Build Android APK"** workflow on the left sidebar.
3. **Run or Trigger the Build**:
   - The build triggers automatically whenever you push to `main` or `master`.
   - You can also click **"Run workflow"** -> **"Run workflow"** button to trigger it manually anytime.
4. **Download your APK**:
   - When the workflow finishes (usually in 2-3 minutes with a green checkmark ✅), click on the completed run.
   - Scroll down to the **"Artifacts"** section at the bottom.
   - Click **`JungleWarfarePro-Android-APK`** to download your zip file containing `JungleWarfarePro.apk`.
   - Install the `.apk` on your Android phone!

---

## 💻 Method 2: Build Locally on your PC / Mac

### Prerequisites
- Node.js (v18+)
- Java JDK 17
- Android Studio (with Android SDK Command-line Tools)

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Build game web bundle
npm run build

# 3. Add Capacitor Android project
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android

# 4. Open in Android Studio or build APK directly
npx cap open android

# Or build APK directly via command line:
cd android
./gradlew assembleDebug
```
Your compiled APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📱 Features Included in the APK Build:
- **Full Landscape Sensor Lock**: Locks orientation in widescreen landscape mode for optimal controls and wide field of view.
- **Hardware Acceleration**: Smooth WebGL 60 FPS rendering on Android GPUs.
- **FamPay UPI & Payment Gateway**: Direct deep linking into UPI apps (FamPay, GPay, PhonePe, Paytm).
- **Firestore Cloud Sync**: Live cloud high-scores and purchase history synchronization.
