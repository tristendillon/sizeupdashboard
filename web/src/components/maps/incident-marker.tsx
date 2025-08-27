import type { LatLng } from "@/lib/types";
import { getAlertIconPath } from "@/utils/icons";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { cn } from "@/utils/ui";
import Image from "next/image";
import type { DispatchType } from "@sizeupdashboard/convex/src/api/schema.ts";

interface IncidentMarkerProps {
  location: LatLng;
  dispatchType?: DispatchType;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function IncidentMarker({
  location,
  dispatchType,
  children,
  className,
  onClick,
}: IncidentMarkerProps) {
  const icon = getAlertIconPath(dispatchType ?? "other");

  return (
    <AdvancedMarker
      onClick={onClick}
      className={cn("relative", className)}
      position={location}
    >
      <Image
        src={icon}
        alt={dispatchType?.group ?? "other"}
        width={40}
        height={40}
      />
      {children}
    </AdvancedMarker>
  );
}
