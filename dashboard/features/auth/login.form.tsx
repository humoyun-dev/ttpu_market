"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ROUTES } from "@/lib/constants/routes";
import { loginSchema, type LoginValues } from "@/features/auth/auth.schemas";
import { login } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { toDashboardRole } from "@/features/auth/auth.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function LoginForm() {
  const router = useRouter();
  const setActiveStoreId = useAuthStore((s) => s.setActiveStoreId);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: LoginValues) {
    setError(null);
    try {
      const session = await login(values);
      setActiveStoreId(null);
      deleteCookie("ttpu_store_id");

      const role = toDashboardRole(session.user.role);
      if (!role) {
        setError("Unsupported account role.");
        return;
      }
      if (role === "admin") {
        router.push(ROUTES.admin.dashboard);
        return;
      }

      router.push(ROUTES.seller.storeSwitch);
    } catch {
      setError("Login failed. Please check your credentials.");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              autoComplete="email"
              type="email"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              autoComplete="current-password"
              type="password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
