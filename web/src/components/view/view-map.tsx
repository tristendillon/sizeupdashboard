"use client";

import { useAlertPopover } from "@/providers/alert-popover-provider";
import { GoogleMap } from "../maps/google-map";
import { HydrantsRenderer } from "../alert-popover/hydrants-renderer";
import { type z } from "zod";
import type {
  ActiveWeatherAlertsSchema,
  DispatchesSchema,
} from "@sizeupdashboard/convex/api/schema";
import IncidentMarker from "../alert-popover/incident-marker";
import { useWeather } from "@/providers/weather-provider";
import StreetView from "../alert-popover/street-view";
import { WeatherAlert, WeatherAlertTitle } from "../ui/weather-alert-overlay";

type Dispatch = z.infer<typeof DispatchesSchema>;
type WeatherAlert = z.infer<typeof ActiveWeatherAlertsSchema>;

const POPOVER_MAP_ID = "popover-map";
const POPOVER_MAP_ZOOM = 18;

export function ViewMap() {
  const { dispatch } = useAlertPopover();
  const { weatherAlerts } = useWeather();
  if (!dispatch) {
    return null;
  }
  return <PopoverMap dispatch={dispatch} weatherAlerts={weatherAlerts} />;
}

interface PopoverMapProps {
  dispatch: Dispatch;
  weatherAlerts: WeatherAlert[];
}

export function PopoverMap({ dispatch, weatherAlerts }: PopoverMapProps) {
  return (
    <GoogleMap
      id={POPOVER_MAP_ID}
      center={{
        lat: dispatch.latitude,
        lng: dispatch.longitude,
      }}
      mapType="satellite"
      zoom={POPOVER_MAP_ZOOM}
      className="relative flex h-[40vh] items-center justify-center md:h-[calc(100vh-128px)] md:w-[60%] md:flex-1"
      mapClassName="w-full h-full"
    >
      <IncidentMarker
        location={{
          lat: dispatch.latitude,
          lng: dispatch.longitude,
        }}
        type={dispatch.type}
      />
      <HydrantsRenderer mapId={POPOVER_MAP_ID} />
      <div className="absolute right-0 bottom-0 hidden h-[300px] w-[300px] md:block">
        <StreetView dispatch={dispatch} />
      </div>
      {weatherAlerts.length > 0 && (
        <article className="absolute bottom-0 left-0 flex flex-row gap-1 p-1 md:flex-col">
          {weatherAlerts.map((alert, index) => (
            <WeatherAlert
              key={index}
              alert={alert}
              className="inline-block p-2"
            >
              <div className="flex items-center space-x-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white"></span>
                <WeatherAlertTitle className="text-sm font-medium" />
              </div>
            </WeatherAlert>
          ))}
        </article>
      )}
    </GoogleMap>
  );
}
