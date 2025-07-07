import type { LatLng } from "./types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function validateNonNullishProps<
  T extends Record<string, unknown>,
  K extends keyof T,
>(obj: T, keys: K[]): obj is T & { [P in K]-?: NonNullable<T[P]> } {
  return keys.every((key) => {
    const value = obj[key];
    return value !== null && value !== undefined;
  });
}

const fireDescriptors = ["fire", "burn", "smoke", "explosion", "bomb"];

export function getAlertIconPath(input: string) {
  let icon: string;
  const descriptor = input.toLowerCase();
  // Refactor this to have more icons in the future with a different way of handling the descriptor (constants? idk tbh)
  if (fireDescriptors.some((desc) => descriptor.includes(desc))) {
    icon = "fire";
  } else {
    icon = "medical";
  }

  return `/icons/incidents/${icon}.png`;
}

export const getFlowRateColor = (flow_rate: number) => {
  if (flow_rate < 500) {
    return "red";
  } else if (flow_rate >= 500 && flow_rate < 1000) {
    return "orange";
  } else if (flow_rate >= 1000 && flow_rate < 1500) {
    return "green";
  } else {
    return "blue";
  }
};

export const getLatLngDistances = (
  latlng1: LatLng,
  latlng2: LatLng,
): number => {
  const R = 6371000; // Earth's radius in meters (same as Google Maps)

  // Convert latitude and longitude from degrees to radians
  const lat1Rad = (latlng1.lat * Math.PI) / 180;
  const lat2Rad = (latlng2.lat * Math.PI) / 180;
  const deltaLatRad = ((latlng2.lat - latlng1.lat) * Math.PI) / 180;
  const deltaLngRad = ((latlng2.lng - latlng1.lng) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in meters
  const distance = R * c;

  return distance;
};
