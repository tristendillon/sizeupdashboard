// DBSCAN clustering implementation for map markers

import type { Dispatch, LatLng, LatLngBounds } from "@/lib/types";

interface Cluster {
  id: number;
  dispatches: Dispatch[];
  centroid: LatLng;
  bounds: LatLngBounds;
}

class MapClustering {
  private dispatches: Dispatch[] = [];
  private visited = new Set<number>();
  private clusters: Cluster[] = [];

  constructor(dispatches: Dispatch[]) {
    this.dispatches = dispatches;
  }

  // Convert zoom level to appropriate clustering distance
  private getClusteringDistance(zoom: number): number {
    // Rough approximation of meters per pixel at different zoom levels
    // This creates larger clusters at lower zoom levels (zoomed out)
    const zoomDistanceMap: Record<number, number> = {
      10: 5000, // ~5km radius
      11: 3000, // ~3km radius
      12: 2000, // ~2km radius
      13: 1000, // ~1km radius
      14: 500, // ~500m radius
      15: 250, // ~250m radius
      16: 125, // ~125m radius
      17: 60, // ~60m radius
      18: 30, // ~30m radius
      19: 15, // ~15m radius
      20: 8, // ~8m radius
      21: 4, // ~4m radius
    };

    // Interpolate for zoom levels not in the map
    const lowerZoom = Math.floor(zoom);
    const upperZoom = Math.ceil(zoom);

    const lowerDistance = zoomDistanceMap[lowerZoom] ?? 5000;
    const upperDistance = zoomDistanceMap[upperZoom] ?? 5000;

    if (lowerZoom === upperZoom) {
      return lowerDistance;
    }

    const ratio = zoom - lowerZoom;
    return lowerDistance + (upperDistance - lowerDistance) * ratio;
  }

  // Calculate distance between two lat/lng points using Haversine formula
  private calculateDistance(
    point1: google.maps.LatLngLiteral,
    point2: google.maps.LatLngLiteral,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (point1.lat * Math.PI) / 180;
    const lat2Rad = (point2.lat * Math.PI) / 180;
    const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Find all neighbors within epsilon distance
  private findNeighbors(pointIndex: number, epsilon: number): number[] {
    const neighbors: number[] = [];
    const currentPoint = this.dispatches[pointIndex];

    if (!currentPoint) {
      return neighbors;
    }

    for (let i = 0; i < this.dispatches.length; i++) {
      if (i === pointIndex) continue;

      const otherPoint = this.dispatches[i];
      if (!otherPoint) continue;

      const currentPointLatLng = {
        lat: currentPoint.latitude,
        lng: currentPoint.longitude,
      };
      const otherPointLatLng = {
        lat: otherPoint.latitude,
        lng: otherPoint.longitude,
      };
      const distance = this.calculateDistance(
        currentPointLatLng,
        otherPointLatLng,
      );
      if (distance <= epsilon) {
        neighbors.push(i);
      }
    }

    return neighbors;
  }

  // DBSCAN clustering algorithm
  public cluster(zoom: number, minPoints = 2): Cluster[] {
    this.visited.clear();
    this.clusters = [];

    const epsilon = this.getClusteringDistance(zoom);
    const clusterAssignment: number[] = new Array(this.dispatches.length).fill(
      -1,
    ); // -1 means unassigned
    let clusterId = 0;

    for (let i = 0; i < this.dispatches.length; i++) {
      if (this.visited.has(i)) continue;

      this.visited.add(i);
      const neighbors = this.findNeighbors(i, epsilon);

      if (neighbors.length < minPoints - 1) {
        // This is a noise point (not enough neighbors)
        continue;
      }

      // Create new cluster
      const currentDispatch = this.dispatches[i];
      if (!currentDispatch) continue;

      const clusterDispatches: Dispatch[] = [currentDispatch];
      clusterAssignment[i] = clusterId;
      const neighborQueue = [...neighbors];

      // Process all neighbors
      while (neighborQueue.length > 0) {
        const neighborIndex = neighborQueue.pop()!;

        if (!this.visited.has(neighborIndex)) {
          this.visited.add(neighborIndex);
          const neighborNeighbors = this.findNeighbors(neighborIndex, epsilon);

          if (neighborNeighbors.length >= minPoints - 1) {
            neighborQueue.push(...neighborNeighbors);
          }
        }

        // Add to cluster if not already assigned
        if (clusterAssignment[neighborIndex] === -1) {
          clusterAssignment[neighborIndex] = clusterId;
          const neighborDispatch = this.dispatches[neighborIndex];
          if (neighborDispatch) {
            clusterDispatches.push(neighborDispatch);
          }
        }
      }

      // Create cluster object
      const cluster: Cluster = {
        id: clusterId,
        dispatches: clusterDispatches,
        centroid: this.calculateCentroid(clusterDispatches),
        bounds: this.calculateBounds(clusterDispatches),
      };

      this.clusters.push(cluster);
      clusterId++;
    }

    return this.clusters;
  }

  // Calculate centroid of cluster markers
  private calculateCentroid(dispatches: Dispatch[]): LatLng {
    const totalLat = dispatches.reduce(
      (sum, dispatch) => sum + dispatch.latitude,
      0,
    );
    const totalLng = dispatches.reduce(
      (sum, dispatch) => sum + dispatch.longitude,
      0,
    );

    return {
      lat: totalLat / dispatches.length,
      lng: totalLng / dispatches.length,
    };
  }

  // Calculate bounds for cluster
  private calculateBounds(dispatches: Dispatch[]): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    if (dispatches.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    let north = dispatches[0]!.latitude;
    let south = dispatches[0]!.latitude;
    let east = dispatches[0]!.longitude;
    let west = dispatches[0]!.longitude;

    dispatches.forEach((dispatch) => {
      north = Math.max(north, dispatch.latitude);
      south = Math.min(south, dispatch.latitude);
      east = Math.max(east, dispatch.longitude);
      west = Math.min(west, dispatch.longitude);
    });

    return { north, south, east, west };
  }

  // Get noise points (markers not in any cluster)
  public getNoisePoints(): Dispatch[] {
    const clusteredIndices = new Set<number>();
    this.clusters.forEach((cluster) => {
      cluster.dispatches.forEach((dispatch) => {
        // Find the original index of this marker
        const originalIndex = this.dispatches.findIndex(
          (d) =>
            d.latitude === dispatch.latitude &&
            d.longitude === dispatch.longitude &&
            d.type === dispatch.type,
        );
        if (originalIndex !== -1) {
          clusteredIndices.add(originalIndex);
        }
      });
    });

    return this.dispatches.filter(
      (dispatch, index) => !clusteredIndices.has(index),
    );
  }
}

// Usage example with your dispatch data
function clusterDispatches(
  zoom: number,
  markers: Dispatch[],
): {
  clusters: Cluster[];
  noise: Dispatch[];
} {
  const markerClusters = new MapClustering(markers);

  const clusters = markerClusters.cluster(zoom, 2); // min 2 points per cluster

  return {
    clusters,
    noise: markerClusters.getNoisePoints(),
  };
}

export { MapClustering, type Cluster, clusterDispatches };
