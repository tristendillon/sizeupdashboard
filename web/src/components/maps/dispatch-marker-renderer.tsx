import { NORMAL_MAP_ID } from "../view/view-map";
import { useDispatches } from "@/providers/dispatches-provider";
import { getAlertIconType } from "@/utils/icons";
import React from "react";
import ClusterMarker from "./cluster-marker";
import NoiseMarker from "./noise-marker";
import { Badge } from "../ui/badge";
import { useZoom } from "@/hooks/use-zoom";
import { clusterDispatches } from "@/utils/marker-clusters";

export function IncidentMarkersRenderer() {
  const zoom = useZoom(NORMAL_MAP_ID);
  const { dispatches } = useDispatches();

  if (!zoom) {
    return null;
  }

  const fireDispatches = dispatches.filter(
    (d) => getAlertIconType(d.type) === "fire",
  );
  const medicalDispatches = dispatches.filter(
    (d) => getAlertIconType(d.type) === "medical",
  );

  const fireClusters = clusterDispatches(zoom, fireDispatches, "grid");
  const medicalClusters = clusterDispatches(zoom, medicalDispatches, "grid");

  const allClusters = [...fireClusters.clusters, ...medicalClusters.clusters];
  const noise = [...fireClusters.noise, ...medicalClusters.noise];

  return (
    <React.Fragment>
      {/* Render clusters */}
      {allClusters.map((cluster, index) => (
        <ClusterMarker
          key={`cluster-${index}`}
          location={cluster.centroid}
          type={cluster.dispatches[0]!.type}
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
