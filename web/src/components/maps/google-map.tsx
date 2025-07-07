import { env } from "@/env";
import type { LatLng } from "@/lib/types";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

// Define map types
export type MapType = "roadmap" | "satellite" | "hybrid" | "terrain";

interface GoogleMapProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.RefObject<HTMLDivElement | null>;
  center: LatLng;
  zoom?: number;
  mapClassName?: string;
  mapType?: MapType;
}

export function GoogleMap({
  id,
  center,
  zoom = 10,
  children,
  className,
  mapClassName,
  mapType = "roadmap",
  ref,
  ...props
}: GoogleMapProps) {
  const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key is not set");
  }

  return (
    <div ref={ref} className={className} {...props}>
      <APIProvider apiKey={apiKey}>
        <Map
          id={id}
          className={mapClassName}
          defaultCenter={center}
          defaultZoom={zoom}
          mapTypeId={mapType}
          style={{ width: "100%", height: "400px" }}
          gestureHandling="greedy"
          disableDefaultUI={true}
          mapTypeControl={false}
          tilt={0}
          heading={0}
          zoomControl={false}
          scrollwheel={false}
          disableDoubleClickZoom={true}
          keyboardShortcuts={false}
        >
          {children}
        </Map>
      </APIProvider>
    </div>
  );
}
