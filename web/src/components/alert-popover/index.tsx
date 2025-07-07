"use client";

import { useRef } from "react";
import { GoogleMap } from "../maps/google-map";
import { HydrantsRenderer } from "./hydrants-renderer";
import IncidentMarker from "./incident-marker";
import { WeatherAlert, WeatherAlertTitle } from "../ui/weather-alert-overlay";
import AlertPopoverSidebar from "./alert-popover-sidebar";
import { useAlertPopover } from "@/providers/alert-popover-provider";
import StreetView from "./street-view";

const MAP_ZOOM = 18;
const MAP_ID = "alert-popover-map";

const sampleAlerts: WeatherAlert[] = [
  {
    senderName: "National Weather Service",
    event: "Tornado Warning",
    start: Date.now(),
    end: Date.now() + 2 * 60 * 60 * 1000,
    description:
      "A tornado warning has been issued for the immediate area. Take shelter immediately in a sturdy building.",
    tags: ["Severe", "Immediate Action"],
  },
  {
    senderName: "NWS Storm Prediction Center",
    event: "Severe Thunderstorm Watch",
    start: Date.now() - 30 * 60 * 1000,
    end: Date.now() + 4 * 60 * 60 * 1000,
    description:
      "Conditions are favorable for severe thunderstorms with large hail and damaging winds.",
    tags: ["Watch", "Hail", "High Winds"],
  },
  {
    senderName: "Local Emergency Management",
    event: "Fire Ban in Effect",
    start: Date.now() - 24 * 60 * 60 * 1000,
    end: Date.now() + 7 * 24 * 60 * 60 * 1000,
    description:
      "Due to dry conditions and high fire danger, all outdoor burning is prohibited.",
    tags: ["Fire Safety", "Outdoor Burning"],
  },
];

export function AlertPopover() {
  // const { weatherAlerts } = useWeather();
  const weatherAlerts = sampleAlerts;
  const mapSectionRef = useRef<HTMLDivElement>(null);

  const { dispatch } = useAlertPopover();

  if (!dispatch) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <div className="flex h-full w-full flex-1 flex-col-reverse overflow-hidden md:flex-row">
        <AlertPopoverSidebar />

        <GoogleMap
          id={MAP_ID}
          ref={mapSectionRef}
          center={{
            lat: dispatch.latitude,
            lng: dispatch.longitude,
          }}
          mapType="satellite"
          zoom={MAP_ZOOM}
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
          <HydrantsRenderer mapId={MAP_ID} />
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
      </div>
    </div>
  );
}
