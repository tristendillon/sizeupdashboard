"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import {
  ChevronUp,
  Database,
  FileText,
  Home,
  Key,
  LogOut,
  Settings,
  Shield,
  User2,
  Wrench,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";

const DASHBOARD_URL = "/dashboardv2";

// Navigation items
const navigationItems = [
  {
    title: "Dashboard",
    url: DASHBOARD_URL,
    icon: Home,
  },
  {
    title: "View Tokens",
    url: `${DASHBOARD_URL}/view-tokens`,
    icon: Key,
  },
];

const dataManagementItems = [
  {
    title: "Hydrants",
    url: `${DASHBOARD_URL}/hydrants`,
    icon: Database,
  },
  {
    title: "Dispatch Types",
    url: `${DASHBOARD_URL}/dispatch-types`,
    icon: Shield,
  },
];

const transformationItems = [
  {
    title: "Field Transformations",
    url: `${DASHBOARD_URL}/field-transformations`,
    icon: Wrench,
  },
  {
    title: "Transformation Rules",
    url: `${DASHBOARD_URL}/transformation-rules`,
    icon: FileText,
  },
];

export function DashboardSidebar() {
  const { user } = useUser();
  const { state, toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              {state === "expanded" ? (
                <div className="flex items-center gap-2">
                  <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Image
                      src="/logos/logo_256.png"
                      alt="MFD Alerts"
                      width={64}
                      height={64}
                      quality={100}
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      MFD Alert Dashboard
                    </span>
                  </div>
                </div>
              ) : (
                <SidebarMenuButton
                  size="lg"
                  onClick={toggleSidebar}
                  tooltip="Open sidebar"
                  className="flex items-center justify-center"
                >
                  <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Image
                      src="/logos/logo_256.png"
                      alt="MFD Alerts"
                      width={32}
                      height={32}
                      quality={100}
                    />
                  </div>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
          {state === "expanded" && <SidebarTrigger className="ml-auto" />}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Data Management */}
        <SidebarGroup>
          <SidebarGroupLabel>Data Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dataManagementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Transformations */}
        <SidebarGroup>
          <SidebarGroupLabel>Transformations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {transformationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <User2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.firstName ?? "User"}
                    </span>
                    <span className="truncate text-xs">
                      {user?.emailAddresses[0]?.emailAddress ??
                        "user@example.com"}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link
                    href={`${DASHBOARD_URL}/settings`}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/sign-in" className="cursor-pointer">
                    <LogOut className="mr-2 size-4" />
                    Sign out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
