import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import base64 from "react-native-base64";

type StoredKeyContextType = {
  storedKey: string;
  setStoredKey: React.Dispatch<React.SetStateAction<string>>;
};

const StoredKeyContext = createContext<StoredKeyContextType | undefined>(
  undefined,
);

export const StoredKeyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [storedKey, setStoredKey] = useState("");

  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const value = await AsyncStorage.getItem("@api_key");
        if (value !== null) {
          setStoredKey(base64.encode("API_KEY:" + value));
        }
      } catch (e) {
        console.error("Error reading API key:", e);
      }
    };
    loadApiKey();
  }, []);

  return (
    <StoredKeyContext.Provider value={{ storedKey, setStoredKey }}>
      {children}
    </StoredKeyContext.Provider>
  );
};

export const useStoredKey = (): StoredKeyContextType => {
  const context = useContext(StoredKeyContext);
  if (!context) {
    throw new Error("useStoredKey must be used within a StoredKeyProvider");
  }
  return context;
};
