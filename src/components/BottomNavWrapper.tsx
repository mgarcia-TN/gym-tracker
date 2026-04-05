"use client";

import { useAuth } from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";

export default function BottomNavWrapper() {
  const { user } = useAuth();
  if (!user) return null;
  return <BottomNav />;
}
