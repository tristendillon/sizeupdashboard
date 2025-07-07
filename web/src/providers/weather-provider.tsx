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

export const WeatherProvider: React.FC<WeatherProviderProps> = ({
  children,
}) => {
  // const forecast = useQuery(api.weather.getWeatherForecast, {
  //   days: 3,
  //   date: Date.now() / 1000,
  // });
  const today = useMemo(() => new Date(), []);
  const {
    data: forecast,
    isPending: forecastPending,
    error: forecastError,
  } = useQuery(api.weather.getWeatherForecast, {
    days: 3,
    date: today.getTime() / 1000,
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
