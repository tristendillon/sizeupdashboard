import type { DispatchType } from "@sizeupdashboard/convex/src/api/schema.ts";

const fireDescriptors = ["fire", "burn", "smoke", "explosion", "bomb"];

export function getAlertIconType(input: string): "fire" | "medical" {
  const descriptor = input.toLowerCase();
  if (fireDescriptors.some((desc) => descriptor.includes(desc))) {
    return "fire";
  }
  return "medical";
}

export function getAlertIconPath(dispatchType: DispatchType | string) {
  if (typeof dispatchType === "string") {
    const fallbackType = getAlertIconType(dispatchType);
    return `/icons/incidents/${fallbackType}.png`;
  }
  return `/icons/incidents/${dispatchType.group}.png`;
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
