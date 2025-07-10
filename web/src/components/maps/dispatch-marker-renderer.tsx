import { NORMAL_MAP_ID } from "../view/view-map";
import { useDispatches } from "@/providers/dispatches-provider";
import React from "react";
import ClusterMarker from "./cluster-marker";
import NoiseMarker from "./noise-marker";
import { Badge } from "../ui/badge";
import { useZoom } from "@/hooks/use-zoom";
import { clusterDispatches, type Cluster } from "@/utils/marker-clusters";
import type {
  DispatchGroupEnum,
  DispatchWithType,
} from "@sizeupdashboard/convex/api/schema";

type ClusterByGroup = Record<
  DispatchGroupEnum,
  {
    clusters: Cluster[];
    noise: DispatchWithType[];
  }
>;

export function IncidentMarkersRenderer() {
  const zoom = useZoom(NORMAL_MAP_ID);
  const { dispatches } = useDispatches();

  if (!zoom) {
    return null;
  }

  const fireDispatches = dispatches.filter(
    (d) => d.dispatchType?.group === "fire",
  );
  const medicalDispatches = dispatches.filter(
    (d) => d.dispatchType?.group === "medical",
  );
  const mvaDispatches = dispatches.filter(
    (d) => d.dispatchType?.group === "mva",
  );
  const aircraftDispatches = dispatches.filter(
    (d) => d.dispatchType?.group === "aircraft",
  );
  const lawDispatches = dispatches.filter(
    (d) => d.dispatchType?.group === "law",
  );
  const rescueDispatches = dispatches.filter(
    (d) => d.dispatchType?.group === "rescue",
  );
  const marineDispatches = dispatches.filter(
    (d) => d.dispatchType?.group === "marine",
  );
  const otherDispatches = dispatches.filter(
    (d) =>
      d.dispatchType?.group === "other" ||
      d.dispatchType?.group === "hazmat" ||
      d.dispatchType?.group === null,
  );
  const dispatchesByGroup = {
    fire: fireDispatches,
    medical: medicalDispatches,
    mva: mvaDispatches,
    aircraft: aircraftDispatches,
    law: lawDispatches,
    rescue: rescueDispatches,
    marine: marineDispatches,
    other: otherDispatches,
  };

  const clustersByGroup: ClusterByGroup = Object.entries(
    dispatchesByGroup,
  ).reduce((acc, [group, dispatches]) => {
    const typedGroup = group as DispatchGroupEnum;
    acc[typedGroup] = clusterDispatches(zoom, dispatches, "grid");
    return acc;
  }, {} as ClusterByGroup);

  const noise = Object.values(clustersByGroup).flatMap((data) => data.noise);

  return (
    <React.Fragment>
      {/* Render clusters */}
      {Object.entries(clustersByGroup).map(([group, data]) => (
        <React.Fragment key={group}>
          {data.clusters.map((cluster, index) => (
            <ClusterMarker
              key={`cluster-${index}`}
              location={cluster.centroid}
              group={group as DispatchGroupEnum}
              dispatches={cluster.dispatches}
            >
              <Badge
                variant="default"
                className="absolute -top-2 -right-2 rounded-full"
              >
                {cluster.dispatches.length}
              </Badge>
            </ClusterMarker>
          ))}
        </React.Fragment>
      ))}

      {/* Render individual dispatches */}
      {noise.map((dispatch, index) => (
        <NoiseMarker
          key={`dispatch-${dispatch.dispatchId || index}`}
          dispatch={dispatch}
        />
      ))}
    </React.Fragment>
  );
}
