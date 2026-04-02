"use client";

import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Loader2 } from "lucide-react";
import { api } from "../../../../convex/_generated/api";

function RedirectToLogin() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
    </div>
  );
}

function RequireAgent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const me = useQuery(api.agents.me);

  useEffect(() => {
    if (me === null) {
      router.replace("/setup");
    }
  }, [me, router]);

  if (me === undefined || me === null) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      <Unauthenticated>
        <RedirectToLogin />
      </Unauthenticated>
      <Authenticated>
        <RequireAgent>{children}</RequireAgent>
      </Authenticated>
    </>
  );
}
