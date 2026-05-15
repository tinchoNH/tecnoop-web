"use client";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function TecnicoLayout({ children }) {
  const { user, rol, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [loading, user]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-lg mx-auto">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
            style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>T</div>
          <span className="font-bold text-slate-900 text-sm">TecnoOP</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{user}</span>
          <button onClick={logout}
            className="text-xs text-slate-400 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50">
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 pb-6">
        {children}
      </main>
    </div>
  );
}
