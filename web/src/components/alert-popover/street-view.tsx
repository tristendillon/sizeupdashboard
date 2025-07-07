"use client";

import { useEffect, useRef } from "react";
import { getAlertIconPath, getLatLngDistances } from "@/lib/utils";
import { env } from "@/env";
import type { DispatchesSchema } from "@sizeupdashboard/convex/api/schema";
import type { z } from "zod";
import { useMap } from "@vis.gl/react-google-maps";

const containerStyle = {
  width: "100%",
  height: "300px",
};
type Dispatch = z.infer<typeof DispatchesSchema>;

interface StreetViewProps {
  dispatch: Dispatch;
}

type GeocodeResponse = {
  status: string;
  results: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }[];
};

/**
 * Attempts to geocode the provided address, with fallback to alert coordinates
 */
const fetchGeocode = async (fullAddress: string, dispatch: Dispatch) => {
  const alertCoords = new google.maps.LatLng(
    dispatch.latitude,
    dispatch.longitude,
  );
  const encoded = encodeURIComponent(fullAddress);

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
    );
    const data = (await response.json()) as GeocodeResponse;

    if (data.status === "OK" && data.results.length > 0) {
      if (!data.results[0]) {
        return alertCoords;
      }
      const { lat, lng } = data.results[0].geometry.location;
      const resultCoords = new google.maps.LatLng(lat, lng);
      const distance = getLatLngDistances(
        alertCoords.toJSON(),
        resultCoords.toJSON(),
      );
      return distance <= 100 ? resultCoords : alertCoords;
    }
  } catch (error) {
    console.error("Error in geocoding:", error);
  }

  return alertCoords;
};

const findNearbyPanorama = async (target: google.maps.LatLng) => {
  const streetViewService = new google.maps.StreetViewService();
  let radius = 15;
  const maxRadius = 100;

  while (radius <= maxRadius) {
    try {
      const result = await streetViewService.getPanorama({
        radius,
        location: target,
        preference: google.maps.StreetViewPreference.BEST,
        sources: [
          google.maps.StreetViewSource.OUTDOOR,
          google.maps.StreetViewSource.GOOGLE,
        ],
      });
      return result;
    } catch (error) {
      radius += 10;
      console.error("Error finding panorama:", error);
    }
  }

  return null;
};

const StreetView: React.FC<StreetViewProps> = ({ dispatch }) => {
  const streetViewRef = useRef<HTMLDivElement | null>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const map = useMap("alert-popover-map");

  useEffect(() => {
    const initStreetView = async () => {
      if (!streetViewRef.current) return;

      const fullAddress = `${dispatch.address}, ${dispatch.city}, ${dispatch.stateCode}`;
      const target = new google.maps.LatLng(
        dispatch.latitude,
        dispatch.longitude,
      );

      try {
        const facingCoords = await fetchGeocode(fullAddress, dispatch);
        const panoResult = await findNearbyPanorama(target);
        if (!panoResult) return;
        const panoLatLng = panoResult.data.location?.latLng;

        if (!panoLatLng) return;

        const panorama = new google.maps.StreetViewPanorama(
          streetViewRef.current,
          {
            pano: panoResult.data.location?.pano,
            panControl: false,
            zoomControl: false,
            addressControl: false,
            linksControl: false,
            enableCloseButton: false,
            fullscreenControl: false,
            motionTracking: false,
            motionTrackingControl: false,
            scrollwheel: false,
            zoom: 0,
          },
        );

        panoramaRef.current = panorama;

        new google.maps.Marker({
          position: target,
          map: panorama,
          icon: {
            url: getAlertIconPath(dispatch.type),
            scaledSize: new google.maps.Size(40, 40),
          },
        });

        const initialHeading = google.maps.geometry.spherical.computeHeading(
          panoLatLng,
          facingCoords,
        );
        panorama.setPano(panoResult.data.location?.pano ?? "");

        setTimeout(() => {
          panorama.setPov({
            heading: initialHeading,
            pitch: -10,
          });
        }, 100);
      } catch (error) {
        console.error("Error initializing Street View:", error);
      }
    };

    void initStreetView();
  }, [dispatch, map]);

  return (
    <div className="relative">
      <div ref={streetViewRef} style={{ ...containerStyle }} />
    </div>
  );
};

export default StreetView;
