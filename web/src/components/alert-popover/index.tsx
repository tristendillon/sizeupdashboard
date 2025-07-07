"use client";

import { useQuery } from "@/lib/use-query";
import { getBoundsFromCenterZoom } from "@/lib/utils";
import { api } from "@sizeupdashboard/convex/api/_generated/api";
import { useEffect, useRef, useState } from "react";
import { GoogleMap } from "../maps/google-map";
import type { LatLngBounds } from "@/lib/types";
import { HydrantsRenderer } from "../maps/hydrants-renderer";

const SINCE_MS = 1000 * 60 * 2;
const MAP_ZOOM = 18;
const MAP_ID = "alert-popover-map";

const testResponse = {
  dispatch: {
    _creationTime: 1751761732452.4138,
    _id: "jh737m6t8kb025rewgs2vq3nqn7k7mm1",
    address: "2121 MEADOWLARK RD",
    address2: null,
    city: "MANHATTAN",
    dispatchCreatedAt: 1751761710000,
    dispatchId: 38176469,
    incidentTypeCode: "ALARM FIRE",
    latitude: 39.208423,
    longitude: -96.577489,
    message: null,
    narrative: `2025-07-05 19:31:03: **RP DARLEEN PH / 785-537-4610 STATES SLOAN HOUSE FIRE ALARM GOING OFF. DOES NOT SEE OR SMELL ANY SMOKE.
2025-07-05 19:31:01: **OUTSIDE RM P-105
2025-07-05 19:30:41: **RP DARLEEN STATES SLOAN HOUSE FIRE ALARM GOING OFF. DOES NOT SEE OR SMELL ANY SMOKE.
2025-07-05 19:30:03: - The phone number of the business/resident/owner is: MIKE DAVIS PH/ 785 313 0561
 - N/A - business/resident/owner name has already been obtained.
 - There is no reference number for this alarm.
2025-07-05 19:29:25: Dispatch Code: 52B06 (Unknown situation (investigation/call box))
Suffix: G (General/Fire)
Unit Response: Bravo
 - The caller is an alarm monitoring company.
 - The type of structure involved is: MEADOWLARK
 - It is a general/fire alarm.
 - The area or zone/room activated is: ZONE 81
2025-07-05 19:28:43: Chief Complaint: Alarm monitoring company

Contact: OPER/ 131
Phone: (877)532-1500
TIME:
CODE:
DATE:
INCIDENT: , 250001642
ZONE:`,
    stateCode: "KS",
    statusCode: "open",
    type: "ALARM FIRE",
    unitCodes: ["E1", "Q2"],
    xrefId: "1820043",
  },
};

export function AlertPopover() {
  const mapSectionRef = useRef<HTMLDivElement>(null);
  // const { data, isPending, error } = useQuery(
  //   api.dispatches.getRecentDispatch,
  //   {
  //     since: SINCE_MS,
  //   },
  // );

  const data = testResponse;
  const isPending = false;
  const shouldRenderNull = isPending || !data || !data.dispatch;

  if (shouldRenderNull) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-red-500">
      <nav className="bg-blue-600 p-4 text-white">
        <div className="text-lg font-semibold">Navigation</div>
      </nav>

      <div className="flex flex-1 flex-col-reverse md:flex-row">
        <section className="flex min-h-[40vh] min-w-[40%] items-center justify-center bg-green-500 text-white md:h-full">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-bold">Section 1</h2>
            <p>40% width on desktop, bottom on mobile</p>
          </div>
        </section>

        <GoogleMap
          id={MAP_ID}
          ref={mapSectionRef}
          center={{
            lat: data.dispatch.latitude,
            lng: data.dispatch.longitude,
          }}
          mapType="satellite"
          zoom={MAP_ZOOM}
          className="flex flex-1 items-center justify-center bg-purple-500 text-white md:w-[60%]"
          mapClassName="w-full h-full"
        >
          <HydrantsRenderer mapId={MAP_ID} />
        </GoogleMap>
      </div>
    </div>
  );
}
