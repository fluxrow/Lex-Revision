"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Icon from "@/components/ui/Icon";

type SignOutButtonProps = {
  className?: string;
  size?: "sm" | "lg";
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  label?: string;
};

export default function SignOutButton({
  className,
  size = "sm",
  variant = "secondary",
  fullWidth = false,
  label = "Sair",
}: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);

    try {
      await fetch("/api/auth/signout", {
        method: "POST",
      });
    } finally {
      router.replace("/login?signed_out=1");
      router.refresh();
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size}${className ? ` ${className}` : ""}`}
      style={fullWidth ? { width: "100%" } : undefined}
      onClick={handleSignOut}
      disabled={loading}
    >
      <Icon name="logout" size={size === "lg" ? 14 : 12} />
      {loading ? "Saindo..." : label}
    </button>
  );
}
