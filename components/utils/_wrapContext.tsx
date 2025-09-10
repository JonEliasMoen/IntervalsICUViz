import React, { createContext, useContext, useEffect, useState } from "react";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";
import { getWellnessRange, wellness } from "@/components/utils/_fitnessModel";
import { UserSettings, useSettings } from "@/components/utils/_keyContext";
import { useMutation } from "@tanstack/react-query";

interface opt {
  mean: number;
  std: number;
  val: number;
  hrv_err: number;
}

interface optInput {
  hrv: number[];
  ctl: number[];
  acwr: number[];
}

type WellnessContextType = {
  wRap: wellnessWrapper | undefined;
  dataLong: wellness[] | undefined;
  settings: UserSettings;
  opt: opt | undefined;
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
  const [opt, setOpt] = useState<opt>();
  const { mutate, isLoading, error } = useMutation(
    async (inp: optInput): Promise<opt> => {
      const response = await fetch(
        `https://yrweatherbackend.vercel.app/optimize`,
        {
          method: "POST",
          body: JSON.stringify(inp),
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch optimize");
      return response.json();
    },
    {
      onSuccess: (data) => {
        setOpt(data);
      },
    },
  );

  useEffect(() => {
    if (dataLong) {
      let wr = new wellnessWrapper(dataLong);
      mutate({
        hrv: wr.getAttr("hrv"),
        ctl: wr.getAttr("ctl"),
        acwr: wr.acwr.acwr,
      });
      setWrap(wr);
    }
  }, [dataLong]);
  return (
    <WellnessContext.Provider
      value={{
        wRap: wrap,
        dataLong: dataLong,
        settings: settings,
        opt: opt,
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
