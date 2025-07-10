import { type DispatchesSchema } from "@sizeupdashboard/convex/api/schema";
import { type z } from "zod";

export type LatLng = google.maps.LatLngLiteral;

export type LatLngBounds = google.maps.LatLngBoundsLiteral;

export type Cluster = {
  center: LatLng;
  points: { location: LatLng; type: string }[];
};

export type Dispatch = z.infer<typeof DispatchesSchema> & {
  location: LatLng;
  _creationTime: number;
};
