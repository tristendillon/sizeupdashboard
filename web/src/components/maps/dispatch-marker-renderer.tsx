import { NORMAL_MAP_ID } from "../view/view-map";
import { useDispatches } from "@/providers/dispatches-provider";
import { getAlertIconType } from "@/utils/icons";

import React from "react";
import ClusterMarker from "./cluster-marker";
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

  const fireClusters = clusterDispatches(zoom, fireDispatches);
  const medicalClusters = clusterDispatches(zoom, medicalDispatches);

  const allClusters = [...fireClusters.clusters, ...medicalClusters.clusters];
  const noise = [...fireClusters.noise, ...medicalClusters.noise];

  return (
    <React.Fragment>
      {allClusters.map((cluster, index) => (
        <ClusterMarker
          key={`cluster-${index}`}
          dispatch={cluster.dispatches[0]!}
          type={cluster.dispatches[0]!.type}
          clusterDispatches={cluster.dispatches}
        >
          <Badge
            variant="default"
            className="absolute -top-2 -right-2 rounded-full"
          >
            {cluster.dispatches.length}
          </Badge>
        </ClusterMarker>
      ))}

      {noise.map((dispatch, index) => (
        <ClusterMarker
          key={`noise-${index}`}
          dispatch={dispatch}
          type={dispatch.type}
        />
      ))}
    </React.Fragment>
  );
}
