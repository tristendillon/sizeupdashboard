import type { LatLng } from "@/lib/types";
import { getAlertIconPath } from "@/lib/utils";
import { Marker } from "@vis.gl/react-google-maps";

interface IncidentMarkerProps {
  location: LatLng;
  type: string;
}

export default function IncidentMarker({
  location,
  type,
}: IncidentMarkerProps) {
  const icon = getAlertIconPath(type);
  return (
    <Marker
      position={location}
      icon={{
        url: icon,
        scaledSize: new google.maps.Size(40, 40),
      }}
    />
  );
}
