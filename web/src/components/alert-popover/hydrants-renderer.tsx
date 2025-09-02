import { useQuery } from "@/hooks/use-query";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import React from "react";
import { Marker } from "@vis.gl/react-google-maps";
import { useBounds } from "@/hooks/use-bounds";
import type { LatLngBounds } from "@/lib/types";
import { getFlowRateColor } from "@/utils/icons";

interface HydrantsRendererProps {
  mapId: string;
}

export function HydrantsRenderer({ mapId }: HydrantsRendererProps) {
  const mapBounds = useBounds(mapId);

  if (!mapBounds) {
    return null;
  }

  return <Hydrants {...mapBounds} />;
}

const Hydrants = (bounds: LatLngBounds) => {
  const { data, isPending, error } = useQuery(
    api.hydrants.getHydrantsByBounds,
    {
      topLeft: {
        latitude: bounds.north,
        longitude: bounds.east,
      },
      bottomRight: {
        latitude: bounds.south,
        longitude: bounds.west,
      },
    },
  );

  if (isPending) {
    return null;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  const hydrantsWithIcons = data.map((hydrant) => ({
    ...hydrant,
    icon: `icons/hydrants/hydrant-${getFlowRateColor(Number(hydrant.calculatedFlowRate))}.png`,
  }));
  return (
    <React.Fragment>
      {hydrantsWithIcons.map((hydrant) => (
        <Marker
          key={hydrant._id}
          position={{
            lat: hydrant.location.latitude,
            lng: hydrant.location.longitude,
          }}
          icon={{
            url: hydrant.icon,
            scaledSize: new google.maps.Size(40, 40),
          }}
        />
      ))}
    </React.Fragment>
  );
};
