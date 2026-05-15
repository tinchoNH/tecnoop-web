"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export default function LoginPage() {
  const { login, loading, user, rol } = useAuth();
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [error,      setError]      = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) {
    if (typeof window !== "undefined") {
      window.location.href = rol === "tecnico" ? "/tecnico" : "/dashboard";
    }
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const data = await api.post("/auth/login", { email, password });
      login(data.access_token, data.user.nombre, data.user.rol, data.user.empresa_id, data.user.tecnico_id);
    } catch { setError("Email o contraseña incorrectos"); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)"}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white">TecnoOP</h1>
          <p className="text-slate-400 text-sm mt-1">Gestión de técnicos en campo</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition text-sm" placeholder="tu@email.com"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition text-sm" placeholder="••••••••"/>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-2.5 rounded-xl font-semibold text-white transition disabled:opacity-50 text-sm mt-2"
            style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
