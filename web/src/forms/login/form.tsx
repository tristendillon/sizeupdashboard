"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldInfo } from "@/components/ui/field-info";
import { useAction } from "convex/react";
import { z } from "zod";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { useRouter } from "next/navigation";
import { setCookie } from "@/utils/cookies";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function LoginForm() {
  const loginAction = useAction(api.auth.login);
  const router = useRouter();

  const form = useForm({
    validators: {
      onSubmit: loginSchema,
    },
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const result = await loginAction({
        email: value.email,
        password: value.password,
      });
      if (result.success && result.user) {
        setCookie("session-token", result.user.sessionToken);
        setCookie("refresh-token", result.user.refreshToken);
        router.push("/dashboard");
      }
    },
  });

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? "Email is required"
                  : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                    ? "Please enter a valid email"
                    : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter your email"
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? "Password is required"
                  : value.length < 6
                    ? "Password must be at least 6 characters"
                    : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter your password"
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit} className="w-full">
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
