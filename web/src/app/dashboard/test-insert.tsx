"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { useState } from "react";

export function TestInsert() {
  const { mutateAsync, status } =
    trpc.customization.createDispatchType.useMutation();

  const [file, setFile] = useState<File | null>(null);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    const text = await file.text();
      const dispatchTypes = text
      .trim()
      .split("\n")
      .slice(1)
      .map((line) => {
        const [code, name, group] = line.split(",");
        return {
          code: code ?? "INVALID CSV FM",
          name: name ?? "INVALID CSV FM",
          group: group as
            | "aircraft"
            | "fire"
            | "hazmat"
            | "mva"
            | "marine"
            | "law"
            | "rescue"
            | "medical"
            | "other",
        };
      });

    await mutateAsync({
      dispatchTypes,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="file">File</label>
      <input
        type="file"
        accept=".csv"
        id="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <Button type="submit" disabled={status === "pending"}>
        {status === "pending" ? "Loading..." : "Submit"}
      </Button>
    </form>
  );
}
