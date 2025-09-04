"use client";

import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import React from "react";

export function DashboardHeader() {
  const pathname = usePathname();

  return (
    <div className="flex w-full items-center justify-between">
      <Breadcrumbs />

      <div className="flex items-center gap-2">
        <Link
          href={`${pathname}/search`}
          className="hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Search</span>
        </Link>

        <Link
          href={`${pathname}/notifications`}
          className="hover:bg-accent hover:text-accent-foreground relative flex items-center justify-center rounded-md p-2 transition-colors"
        >
          <Bell className="size-4" />
          <span className="absolute -top-1 -right-1 h-4 w-4 items-center justify-center rounded-full bg-red-500 text-center text-xs text-white">
            3
          </span>
        </Link>

        <SidebarTrigger className="md:hidden" />
      </div>
    </div>
  );
}
