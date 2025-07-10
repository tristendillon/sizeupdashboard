import Image from "next/image";
import { Clock } from "./clock";
import { DismissButton } from "./dismiss-button";
import { TurnoutTimer } from "./turnout-timer";
import { LogoutButton } from "./logout-button";

export function Header() {
  return (
    <nav className="bg-card flex h-32 w-screen items-center">
      <div className="hidden min-w-28 items-center gap-4 p-4 sm:flex md:w-full md:max-w-[40%]">
        <Image
          src="/logos/logo_256.png"
          alt="MFD Alerts"
          width={98}
          height={98}
          className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24"
        />
        <h1 className="text-muted-foreground hidden text-center text-lg font-bold tracking-wider uppercase md:block md:text-2xl lg:text-3xl">
          Manhattan <br />
          Fire Department
        </h1>
      </div>
      <div className="border-border flex h-full w-full items-center gap-4 border-l-2 pl-4 text-lg font-semibold">
        <Clock />
        <div className="bg-border h-full w-[2px]" />
        {/* <WeatherDays /> */}
        <TurnoutTimer />
        <DismissButton />
        <LogoutButton />
      </div>
    </nav>
  );
}
