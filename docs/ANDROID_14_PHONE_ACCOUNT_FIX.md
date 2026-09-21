# Android 14+ PhoneAccount Registration SecurityException Fix

## Problem

When running the LiveKit Softphone app on Android 14 and above, the following exception occurred during CallKeep initialization:

```
java.lang.SecurityException: Registering a PhoneAccount requires either:
(1) The Service definition requires that the ConnectionService is guarded with the BIND_TELECOM_CONNECTION_SERVICE,
which can be defined using the android:permission tag as part of the Service definition.
(2) The PhoneAccount capability called CAPABILITY_SUPPORTS_TRANSACTIONAL_OPERATIONS.
```

### Root Cause

Starting with Android 14, Google strengthened security requirements for registering `PhoneAccount` objects with the `TelecomManager`. The system now requires that any app registering a `PhoneAccount` must either:

1. **Protect the ConnectionService** with the `BIND_TELECOM_CONNECTION_SERVICE` permission in AndroidManifest.xml, OR
2. **Add the capability** `CAPABILITY_SUPPORTS_TRANSACTIONAL_OPERATIONS` to the `PhoneAccount` being registered

The `react-native-callkeep` library (v4.3.16) was creating `PhoneAccount` objects with only `CAPABILITY_CALL_PROVIDER` or `CAPABILITY_SELF_MANAGED`, without including the required `CAPABILITY_SUPPORTS_TRANSACTIONAL_OPERATIONS` capability.

## Solution

Updated the `react-native-callkeep` patch to add the `CAPABILITY_SUPPORTS_TRANSACTIONAL_OPERATIONS` capability to the `PhoneAccount` builder.

### Changes Made

**File**: `mobile/patches/react-native-callkeep+4.3.16.patch`

**Modified Java Source**: `node_modules/react-native-callkeep/android/src/main/java/io/wazo/callkeep/RNCallKeepModule.java`

**Method**: `registerPhoneAccount(Context appContext)` (line ~1116)

**Before**:

```java
PhoneAccount.Builder builder = new PhoneAccount.Builder(handle, appName);
if (isSelfManaged()) {
    builder.setCapabilities(PhoneAccount.CAPABILITY_SELF_MANAGED);
}
else {
    builder.setCapabilities(PhoneAccount.CAPABILITY_CALL_PROVIDER);
}
```

**After**:

```java
PhoneAccount.Builder builder = new PhoneAccount.Builder(handle, appName);
if (isSelfManaged()) {
    int capabilities = PhoneAccount.CAPABILITY_SELF_MANAGED;
    // Required for Android 14+ to avoid SecurityException on registerPhoneAccount
    capabilities |= PhoneAccount.CAPABILITY_SUPPORTS_TRANSACTIONAL_OPERATIONS;
    builder.setCapabilities(capabilities);
}
else {
    // Required for Android 14+ to avoid SecurityException on registerPhoneAccount
    int capabilities = PhoneAccount.CAPABILITY_CALL_PROVIDER | PhoneAccount.CAPABILITY_SUPPORTS_TRANSACTIONAL_OPERATIONS;
    builder.setCapabilities(capabilities);
}
```

### Implementation Details

1. **Bitwise OR operation** (`|`) is used to combine the capabilities, allowing both the original capability and the new required capability to be set.
2. **Self-Managed Path**: For apps that manage calls themselves (self-managed mode), the new capability is added via bitwise OR.
3. **Call Provider Path**: For apps using the standard call provider pattern, the new capability is included in the initial bitwise expression.
4. **Backward Compatibility**: The fix maintains compatibility with earlier Android versions and does not change any functional behavior—it only adds the required permission.

### Verification

The patch is applied automatically via the `postinstall` script (already configured in `package.json`):

```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

When dependencies are installed with `npm ci` or `npm install`, the patch is automatically applied to the `react-native-callkeep` module.

### Testing

1. **Rebuild Android Project**:

   ```bash
   cd mobile
   npx expo prebuild --clean --platform android
   ```

2. **Install and Run**:

   ```bash
   npx expo run:android
   ```

3. **Verify**: The incoming call native UI should display without the `SecurityException` on Android 14+.

## Impact

- **Fixes**: The `java.lang.SecurityException` when registering PhoneAccount on Android 14+
- **Enables**: Incoming call notifications via the native CallKeep integration
- **No Breaking Changes**: Existing functionality is preserved; only capabilities are enhanced
- **Android Compatibility**: Works on all Android versions from API 24+ (the library's minimum SDK)

## Why This Approach?

While adding `BIND_TELECOM_CONNECTION_SERVICE` permission to the manifest (alternative approach #1) would also work, this solution is preferred because:

1. **Cleaner**: No need to create a custom Expo plugin to merge AndroidManifest.xml
2. **Isolated**: Fix is contained in a single library patch, easy to audit
3. **Maintainable**: When `react-native-callkeep` is updated, the patch can be applied to the new version
4. **Sufficient**: The capability requirement is the recommended approach for modern apps

## Related Issues

- React-native-callkeep Issue: https://github.com/react-native-webrtc/react-native-callkeep/issues
- Android 14 TelecomManager Changes: https://developer.android.com/about/versions/14/changes
