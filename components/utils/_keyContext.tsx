import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import base64 from "react-native-base64";
import { tokenResponse } from "@/components/utils/_fitnessModel";
import { useMutation } from "@tanstack/react-query";

export interface UserSettings {
  stravaToken?: tokenResponse;
  aid?: string;
  apiKey?: string;
  lat?: number;
  long?: number;
}

type SettingsContextType = {
  settings: UserSettings;
  setSettings: (update: Partial<UserSettings>) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, _setSettings] = useState<UserSettings>({});

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    let merged = { ...settings, ...newSettings };
    if (newSettings.apiKey) {
      merged = {
        ...merged,
        apiKey: base64.encode("API_KEY:" + newSettings.apiKey),
      };
    }
    console.log(merged);
    _setSettings(merged);
    await AsyncStorage.setItem("@settings", JSON.stringify(merged));
  };

  const { mutate } = useMutation(
    async (token: tokenResponse): Promise<tokenResponse> => {
      const response = await fetch(
        `https://yrweatherbackend.vercel.app/strava/exchange?refresh_token=${token.refresh_token}`,
        { method: "GET" },
      );
      if (!response.ok) throw new Error("Failed to refresh token");
      return response.json();
    },
    {
      onSuccess: (data) => {
        saveSettings({ stravaToken: data });
      },
    },
  );

  useEffect(() => {
    const load = async () => {
      try {
        const json = await AsyncStorage.getItem("@settings");
        if (json) {
          const parsed: UserSettings = JSON.parse(json);
          _setSettings(parsed);

          const token = parsed.stravaToken;
          if (
            token &&
            (token.expires_at < Math.floor(Date.now() / 1000) ||
              !token.access_token)
          ) {
            mutate(token);
          }
        }
      } catch (e) {
        console.error("Error loading settings:", e);
      }
    };
    load();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSettings: saveSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
