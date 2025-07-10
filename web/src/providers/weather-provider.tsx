"use client";

import React, {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
} from "react";
import {
  type ActiveWeatherAlertsSchema,
  type WeatherDaysSchema,
  type CurrentWeatherSchema,
  type WeatherDetailSchema,
} from "@sizeupdashboard/convex/api/schema";
import { type z } from "zod";
import { useQuery } from "@/hooks/use-query";
import { api } from "@sizeupdashboard/convex/api/_generated/api";

interface WeatherContextType {
  weatherDays: z.infer<typeof WeatherDaysSchema>[];
  currentWeather: z.infer<typeof CurrentWeatherSchema> | null;
  weatherAlerts: z.infer<typeof ActiveWeatherAlertsSchema>[];
  weatherDetails: z.infer<typeof WeatherDetailSchema>[];
  isLoading: boolean;
  error: Error | null;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

interface WeatherProviderProps {
  children: ReactNode;
}

// const sampleAlerts = [
//   {
//     senderName: "National Weather Service",
//     event: "Tornado Warning",
//     start: Date.now(),
//     end: Date.now() + 2 * 60 * 60 * 1000,
//     description:
//       "A tornado warning has been issued for the immediate area. Take shelter immediately in a sturdy building.",
//     tags: ["Severe", "Immediate Action"],
//   },
//   {
//     senderName: "NWS Storm Prediction Center",
//     event: "Severe Thunderstorm Watch",
//     start: Date.now() - 30 * 60 * 1000,
//     end: Date.now() + 4 * 60 * 60 * 1000,
//     description:
//       "Conditions are favorable for severe thunderstorms with large hail and damaging winds.",
//     tags: ["Watch", "Hail", "High Winds"],
//   },
//   {
//     senderName: "Local Emergency Management",
//     event: "Fire Ban in Effect",
//     start: Date.now() - 24 * 60 * 60 * 1000,
//     end: Date.now() + 7 * 24 * 60 * 60 * 1000,
//     description:
//       "Due to dry conditions and high fire danger, all outdoor burning is prohibited.",
//     tags: ["Fire Safety", "Outdoor Burning"],
//   },
// ];

export const WeatherProvider: React.FC<WeatherProviderProps> = ({
  children,
}) => {
  const today = useMemo(() => new Date(), []);
  const {
    data: forecast,
    isPending: forecastPending,
    error: forecastError,
  } = useQuery(api.weather.getWeatherForecast, {
    days: 3,
    date: today.getTime(),
  });
  const {
    data: weatherDetails,
    isPending: weatherDetailsPending,
    error: weatherDetailsError,
  } = useQuery(api.weather.getWeatherDetails);

  const value: WeatherContextType = {
    weatherDays: forecast?.days ?? [],
    currentWeather: forecast?.current ?? null,
    weatherAlerts: forecast?.alerts ?? [],
    // weatherAlerts: sampleAlerts,
    isLoading: forecastPending || weatherDetailsPending,
    weatherDetails: weatherDetails ?? [],
    error: forecastError ?? weatherDetailsError ?? null,
  };
  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return context;
};
