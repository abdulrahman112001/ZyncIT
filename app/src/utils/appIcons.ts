/**
 * App Icons Utility
 * Provides app icons for notifications based on package name
 * Supports both mapped icons (for popular apps) and dynamic icons from Firestore
 */

// Popular apps with their brand colors and icon names
export const APP_ICONS: {
  [key: string]: {
    name: string;
    iconName: string;
    color: string;
    iconType: 'ionicons' | 'material' | 'fontawesome';
  };
} = {
  // Messaging Apps
  'com.whatsapp': {
    name: 'WhatsApp',
    iconName: 'logo-whatsapp',
    color: '#25D366',
    iconType: 'ionicons',
  },
  'com.whatsapp.w4b': {
    name: 'WhatsApp Business',
    iconName: 'logo-whatsapp',
    color: '#25D366',
    iconType: 'ionicons',
  },
  'org.telegram.messenger': {
    name: 'Telegram',
    iconName: 'send',
    color: '#0088cc',
    iconType: 'ionicons',
  },
  'com.facebook.orca': {
    name: 'Messenger',
    iconName: 'chatbubbles',
    color: '#0084FF',
    iconType: 'ionicons',
  },
  'com.instagram.android': {
    name: 'Instagram',
    iconName: 'logo-instagram',
    color: '#E4405F',
    iconType: 'ionicons',
  },
  'com.snapchat.android': {
    name: 'Snapchat',
    iconName: 'logo-snapchat',
    color: '#FFFC00',
    iconType: 'ionicons',
  },
  'com.twitter.android': {
    name: 'X (Twitter)',
    iconName: 'logo-twitter',
    color: '#1DA1F2',
    iconType: 'ionicons',
  },
  'com.x.android': {
    name: 'X',
    iconName: 'logo-twitter',
    color: '#000000',
    iconType: 'ionicons',
  },
  'com.facebook.katana': {
    name: 'Facebook',
    iconName: 'logo-facebook',
    color: '#1877F2',
    iconType: 'ionicons',
  },
  'com.tiktok.android': {
    name: 'TikTok',
    iconName: 'logo-tiktok',
    color: '#000000',
    iconType: 'ionicons',
  },
  'com.linkedin.android': {
    name: 'LinkedIn',
    iconName: 'logo-linkedin',
    color: '#0A66C2',
    iconType: 'ionicons',
  },
  'com.discord': {
    name: 'Discord',
    iconName: 'logo-discord',
    color: '#5865F2',
    iconType: 'ionicons',
  },
  'com.spotify.music': {
    name: 'Spotify',
    iconName: 'musical-notes',
    color: '#1DB954',
    iconType: 'ionicons',
  },
  'com.google.android.youtube': {
    name: 'YouTube',
    iconName: 'logo-youtube',
    color: '#FF0000',
    iconType: 'ionicons',
  },
  'com.google.android.gm': {
    name: 'Gmail',
    iconName: 'mail',
    color: '#EA4335',
    iconType: 'ionicons',
  },
  'com.microsoft.teams': {
    name: 'Teams',
    iconName: 'people',
    color: '#6264A7',
    iconType: 'ionicons',
  },
  'com.slack': {
    name: 'Slack',
    iconName: 'chatbox',
    color: '#4A154B',
    iconType: 'ionicons',
  },
  // SMS Apps
  'com.google.android.apps.messaging': {
    name: 'Messages',
    iconName: 'chatbubble',
    color: '#1a73e8',
    iconType: 'ionicons',
  },
  'com.samsung.android.messaging': {
    name: 'Samsung Messages',
    iconName: 'chatbubble',
    color: '#1428A0',
    iconType: 'ionicons',
  },
  // Phone Apps
  'com.google.android.dialer': {
    name: 'Phone',
    iconName: 'call',
    color: '#1a73e8',
    iconType: 'ionicons',
  },
  'com.samsung.android.dialer': {
    name: 'Phone',
    iconName: 'call',
    color: '#1428A0',
    iconType: 'ionicons',
  },
};

// Type-based fallback icons
export const TYPE_ICONS: {
  [key: string]: { iconName: string; color: string };
} = {
  sms: { iconName: 'chatbubble', color: '#4CAF50' },
  whatsapp: { iconName: 'logo-whatsapp', color: '#25D366' },
  telegram: { iconName: 'send', color: '#0088cc' },
  call: { iconName: 'call', color: '#4CAF50' },
  email: { iconName: 'mail', color: '#EA4335' },
  social: { iconName: 'share-social', color: '#d5c19e' },
  other: { iconName: 'notifications', color: '#d5c19e' },
};

/**
 * Get app icon info based on package name or type
 */
export function getAppIconInfo(
  packageName?: string,
  type?: string,
): { iconName: string; color: string } {
  // Priority 1: Check by package name
  if (packageName && APP_ICONS[packageName]) {
    return {
      iconName: APP_ICONS[packageName].iconName,
      color: APP_ICONS[packageName].color,
    };
  }

  // Priority 2: Check by type
  if (type && TYPE_ICONS[type]) {
    return TYPE_ICONS[type];
  }

  // Priority 3: Default
  return { iconName: 'notifications', color: '#d5c19e' };
}

/**
 * Get app name from package name
 */
export function getAppDisplayName(packageName?: string): string | null {
  if (packageName && APP_ICONS[packageName]) {
    return APP_ICONS[packageName].name;
  }
  return null;
}

/**
 * Check if we have a known icon for this package
 */
export function hasKnownIcon(packageName?: string): boolean {
  return packageName ? !!APP_ICONS[packageName] : false;
}
