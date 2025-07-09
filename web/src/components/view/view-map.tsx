"use client";

import { MapPin } from "lucide-react";
import { useAlertPopover } from "@/providers/alert-popover-provider";
import { GoogleMap } from "../maps/google-map";
import { HydrantsRenderer } from "../alert-popover/hydrants-renderer";
import { type z } from "zod";
import type {
  ActiveWeatherAlertsSchema,
  DispatchesSchema,
} from "@sizeupdashboard/convex/api/schema";
import IncidentMarker from "../maps/incident-marker";
import { useWeather } from "@/providers/weather-provider";
import StreetView from "../alert-popover/street-view";
import { WeatherAlert, WeatherAlertTitle } from "../ui/weather-alert-overlay";
import { useDispatches } from "@/providers/dispatches-provider";
import { getCenterOfLatLngs } from "@/utils/lat-lng";
import { useRef } from "react";
import { IncidentMarkersRenderer } from "../maps/dispatch-marker-renderer";

type Dispatch = z.infer<typeof DispatchesSchema>;
type WeatherAlert = z.infer<typeof ActiveWeatherAlertsSchema>;

export const NORMAL_MAP_ID = "home-map";
export const POPOVER_MAP_ID = "popover-map";
const POPOVER_MAP_ZOOM = 18;

export function ViewMap() {
  const { dispatch } = useAlertPopover();
  const { weatherAlerts } = useWeather();
  const mapChildren = (
    <>
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
    </>
  );
  return (
    <div className="relative flex h-[40vh] items-center justify-center md:h-[calc(100vh-128px)] md:w-[60%] md:flex-1">
      <NormalMap
        className="relative flex h-full w-full items-center justify-center"
        mapClassName="w-full h-full"
      >
        {mapChildren}
      </NormalMap>
      {dispatch && (
        <PopoverMap
          dispatch={dispatch}
          className="absolute inset-0 z-50 flex h-full w-full items-center justify-center"
          mapClassName="w-full h-full"
        >
          {mapChildren}
        </PopoverMap>
      )}
    </div>
  );
}

const MapLoadingState = () => {
  return (
    <div className="bg-muted/50 flex h-full w-full items-center justify-center">
      <div className="p-8 text-center">
        {/* Animated map icon */}
        <div className="mb-6">
          <MapPin className="text-primary mx-auto h-16 w-16 animate-pulse" />
        </div>

        {/* Loading message */}
        <h3 className="text-foreground mb-2 text-lg font-medium">
          Loading map...
        </h3>

        <p className="text-muted-foreground mb-6 text-sm">
          Please wait while we load your map data
        </p>

        {/* Loading dots animation */}
        <div className="flex justify-center space-x-1">
          <div
            className="bg-primary h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="bg-primary h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="bg-primary h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
};

interface NormalMapProps {
  className?: string;
  mapClassName?: string;
  children: React.ReactNode;
}

export function NormalMap({
  children,
  className,
  mapClassName,
}: NormalMapProps) {
  const { dispatches, status } = useDispatches();
  const mapRef = useRef<HTMLDivElement | null>(null);

  const latLngs = dispatches.map((d) => ({
    lat: d.latitude,
    lng: d.longitude,
  }));
  const center = getCenterOfLatLngs(latLngs);
  if (status === "LoadingFirstPage") {
    return <MapLoadingState />;
  }
  return (
    <GoogleMap
      ref={mapRef}
      id={NORMAL_MAP_ID}
      center={center}
      mapType="satellite"
      zoom={14}
      className={className}
      mapClassName={mapClassName}
    >
      {children}
      <IncidentMarkersRenderer />
    </GoogleMap>
  );
}

interface PopoverMapProps {
  dispatch: Dispatch;
  className?: string;
  mapClassName?: string;
  children: React.ReactNode;
}

export function PopoverMap({
  dispatch,
  children,
  className,
  mapClassName,
}: PopoverMapProps) {
  return (
    <GoogleMap
      id={POPOVER_MAP_ID}
      center={{
        lat: dispatch.latitude,
        lng: dispatch.longitude,
      }}
      mapType="satellite"
      zoom={POPOVER_MAP_ZOOM}
      className={className}
      mapClassName={mapClassName}
      disableMovement={true}
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
      {children}
    </GoogleMap>
  );
}
