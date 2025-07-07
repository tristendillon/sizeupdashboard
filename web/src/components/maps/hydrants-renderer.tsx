import { useQuery } from "@/lib/use-query";
import { api } from "@sizeupdashboard/convex/api/_generated/api";
import React from "react";
import { Marker, useMap } from "@vis.gl/react-google-maps";
import { useBounds } from "@/hooks/use-bounds";
import type { LatLngBounds } from "@/lib/types";

interface HydrantsRendererProps {
  mapId: string;
}

export function HydrantsRenderer({ mapId }: HydrantsRendererProps) {
  const mapBounds = useBounds(mapId);

  if (!mapBounds) {
    return null;
  }

  console.log(mapBounds);
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
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  console.log(data);
  return (
    <React.Fragment>
      {data.map((hydrant) => (
        <Marker
          key={hydrant._id}
          position={{ lat: hydrant.latitude, lng: hydrant.longitude }}
        />
      ))}
    </React.Fragment>
  );
};
