import { Button, StyleSheet, TextInput } from "react-native";
import { Text, View } from "@/components/Themed";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";

export default function TabTwoScreen() {
  const [apiKey, setApiKey] = useState("");
  const [storedKey, setStoredKey] = useState("");
  const queryClient = useQueryClient();
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const value = await AsyncStorage.getItem("@api_key");
        if (value !== null) {
          setStoredKey(value);
          setApiKey(".".repeat(value.length));
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
        queryClient.invalidateQueries(["wellness"]);
      }
    } catch (e) {
      console.log("Error saving API key:", e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{ maxWidth: 300 }}>
        Go to intervals.icu and login, then go to settings and create a api key.
        Paste the api key here. The Api key is stored locally, revoke in
        intervals, uninstall app, or change value here to remove access. Do not
        share the api key and treat it as a password. Data from previous days is
        used if unavailable
      </Text>
      <Text style={styles.title}>Api key</Text>
      <form>
        <TextInput
          style={
            (styles.input, { width: 200, borderWidth: 1, marginBottom: 10 })
          }
          value={apiKey}
          onChangeText={setApiKey}
          clearTextOnFocus={true}
          onEndEditing={handleSave}
          onBlur={() => console.log("blur")}
          placeholder="Pase api key here"
          secureTextEntry={true}
        />
      </form>
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
