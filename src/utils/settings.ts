//Credit to https://github.com/Desyncfy for his contribution to using localStorage for settings.

import { BangItem } from "../types/BangItem";

// Callback to notify when custom bangs change (set by bangCoreUtil)
let onCustomBangsChanged: (() => void) | null = null;

/**
 * Register a callback to be called when custom bangs are modified
 * This allows the bang cache to be invalidated when settings change
 */
export function setCustomBangsChangedCallback(callback: () => void): void {
  onCustomBangsChanged = callback;
}

// Settings interface that defines all available user preferences
export interface UserSettings {
  defaultBang?: string;  // The user's preferred default bang (e.g., "g" for Google)
  customBangs: BangItem[];  // Custom user-defined bangs
  showRedirectLoadingScreen: boolean;  // Whether to show the redirect loading screen
  // Add more settings here as needed
}

// Default settings values
export const DEFAULT_SETTINGS: UserSettings = {
  defaultBang: "g",  // Default to Google if user hasn't specified a preference
  customBangs: [],
  showRedirectLoadingScreen: false,
};

// Settings key in local storage
const SETTINGS_STORAGE_KEY = 'rebang_settings';

// Cookie name used to communicate the user's custom-bang trigger list to the
// Cloudflare edge worker. The worker reads this cookie so it knows NOT to
// intercept triggers the user has overridden (otherwise a custom `!gl` for a
// private GitLab would still get redirected to the default OpenGL bang at
// the edge before the React app ever runs). See GH #20.
const CUSTOM_BANGS_COOKIE = 'rebang_cb';

/**
 * Write a `rebang_cb` cookie containing every trigger the user has defined
 * as a custom bang. The worker uses this set to know which triggers it must
 * defer to the origin / client for. Safe to call on every settings change
 * and on app boot.
 */
function syncCustomBangsCookie(customBangs: BangItem[]): void {
  if (typeof document === 'undefined') return;

  const triggers = new Set<string>();
  for (const bang of customBangs ?? []) {
    const list = Array.isArray(bang.t) ? bang.t : [bang.t];
    for (const t of list) {
      if (typeof t === 'string' && t.length > 0) {
        triggers.add(t.toLowerCase());
      }
    }
  }

  const value = Array.from(triggers).join(',');
  // 1 year, root path, Lax is fine (only used for our own GET to origin).
  if (value) {
    document.cookie = `${CUSTOM_BANGS_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
  } else {
    // No customs left -- expire any prior cookie so worker stops deferring.
    document.cookie = `${CUSTOM_BANGS_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

/**
 * Saves user settings to local storage
 * @param settings The settings object to save
 * @param expirationDays Number of days until the settings expire (default: 365)
 */
export function saveSettings(settings: UserSettings, expirationDays = 365): void {
  try {
    // Check if custom bangs changed
    const oldSettings = loadSettings();
    const customBangsChanged = JSON.stringify(oldSettings.customBangs) !== JSON.stringify(settings.customBangs);
    
    // Add expiration timestamp if specified
    const expirationTimestamp = expirationDays > 0 
      ? Date.now() + (expirationDays * 24 * 60 * 60 * 1000)
      : null;
    
    const dataToStore = {
      settings,
      expires: expirationTimestamp
    };
    
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(dataToStore));

    // Always sync the cookie so the edge worker sees the latest trigger set.
    syncCustomBangsCookie(settings.customBangs);

    // Notify listeners if custom bangs changed (invalidates bang cache)
    if (customBangsChanged && onCustomBangsChanged) {
      onCustomBangsChanged();
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Loads user settings from local storage
 * @returns The user settings object, or default settings if not found
 */
export function loadSettings(): UserSettings {
  try {
    const storedData = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);

      // Check if settings have expired (if expiration is set)
      if (!parsedData.expires || parsedData.expires > Date.now()) {
        const settings = { ...DEFAULT_SETTINGS, ...parsedData.settings };
        // Keep the edge-worker cookie in sync with what's actually in
        // localStorage. Handles users who set custom bangs before the
        // cookie sync existed -- without this they'd be stuck with the
        // worker overriding their custom triggers until they next edit
        // their settings.
        syncCustomBangsCookie(settings.customBangs);
        return settings;
      } else {
        // Clear expired settings
        localStorage.removeItem(SETTINGS_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  // No stored settings -- clear any stale cookie just in case.
  syncCustomBangsCookie([]);
  return { ...DEFAULT_SETTINGS };
}

/**
 * Updates a specific setting value and saves to local storage
 * @param key The setting key to update
 * @param value The new value
 */
export function updateSetting<K extends keyof UserSettings>(
  key: K, 
  value: UserSettings[K]
): void {
  const currentSettings = loadSettings();
  currentSettings[key] = value;
  saveSettings(currentSettings);
} 