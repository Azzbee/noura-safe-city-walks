import { useState, useEffect, useCallback } from 'react';

export interface NotificationSettings {
  crimeAlerts: boolean;
  dangerZoneEntry: boolean;
  safetyReports: boolean;
  approachingAlerts: boolean;
  highSeverityOnly: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  crimeAlerts: true,
  dangerZoneEntry: true,
  safetyReports: true,
  approachingAlerts: true,
  highSeverityOnly: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

const STORAGE_KEY = 'noura-notification-settings';

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (e) {
      console.error('Error loading notification settings:', e);
    }
    setLoaded(true);
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (e) {
        console.error('Error saving notification settings:', e);
      }
      return newSettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      console.error('Error resetting notification settings:', e);
    }
  }, []);

  return {
    settings,
    loaded,
    updateSettings,
    resetSettings,
  };
}
