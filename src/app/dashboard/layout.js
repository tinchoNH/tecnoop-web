"use client";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";
const PING_INTERVAL = 12 * 60 * 1000;

function useKeepAlive() {
  useEffect(() => {
    const ping = () => fetch(`${API_URL}/health`).catch(() => {});
    ping();
    const id = setInterval(ping, PING_INTERVAL);
    return () => clearInterval(id);
  }, []);
}

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  useKeepAlive();

  if (loading) return null;
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 bg-slate-50 overflow-auto">
        {children}
      </main>
    </div>
  );
}
