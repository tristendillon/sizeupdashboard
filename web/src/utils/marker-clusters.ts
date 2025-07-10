// Improved DBSCAN clustering with multiple strategies

import type { Dispatch, LatLng, LatLngBounds } from "@/lib/types";
import { getLatLngDistances } from "./lat-lng";

interface Cluster {
  id: number;
  dispatches: Dispatch[];
  centroid: LatLng;
  bounds: LatLngBounds;
}

const METERS_PER_DEGREE_LAT = 111320;

class MapClustering {
  private dispatches: Dispatch[] = [];
  private visited = new Set<number>();
  private clusters: Cluster[] = [];

  constructor(dispatches: Dispatch[]) {
    this.dispatches = dispatches;
  }

  // More conservative clustering distances
  private getClusteringDistance(zoom: number): number {
    const defaultDistance = 13000;
    const zoomDistanceMap: Record<number, number> = {
      10: defaultDistance,
      11: 10000,
      12: 7000,
      13: 2500,
      14: 1000,
      15: 500,
      16: 250,
      17: 125,
      18: 62.5,
      19: 31.25,
      20: 15.625,
      21: 7.8125,
    };

    const lowerZoom = Math.floor(zoom);
    const upperZoom = Math.ceil(zoom);

    const lowerDistance = zoomDistanceMap[lowerZoom] ?? defaultDistance;
    const upperDistance = zoomDistanceMap[upperZoom] ?? defaultDistance;

    if (lowerZoom === upperZoom) {
      return lowerDistance;
    }

    const ratio = zoom - lowerZoom;
    return lowerDistance + (upperDistance - lowerDistance) * ratio;
  }

  // Calculate distance between two lat/lng points using Haversine formula

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
      const distance = getLatLngDistances(currentPointLatLng, otherPointLatLng);
      if (distance <= epsilon) {
        neighbors.push(i);
      }
    }

    return neighbors;
  }

  // DBSCAN clustering algorithm with cluster size limit
  public cluster(zoom: number, minPoints = 2, maxClusterSize = 20): Cluster[] {
    this.visited.clear();
    this.clusters = [];

    const epsilon = this.getClusteringDistance(zoom);
    const clusterAssignment: number[] = new Array(this.dispatches.length).fill(
      -1,
    );
    let clusterId = 0;

    for (let i = 0; i < this.dispatches.length; i++) {
      if (this.visited.has(i)) continue;

      this.visited.add(i);
      const neighbors = this.findNeighbors(i, epsilon);

      if (neighbors.length < minPoints - 1) {
        continue;
      }

      const currentDispatch = this.dispatches[i];
      if (!currentDispatch) continue;

      const clusterDispatches: Dispatch[] = [currentDispatch];
      clusterAssignment[i] = clusterId;
      const neighborQueue = [...neighbors];

      // Process neighbors but limit cluster size
      while (
        neighborQueue.length > 0 &&
        clusterDispatches.length < maxClusterSize
      ) {
        const neighborIndex = neighborQueue.pop()!;

        if (!this.visited.has(neighborIndex)) {
          this.visited.add(neighborIndex);
          const neighborNeighbors = this.findNeighbors(neighborIndex, epsilon);

          if (neighborNeighbors.length >= minPoints - 1) {
            neighborQueue.push(...neighborNeighbors);
          }
        }

        if (
          clusterAssignment[neighborIndex] === -1 &&
          clusterDispatches.length < maxClusterSize
        ) {
          clusterAssignment[neighborIndex] = clusterId;
          const neighborDispatch = this.dispatches[neighborIndex];
          if (neighborDispatch) {
            clusterDispatches.push(neighborDispatch);
          }
        }
      }

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

  // Alternative: K-means style clustering with fixed number of clusters
  public clusterKMeans(zoom: number, targetClusters: number): Cluster[] {
    this.clusters = [];

    if (this.dispatches.length === 0) return this.clusters;
    if (targetClusters >= this.dispatches.length) {
      // Each dispatch becomes its own cluster
      return this.dispatches.map((dispatch, index) => ({
        id: index,
        dispatches: [dispatch],
        centroid: { lat: dispatch.latitude, lng: dispatch.longitude },
        bounds: this.calculateBounds([dispatch]),
      }));
    }

    // Initialize centroids randomly
    const centroids: LatLng[] = [];
    const shuffled = [...this.dispatches].sort(() => Math.random() - 0.5);
    for (let i = 0; i < targetClusters; i++) {
      const dispatch = shuffled[i];
      if (!dispatch) continue;
      centroids.push({ lat: dispatch.latitude, lng: dispatch.longitude });
    }

    const maxIterations = 100;
    let iteration = 0;

    while (iteration < maxIterations) {
      // Assign each dispatch to nearest centroid
      const clusterAssignments: number[] = [];

      for (const dispatch of this.dispatches) {
        let nearestCentroid = 0;
        let minDistance = Infinity;

        for (let i = 0; i < centroids.length; i++) {
          const centroid = centroids[i];
          if (!centroid) continue;

          const distance = getLatLngDistances(
            { lat: dispatch.latitude, lng: dispatch.longitude },
            centroid,
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestCentroid = i;
          }
        }

        clusterAssignments.push(nearestCentroid);
      }

      // Update centroids
      const newCentroids: LatLng[] = [];
      let centroidsChanged = false;

      for (let i = 0; i < targetClusters; i++) {
        const clusterDispatches = this.dispatches.filter(
          (_, index) => clusterAssignments[index] === i,
        );

        if (clusterDispatches.length > 0) {
          const newCentroid = this.calculateCentroid(clusterDispatches);
          newCentroids.push(newCentroid);

          const oldCentroid = centroids[i];
          if (!oldCentroid) continue;
          if (
            Math.abs(newCentroid.lat - oldCentroid.lat) > 0.0001 ||
            Math.abs(newCentroid.lng - oldCentroid.lng) > 0.0001
          ) {
            centroidsChanged = true;
          }
        } else {
          const centroid = centroids[i];
          if (!centroid) continue;
          newCentroids.push(centroid);
        }
      }

      centroids.splice(0, centroids.length, ...newCentroids);

      if (!centroidsChanged) break;
      iteration++;
    }

    // Create final clusters
    for (let i = 0; i < targetClusters; i++) {
      const clusterDispatches = this.dispatches.filter((_, index) => {
        let nearestCentroid = 0;
        let minDistance = Infinity;

        for (let j = 0; j < centroids.length; j++) {
          const centroid = centroids[j];
          if (!centroid) continue;
          const dispatch = this.dispatches[index];
          if (!dispatch) continue;
          const distance = getLatLngDistances(
            {
              lat: dispatch.latitude,
              lng: dispatch.longitude,
            },
            centroid,
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestCentroid = j;
          }
        }

        return nearestCentroid === i;
      });

      const centroid = centroids[i];
      if (!centroid) continue;
      if (clusterDispatches.length > 0) {
        this.clusters.push({
          id: i,
          dispatches: clusterDispatches,
          centroid,
          bounds: this.calculateBounds(clusterDispatches),
        });
      }
    }

    return this.clusters;
  }

  // Grid-based clustering - divide map into grid cells
  public clusterGrid(zoom: number): Cluster[] {
    this.clusters = [];

    if (this.dispatches.length === 0) return this.clusters;

    const gridSize = this.getClusteringDistance(zoom);
    const gridMap = new Map<string, Dispatch[]>();

    // Group dispatches by grid cell
    for (const dispatch of this.dispatches) {
      const gridX = Math.floor(
        (dispatch.latitude * METERS_PER_DEGREE_LAT) / gridSize,
      );
      const gridY = Math.floor(
        (dispatch.longitude *
          METERS_PER_DEGREE_LAT *
          Math.cos((dispatch.latitude * Math.PI) / 180)) /
          gridSize,
      );
      const gridKey = `${gridX},${gridY}`;

      if (!gridMap.has(gridKey)) {
        gridMap.set(gridKey, []);
      }
      gridMap.get(gridKey)!.push(dispatch);
    }

    // Convert grid cells to clusters
    let clusterId = 0;
    for (const [gridKey, dispatches] of gridMap) {
      if (dispatches.length >= 2) {
        // Only create clusters with multiple dispatches
        this.clusters.push({
          id: clusterId++,
          dispatches,
          centroid: this.calculateCentroid(dispatches),
          bounds: this.calculateBounds(dispatches),
        });
      }
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

// Usage functions with different clustering strategies
function clusterDispatches(
  zoom: number,
  markers: Dispatch[],
  strategy: "dbscan" | "kmeans" | "grid" = "dbscan",
  options: {
    minPoints?: number;
    maxClusterSize?: number;
    targetClusters?: number;
  } = {},
): {
  clusters: Cluster[];
  noise: Dispatch[];
} {
  const clustering = new MapClustering(markers);
  let clusters: Cluster[];

  switch (strategy) {
    case "kmeans":
      // Automatically determine number of clusters based on marker density
      const targetClusters =
        options.targetClusters ?? Math.max(2, Math.floor(markers.length / 10));
      clusters = clustering.clusterKMeans(zoom, targetClusters);
      break;

    case "grid":
      clusters = clustering.clusterGrid(zoom);
      break;

    case "dbscan":
    default:
      clusters = clustering.cluster(
        zoom,
        options.minPoints ?? 2,
        options.maxClusterSize ?? 15,
      );
      break;
  }

  return {
    clusters,
    noise: clustering.getNoisePoints(),
  };
}

export { MapClustering, type Cluster, clusterDispatches };
