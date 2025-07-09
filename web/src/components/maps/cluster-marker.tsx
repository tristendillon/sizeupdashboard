import type { Dispatch } from "@/lib/types";
import { getAlertIconPath, getAlertIconType } from "@/utils/icons";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { cn } from "@/utils/ui";
import Image from "next/image";
import { useDispatches } from "@/providers/dispatches-provider";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ClusterMarkerProps {
  dispatch: Dispatch;
  type: string;
  children?: React.ReactNode;
  className?: string;
  clusterDispatches?: Dispatch[];
}

const randomColor = () => {
  const color = Math.floor(Math.random() * 16777215).toString(16);
  return `#${color}`;
};

export default function ClusterMarker({
  dispatch,
  type,
  children,
  className,
  clusterDispatches,
}: ClusterMarkerProps) {
  const { getLocationsSimilarTo } = useDispatches();

  const [isOpen, setIsOpen] = useState(false);
  const [similarDispatches, setSimilarDispatches] = useState<Dispatch[]>([]);

  const icon = getAlertIconPath(type);
  const color = randomColor();

  const isCluster = clusterDispatches && clusterDispatches.length > 0;

  const handleMarkerClick = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);

    const location = {
      lat: dispatch.latitude,
      lng: dispatch.longitude,
    };
    const dispatches = getLocationsSimilarTo(location, 10);
    const clusterIds = clusterDispatches?.map((d) => d.dispatchId);
    const uniqueDispatches = dispatches.filter(
      (d) => !clusterIds?.includes(d.dispatchId),
    );
    setSimilarDispatches(uniqueDispatches);
  };

  const displayTitle = isCluster
    ? `${getAlertIconType(type)} Cluster`
    : `${getAlertIconType(type)} Incident`;

  const displayCount = isCluster
    ? clusterDispatches.length
    : similarDispatches.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <AdvancedMarker
          zIndex={clusterDispatches ? 10000 : 100}
          onClick={handleMarkerClick}
          className={cn(
            "relative cursor-pointer",
            className,
            `bg-[${color}]/20`,
          )}
          position={{
            lat: dispatch.latitude,
            lng: dispatch.longitude,
          }}
        >
          <Image src={icon} alt={type} width={40} height={40} />
          {children}
        </AdvancedMarker>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Image src={icon} alt={type} width={24} height={24} />
            <h3 className="text-lg font-semibold capitalize">{displayTitle}</h3>
          </div>

          <div className="text-muted-foreground text-sm">
            <p>Dispatch ID: {dispatch.dispatchId}</p>
            {isCluster && (
              <p className="mt-1">
                Contains {clusterDispatches.length} incidents
              </p>
            )}
          </div>
          {clusterDispatches && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                {`Incidents in Cluster (${clusterDispatches.length}):`}
              </h4>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {clusterDispatches.map((dispatch, index) => (
                  <div key={index} className="space-y-2">
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      <div
                        key={index}
                        className="bg-muted rounded-md p-2 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Image
                              src={getAlertIconPath(dispatch.type)}
                              alt={dispatch.type}
                              width={16}
                              height={16}
                            />
                            <span className="capitalize">{dispatch.type}</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Dispatch ID: {dispatch.dispatchId}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {similarDispatches.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                {`Similar Incidents (${similarDispatches.length}):`}
              </h4>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {similarDispatches.map((dispatch, index) => (
                  <div key={index} className="bg-muted rounded-md p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Image
                          src={getAlertIconPath(dispatch.type)}
                          alt={dispatch.type}
                          width={16}
                          height={16}
                        />
                        <span className="capitalize">{dispatch.type}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Dispatch ID: {dispatch.dispatchId}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
