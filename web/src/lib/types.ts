import {
  type ActiveWeatherAlertsSchema,
  type CurrentWeatherSchema,
  type DispatchesSchema,
  type WeatherDaysSchema,
  type WeatherDetailSchema,
} from "@sizeupdashboard/convex/src/api/schema.ts";
import { type z } from "zod";

export type LatLng = google.maps.LatLngLiteral;

export type LatLngBounds = google.maps.LatLngBoundsLiteral;

export type Cluster = {
  center: LatLng;
  points: { location: LatLng; type: string }[];
};

export type Dispatch = z.infer<typeof DispatchesSchema> & {
  location: LatLng;
  _creationTime: number;
};

export type WeatherDay = z.infer<typeof WeatherDaysSchema>;
export type WeatherDetail = z.infer<typeof WeatherDetailSchema>;
export type CurrentWeather = z.infer<typeof CurrentWeatherSchema>;
export type ActiveWeatherAlert = z.infer<typeof ActiveWeatherAlertsSchema>;

export interface WeatherDayWithDetails extends Omit<WeatherDay, "weather"> {
  weather: WeatherDetail[];
}

export interface CurrentWeatherWithDetails extends Omit<CurrentWeather, "weather"> {
  weather: WeatherDetail[];
}

