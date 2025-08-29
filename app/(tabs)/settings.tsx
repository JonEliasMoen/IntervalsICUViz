import { Button, StyleSheet, TextInput } from "react-native";
import { Text, View } from "@/components/Themed";
import React, { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSettings } from "@/components/utils/_keyContext";
import { useRouter } from "expo-router";
import { tokenResponse } from "@/components/utils/_fitnessModel";
import * as Linking from "expo-linking";

export default function TabTwoScreen() {
  const { settings, setSettings } = useSettings();
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
        setSettings({ stravaToken: data });
        setAuthenticated(true);
        router.push("/settings");
      },
      onError: (error) => {
        router.push("/settings");
      },
    },
  );

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
        value={settings.apiKey ?? ""}
        onChangeText={(txt) => setSettings({ apiKey: txt })}
        clearTextOnFocus={true}
        placeholder="Paste api key here"
        secureTextEntry={true}
      />
      <Text style={styles.title}>Athlete ID</Text>
      <TextInput
        style={(styles.input, { width: 200, borderWidth: 1, marginBottom: 10 })}
        value={settings.aid ?? ""}
        onChangeText={(txt) => setSettings({ aid: txt })}
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
      <Text>{settings.stravaToken?.access_token}</Text>
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
