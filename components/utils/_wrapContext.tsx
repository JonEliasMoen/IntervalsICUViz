import React, { createContext, useContext, useEffect, useState } from "react";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";
import { getWellnessRange, wellness } from "@/components/utils/_fitnessModel";
import { UserSettings, useSettings } from "@/components/utils/_keyContext";

type WellnessContextType = {
  wRap: wellnessWrapper | undefined;
  dataLong: wellness[] | undefined;
  settings: UserSettings;
};

const WellnessContext = createContext<WellnessContextType | undefined>(
  undefined,
);

export const WellnessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { settings } = useSettings();
  const dataLong = getWellnessRange(0, 42, settings);
  const [wrap, setWrap] = useState<wellnessWrapper>();
  useEffect(() => {
  if (dataLong) {
    let wr = new wellnessWrapper(dataLong);
    setWrap(wr);
  }
  }, [dataLong]);
  return (
    <WellnessContext.Provider
      value={{
        wRap: wrap,
        dataLong: dataLong,
        settings: settings,
      }}
    >
      {children}
    </WellnessContext.Provider>
  );
};

export const useWellness = (): WellnessContextType => {
  const context = useContext(WellnessContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};