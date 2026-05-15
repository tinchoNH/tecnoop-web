"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ClipboardList, ChevronRight, Clock, CheckCircle, Play, AlertCircle } from "lucide-react";

const ESTADO_CONFIG = {
  pendiente:  { label: "Pendiente",  color: "bg-slate-100 text-slate-600",   icon: Clock,         orden: 0 },
  asignada:   { label: "Asignada",   color: "bg-blue-100 text-blue-700",     icon: Clock,         orden: 1 },
  en_curso:   { label: "En curso",   color: "bg-amber-100 text-amber-700",   icon: Play,          orden: 2 },
  realizada:  { label: "Realizada",  color: "bg-emerald-100 text-emerald-700", icon: CheckCircle, orden: 3 },
  cancelada:  { label: "Cancelada",  color: "bg-red-100 text-red-600",       icon: AlertCircle,   orden: 4 },
};

function fmtHora(hora) {
  if (!hora) return "";
  return hora.slice(0, 5);
}

export default function TecnicoHome() {
  const [ots,     setOts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const router = useRouter();

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await api.get("/ordenes/mis-ots");
      setOts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const activas  = ots.filter(o => ["pendiente","asignada","en_curso"].includes(o.estado));
  const cerradas = ots.filter(o => ["realizada","cancelada"].includes(o.estado));

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-lg font-bold text-slate-900 capitalize">{hoy}</h1>
        <p className="text-sm text-slate-500">
          {ots.length === 0 ? "Sin órdenes asignadas hoy" : `${ots.length} orden${ots.length !== 1 ? "es" : ""} asignada${ots.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-48" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {!loading && ots.length === 0 && !error && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tenés órdenes para hoy</p>
        </div>
      )}

      {/* OTs activas */}
      {activas.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Por hacer</p>
          {activas.map(ot => <OTCard key={ot.id} ot={ot} onClick={() => router.push(`/tecnico/${ot.id}`)} />)}
        </section>
      )}

      {/* OTs cerradas */}
      {cerradas.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Finalizadas</p>
          {cerradas.map(ot => <OTCard key={ot.id} ot={ot} onClick={() => router.push(`/tecnico/${ot.id}`)} />)}
        </section>
      )}
    </div>
  );
}

function OTCard({ ot, onClick }) {
  const cfg = ESTADO_CONFIG[ot.estado] || ESTADO_CONFIG.pendiente;
  const Icon = cfg.icon;

  return (
    <button onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="font-semibold text-slate-900 text-sm truncate">{ot.clientes?.razon_social || "Cliente"}</p>
          {ot.hora_inicio && <span className="text-xs text-slate-400 shrink-0 ml-2">{fmtHora(ot.hora_inicio)}</span>}
        </div>
        <p className="text-xs text-slate-500 truncate">{ot.tipo_servicio}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{ot.sedes?.direccion || ot.sedes?.nombre}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </div>
    </button>
  );
}
