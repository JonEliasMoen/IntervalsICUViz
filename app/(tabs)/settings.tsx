import { Button, Platform, StyleSheet, TextInput } from "react-native";
import { Text, View } from "@/components/Themed";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useStoredKey } from "@/components/utils/_keyContext";
import { useRouter } from "expo-router";
import { tokenResponse } from "@/components/utils/_fitnessModel";
import * as Linking from "expo-linking";

export interface userSettings {
  stravaToken: tokenResponse;
  intervalsDat: intervalsData;
}
interface intervalsData {
  aid: string;
  apiKey: string;
}

export default function TabTwoScreen() {
  const [apiKey, setApiKey] = useState("");
  const [aid, setAid] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const { mutate, isLoading, error } = useMutation(
    async (code: string): Promise<tokenResponse> => {
      const response = await fetch(
        `https://yrweatherbackend.vercel.app/strava/refresh?code=${code}`,
        { method: "GET" },
      );
      if (!response.ok) throw new Error("Failed to fetch refresh token");
      return response.json();
    },
    {
      onSuccess: (data) => {
        handleSaveRefreshToken(data);
        router.push("/settings");
      },
      onError: (error) => {
        router.push("/settings");
      },
    },
  );
  const {
    storedKey,
    setStoredKey,
    storedAid,
    setStoredAid,
    storedToken,
    setStoredToken,
  } = useStoredKey();
  console.log(storedToken);

  const queryClient = useQueryClient();
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const value = await AsyncStorage.getItem("@api_key");
        if (value !== null) {
          setStoredKey(value);
          setApiKey(".".repeat(value.length));
        }
        const aid = await AsyncStorage.getItem("@aid");
        if (aid !== null) {
          setStoredAid(aid);
          setAid(aid);
        }
      } catch (e) {
        console.log("Error reading API key:", e);
      }
    };
    loadApiKey();
  }, []);

  const handleSave = () => {
    try {
      if (apiKey != ".".repeat(apiKey.length)) {
        AsyncStorage.setItem("@api_key", apiKey);
        setApiKey(apiKey); // Clear the input after saving
        console.log(apiKey);
        queryClient.invalidateQueries(["intervals"]);
      }
    } catch (e) {
      console.log("Error saving API key:", e);
    }
  };
  const handleSaveAid = () => {
    try {
      if (aid != ".".repeat(aid.length)) {
        AsyncStorage.setItem("@aid", aid);
        setStoredAid(aid); // Clear the input after saving
        console.log(aid);
        queryClient.invalidateQueries(["intervals"]);
      }
    } catch (e) {
      console.log("Error saving aid key:", e);
    }
  };
  const handleSaveRefreshToken = (token: tokenResponse) => {
    try {
      AsyncStorage.setItem("@token", JSON.stringify(token));
      setAuthenticated(true);
    } catch (e) {
      console.log("Error saving refresh key:", e);
    }
  };

  useEffect(() => {
    const checkInitialDeepLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const parsedUrl = new URL(initialUrl);
        const code = parsedUrl.searchParams.get("code");
        if (code) {
          console.log("Code from initial URL:", code);
          mutate(code);
        }
      }
    };
    const handleDeepLink = (event) => {
      const { url } = event;
      const parsedUrl = new URL(url);
      const code = parsedUrl.searchParams.get("code");
      if (code) {
        console.log("Code from deep link:", code);
        mutate(code);
      }
    };
    Linking.addEventListener("url", handleDeepLink);
    checkInitialDeepLink();
    return () => {};
  }, []);

  const makeUrl = (callbackUrl: string) => {
    return `https://www.strava.com/oauth/authorize?client_id=108568&response_type=code&redirect_uri=${callbackUrl}&approval_prompt=force&scope=read_all,activity:read_all`;
  };

  const handleRedirect = () => {
    try {
      const redirUrl = "https://yrweatherbackend.vercel.app/redirect";
      const url = makeUrl(redirUrl);
      Linking.openURL(url);
    } catch (e) {
      console.log("Error saving aid key:", e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{ maxWidth: 300 }}>
        Go to intervals.icu and login, then go to settings and create a api key.
        Paste the api key here. The Api key is stored locally, revoke in
        intervals, uninstall app, or change value here to remove access. Do not
        share the api key and treat it as a password. Data from previous days is
        used if unavailable. refresh website after entering.
      </Text>
      <Text style={styles.title}>Api key</Text>
      <TextInput
        style={(styles.input, { width: 200, borderWidth: 1, marginBottom: 10 })}
        value={apiKey}
        onChangeText={setApiKey}
        clearTextOnFocus={true}
        onEndEditing={handleSave}
        onBlur={handleSave}
        placeholder="Paste api key here"
        secureTextEntry={true}
      />
      <Text style={styles.title}>Athlete ID</Text>
      <TextInput
        style={(styles.input, { width: 200, borderWidth: 1, marginBottom: 10 })}
        value={aid}
        onChangeText={setAid}
        onEndEditing={handleSaveAid}
        onBlur={handleSaveAid}
        clearTextOnFocus={true}
        placeholder="Athlede ID"
        secureTextEntry={false}
      />
      <Button
        title={
          !authenticated ? "Authenticate with strava" : "Already Authenticated"
        }
        onPress={handleRedirect}
        disabled={authenticated}
      />
      <Text>{storedToken.access_token}</Text>
      <Text>{authenticated.toString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    height: 40,
    width: "100%",
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
  },
  storedText: {
    marginTop: 20,
    fontSize: 16,
  },
});
