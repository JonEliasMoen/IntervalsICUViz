import DropDownPicker from "react-native-dropdown-picker";
import { StyleSheet, View } from "react-native";
import React, { useEffect, useState } from "react";

export function DropDown(props: {
  items: any[];
  text: string;
  setItem: (item: any) => void;
}) {
  const [open, setOpen] = useState(false); // State for dropdown visibility
  const [value, setValue] = useState<number>(0); // Initialize state for selected value
  useEffect(() => {
    if (value !== null && value < props.items.length) {
      props.setItem(props.items[value]);
    }
  }, [value]);
  return (
    <View style={[styles.dcontainer]}>
      <DropDownPicker
        open={open}
        value={value}
        items={props.items}
        setOpen={setOpen}
        setValue={setValue}
        placeholder={props.text}
        dropDownContainerStyle={{
          zIndex: 1000,
          elevation: 1000,
          backgroundColor: "white",
        }}
      />
    </View>
  );
}
export default DropDown;
const styles = StyleSheet.create({
  dcontainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000, // Prioritize dropdown over other content
    alignSelf: "center", // Ensures centering
    width: "25%",
  },
});
