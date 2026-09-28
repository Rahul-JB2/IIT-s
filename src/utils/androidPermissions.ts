import { AndroidPermissionConfig, BlockedAppConfig } from '../types/jee';

// Real Android System Permissions required by native app blockers / digital wellbeing apps
export const ANDROID_PERMISSIONS: AndroidPermissionConfig[] = [
  {
    id: 'usage_stats',
    name: 'Usage Access Permission',
    permissionKey: 'android.permission.PACKAGE_USAGE_STATS',
    intentAction: 'android.settings.USAGE_ACCESS_SETTINGS',
    description: 'Detects in real-time when YouTube, Chrome, Pocket FM, or Games are launched in foreground.',
    requiredFor: 'App Detection & Foreground Monitoring',
    granted: true,
    isCritical: true,
  },
  {
    id: 'overlay',
    name: 'Display Over Other Apps (Overlay)',
    permissionKey: 'android.permission.SYSTEM_ALERT_WINDOW',
    intentAction: 'android.settings.action.MANAGE_OVERLAY_PERMISSION',
    description: 'Renders the JEE Study Guard lock screen over YouTube/Chrome when opened outside reward hours.',
    requiredFor: 'Interception Lock Screen & Siren Overlays',
    granted: true,
    isCritical: true,
  },
  {
    id: 'accessibility',
    name: 'Accessibility Service',
    permissionKey: 'android.permission.BIND_ACCESSIBILITY_SERVICE',
    intentAction: 'android.settings.ACCESSIBILITY_SETTINGS',
    description: 'Instantly captures window state changes and blocks distracting apps within 50ms of tapping them.',
    requiredFor: 'Instant App Intercept & Back-to-Study Redirect',
    granted: true,
    isCritical: true,
  },
  {
    id: 'dnd_policy',
    name: 'Do Not Disturb & Notification Access',
    permissionKey: 'android.permission.ACCESS_NOTIFICATION_POLICY',
    intentAction: 'android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS',
    description: 'Mutes incoming notifications from YouTube, Instagram, WhatsApp, and Games during active study hours.',
    requiredFor: 'Zero Notification Interruptions',
    granted: true,
    isCritical: false,
  },
  {
    id: 'battery_opt',
    name: 'Ignore Battery Optimization',
    permissionKey: 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
    intentAction: 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
    description: 'Prevents Android OS from killing background Study Guard process when screen is locked or idle.',
    requiredFor: 'Continuous Background Protection',
    granted: true,
    isCritical: false,
  },
];

// Default Blocked Apps that can only be unlocked with specific Game Rewards / Passes
export const DEFAULT_BLOCKED_APPS: BlockedAppConfig[] = [
  {
    id: 'youtube',
    appName: 'YouTube & Shorts',
    packageName: 'com.google.android.youtube',
    category: 'video',
    isBlockedByDefault: true,
    allowedWithPassType: 'youtube',
    icon: 'play',
    playStoreUrl: 'market://details?id=com.google.android.youtube',
    launchUrlScheme: 'vnd.youtube://',
  },
  {
    id: 'chrome',
    appName: 'Google Chrome',
    packageName: 'com.android.chrome',
    category: 'browser',
    isBlockedByDefault: true,
    allowedWithPassType: 'chrome',
    icon: 'globe',
    playStoreUrl: 'market://details?id=com.android.chrome',
    launchUrlScheme: 'googlechrome://',
  },
  {
    id: 'pocket_fm',
    appName: 'Pocket FM (Audio Stories)',
    packageName: 'com.pocketfm.android',
    category: 'audio',
    isBlockedByDefault: true,
    allowedWithPassType: 'pocket_fm',
    icon: 'headphones',
    playStoreUrl: 'market://details?id=com.pocketfm.android',
    launchUrlScheme: 'pocketfm://',
  },
  {
    id: 'games_bgmi',
    appName: 'Phone Games (BGMI / Free Fire)',
    packageName: 'com.pubg.imobile',
    category: 'games',
    isBlockedByDefault: true,
    allowedWithPassType: 'game',
    icon: 'gamepad-2',
    playStoreUrl: 'market://details?id=com.pubg.imobile',
    launchUrlScheme: '',
  },
  {
    id: 'instagram',
    appName: 'Instagram & Reels',
    packageName: 'com.instagram.android',
    category: 'social',
    isBlockedByDefault: true,
    icon: 'camera',
    playStoreUrl: 'market://details?id=com.instagram.android',
    launchUrlScheme: 'instagram://',
  },
];

/**
 * Triggers Android OS native settings intent for a given permission
 */
export function openAndroidPermissionSettings(intentAction: string): void {
  try {
    // Construct standard Android intent deep URI
    const androidIntentUri = `intent:#Intent;action=${intentAction};end`;
    
    // In Android webview / Chrome for Android, window.location.href or an anchor tag navigates to native settings
    const anchor = document.createElement('a');
    anchor.href = androidIntentUri;
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } catch (err) {
    console.warn('Unable to invoke native Android intent:', err);
  }
}
