"use client";

import { logout } from "@/src/actions/auth";
import { Button } from "@/src/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface TopbarProps {
  userName: string;
}

export function Topbar({ userName }: TopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <h2 className="text-lg font-semibold">Welcome, {userName}</h2>
      </div>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </header>
  );
}

