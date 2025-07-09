import type { LatLng } from "@/lib/types";
import { getAlertIconPath } from "@/utils/icons";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { cn } from "@/utils/ui";
import Image from "next/image";

interface IncidentMarkerProps {
  location: LatLng;
  type: string;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function IncidentMarker({
  location,
  type,
  children,
  className,
  onClick,
}: IncidentMarkerProps) {
  const icon = getAlertIconPath(type);

  return (
    <AdvancedMarker
      onClick={onClick}
      className={cn("relative", className)}
      position={location}
    >
      <Image src={icon} alt={type} width={40} height={40} />
      {children}
    </AdvancedMarker>
  );
}
