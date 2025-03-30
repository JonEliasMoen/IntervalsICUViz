import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import base64 from "react-native-base64";
import { tokenResponse } from "@/components/utils/_commonModel";

type StoredKeyContextType = {
  storedKey: string;
  setStoredKey: React.Dispatch<React.SetStateAction<string>>;
  storedAid: string;
  setStoredAid: React.Dispatch<React.SetStateAction<string>>;
  storedToken: tokenResponse;
  setStoredToken: React.Dispatch<React.SetStateAction<tokenResponse>>;
};

const StoredKeyContext = createContext<StoredKeyContextType | undefined>(
  undefined,
);

export const StoredKeyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [storedKey, setStoredKey] = useState("");
  const [storedAid, setStoredAid] = useState("");
  // @ts-ignore
  const [storedToken, setStoredToken] = useState<tokenResponse>("{}");

  useEffect(() => {
    const loadData = async () => {
      try {
        const value = await AsyncStorage.getItem("@api_key");
        if (value !== null) {
          setStoredKey(base64.encode("API_KEY:" + value));
        }
        const aid = await AsyncStorage.getItem("@aid");
        if (aid !== null) {
          setStoredAid(aid);
        }
        const token = await AsyncStorage.getItem("@token");
        if (token !== null) {
          setStoredToken(JSON.parse(token));
        }
      } catch (e) {
        console.error("Error reading API key:", e);
      }
    };
    loadData();
  }, []);

  return (
    <StoredKeyContext.Provider
      value={{
        storedKey,
        setStoredKey,
        storedAid,
        setStoredAid,
        storedToken,
        setStoredToken,
      }}
    >
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
