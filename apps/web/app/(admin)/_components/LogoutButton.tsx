"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        background: "transparent",
        border: "1px solid #334155",
        borderRadius: 6,
        padding: "5px 14px",
        color: "#94a3b8",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );
}
