"use client";

import { deleteCookie, getCookie } from "@/utils/cookies";
import { useAction } from "convex/react";
import { useCallback, type ReactNode } from "react";
import { api } from "@sizeupdashboard/convex/api/_generated/api";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "./button";
import { useAuth } from "@/hooks/use-auth";

export interface LogoutButtonProps extends ButtonProps {
  children?: ReactNode;
}

export function LogoutButton({
  children = "Logout",
  onClick,
  ...props
}: LogoutButtonProps) {
  const logoutAction = useAction(api.auth.logout);
  const { isAuthed, isLoading } = useAuth();
  const router = useRouter();

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      const sessionToken = getCookie("session-token");
      if (sessionToken) {
        await logoutAction({ sessionId: sessionToken });
      }
      deleteCookie("session-token");
      deleteCookie("refresh-token");
      router.push("/login");
    },
    [logoutAction, router, onClick],
  );

  return (
    <Button {...props} onClick={handleClick} disabled={isLoading || !isAuthed}>
      {children}
    </Button>
  );
}
