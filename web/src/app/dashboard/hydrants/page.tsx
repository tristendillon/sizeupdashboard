"use client";

import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { useMutation } from "convex/react";

export default function HydrantsPage() {
  const createHydrants = useMutation(api.hydrants.paginatedCreateHydrants);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      // Support both { hydrants: [...] } and just [...]
      const hydrants = Array.isArray(json) ? json : json.hydrants;
      if (!Array.isArray(hydrants)) {
        alert(
          'Invalid JSON: expected an array or an object with a "hydrants" array',
        );
        return;
      }

      // Batch upload in chunks of 100, send all batches in parallel
      const batchSize = 100;
      const batches = [];
      for (let i = 0; i < hydrants.length; i += batchSize) {
        const batch = hydrants.slice(i, i + batchSize);
        batches.push(createHydrants({ hydrants: batch }));
      }
      await Promise.all(batches);

      alert("Hydrants uploaded successfully!");
    } catch (e) {
      alert("Failed to parse JSON: " + (e as Error).message);
    }
  };

  return (
    <div>
      <h2>Hydrants</h2>
      <input
        type="file"
        accept="application/json"
        onChange={handleFileChange}
      />
    </div>
  );
}
