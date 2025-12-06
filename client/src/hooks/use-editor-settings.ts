import { useState, useEffect } from "react";
import { EditorSettings, defaultEditorSettings } from "../shared/schema";

const STORAGE_KEY = "js-playground-editor-settings";

export function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return { ...defaultEditorSettings, ...JSON.parse(stored) };
        } catch {
          return defaultEditorSettings;
        }
      }
    }
    return defaultEditorSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultEditorSettings);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { settings, updateSetting, resetSettings };
}