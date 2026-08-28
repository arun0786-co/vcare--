"use client";

import { useRouter } from "next/navigation";
import { api } from "../_lib/api";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" }).catch(() => {});
        router.push("/login");
        router.refresh();
      }}
      className="text-sm text-zinc-600 hover:text-zinc-900"
    >
      Log out
    </button>
  );
}
