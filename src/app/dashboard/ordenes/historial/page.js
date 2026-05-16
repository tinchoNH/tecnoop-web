"use client";
import { useState, useEffect } from "react";
import { Badge } from "@tremor/react";
import {
  Search, Filter, Clock, CheckCircle, PlayCircle,
  XCircle, User, MapPin, ChevronRight, Calendar,
} from "lucide-react";
import { api } from "@/lib/api";

const ESTADO = {
  pendiente:  { color: "amber",   label: "Pendiente"  },
  asignada:   { color: "blue",    label: "Asignada"   },
  en_curso:   { color: "indigo",  label: "En curso"   },
  realizada:  { color: "emerald", label: "Realizada"  },
  cancelada:  { color: "red",     label: "Cancelada"  },
};

const hoy = new Date().toISOString().split("T")[0];
const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

export default function HistorialPage() {
  const [ordenes,   setOrdenes]   = useState([]);
  const [tecnicos,  setTecnicos]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [detalle,   setDetalle]   = useState(null);

  const [filtros, setFiltros] = useState({
    desde: hace30, hasta: hoy, estado: "", tecnico_id: "", busqueda: "",
  });

  useEffect(() => {
    api.get("/tecnicos/").then(setTecnicos);
  }, []);

  useEffect(() => { buscar(); }, [filtros.desde, filtros.hasta, filtros.estado, filtros.tecnico_id]);

  async function buscar() {
    setLoading(true);
    try {
      const params = {};
      if (filtros.desde)      params.desde      = filtros.desde;
      if (filtros.hasta)      params.hasta      = filtros.hasta;
      if (filtros.estado)     params.estado     = filtros.estado;
      if (filtros.tecnico_id) params.tecnico_id = filtros.tecnico_id;
      setOrdenes(await api.get("/ordenes/", params));
    } finally { setLoading(false); }
  }

  const set = (k, v) => setFiltros(f => ({ ...f, [k]: v }));

  const filtradas = ordenes.filter(o => {
    if (!filtros.busqueda) return true;
    const q = filtros.busqueda.toLowerCase();
    return (
      o.tipo_servicio?.toLowerCase().includes(q) ||
      o.clientes?.razon_social?.toLowerCase().includes(q) ||
      o.sedes?.nombre?.toLowerCase().includes(q) ||
      o.tecnicos?.nombre?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Historial de OTs</h1>
        <p className="text-sm text-slate-500 mt-0.5">{filtradas.length} órdenes encontradas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Desde</label>
          <input type="date" value={filtros.desde} onChange={e => set("desde", e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Hasta</label>
          <input type="date" value={filtros.hasta} onChange={e => set("hasta", e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Estado</label>
          <select value={filtros.estado} onChange={e => set("estado", e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
            <option value="">Todos</option>
            {Object.entries(ESTADO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Técnico</label>
          <select value={filtros.tecnico_id} onChange={e => set("tecnico_id", e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
            <option value="">Todos</option>
            {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-48">
          <label className="text-xs font-medium text-slate-500 mb-1 block">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={filtros.busqueda} onChange={e => set("busqueda", e.target.value)}
              placeholder="Cliente, técnico, servicio..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4 px-6 py-4 border-b border-slate-50">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
                <div className="h-4 bg-slate-100 rounded animate-pulse flex-1" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-32" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-20" />
              </div>
            ))}
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Sin resultados para los filtros aplicados</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Servicio / Cliente</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sede</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Técnico</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtradas.map(o => {
                const est = ESTADO[o.estado] || ESTADO.pendiente;
                return (
                  <tr key={o.id}
                    onClick={() => setDetalle(o)}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {new Date(o.fecha_programada + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                      </div>
                      {o.hora_inicio && (
                        <p className="text-xs text-slate-400 mt-0.5 pl-5">{o.hora_inicio.slice(0,5)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{o.tipo_servicio}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{o.clientes?.razon_social}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{o.sedes?.nombre}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[180px]">{o.sedes?.direccion}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const ids = o.tecnicos_ids?.length ? o.tecnicos_ids : (o.tecnico_id ? [o.tecnico_id] : []);
                        const asignados = tecnicos.filter(t => ids.includes(t.id));
                        if (asignados.length === 0) return <span className="text-xs text-slate-300 italic">Sin asignar</span>;
                        return (
                          <div className="space-y-1">
                            {asignados.map(t => (
                              <div key={t.id} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {t.nombre.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                                </div>
                                <span className="text-sm text-slate-700">{t.nombre}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={est.color} size="xs">{est.label}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-over detalle (reutiliza la misma lógica) */}
      {detalle && (
        <DetalleOT orden={detalle} tecnicos={tecnicos} onClose={() => setDetalle(null)} onActualizada={(o) => { setDetalle(o); buscar(); }} />
      )}
    </div>
  );
}

/* ─── Detalle OT en historial (solo lectura + cambio estado) ─── */
function DetalleOT({ orden, tecnicos, onClose, onActualizada }) {
  const [saving, setSaving] = useState(false);
  const abierto = !!orden;

  const TRANSICIONES = {
    pendiente: [],
    asignada:  [{ a: "en_curso",  label: "Iniciar" }],
    en_curso:  [{ a: "realizada", label: "Cerrar OT" }],
    realizada: [],
    cancelada: [],
  };

  async function avanzarEstado(nuevoEstado) {
    setSaving(true);
    try {
      const updated = await api.patch(`/ordenes/${orden.id}/estado`, { estado: nuevoEstado });
      onActualizada(updated);
    } finally { setSaving(false); }
  }

  const est = ESTADO[orden.estado] || ESTADO.pendiente;
  const transiciones = TRANSICIONES[orden.estado] || [];

  return (
    <>
      <div onClick={onClose}
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        style={{ opacity: abierto ? 1 : 0, pointerEvents: abierto ? "auto" : "none" }} />

      <div className="fixed top-0 right-0 h-full w-[440px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: abierto ? "translateX(0)" : "translateX(100%)" }}>

        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge color={est.color}>{est.label}</Badge>
            </div>
            <p className="font-bold text-slate-900">{orden.tipo_servicio}</p>
            <p className="text-sm text-slate-400">{orden.clientes?.razon_social}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400">
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {transiciones.length > 0 && (
            <div className="flex gap-2">
              {transiciones.map(tr => (
                <button key={tr.a} onClick={() => avanzarEstado(tr.a)} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
                  style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
                  {saving ? "..." : tr.label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <Row label="Fecha" value={new Date(orden.fecha_programada + "T12:00:00").toLocaleDateString("es-AR", { weekday:"long", day:"numeric", month:"long", year:"numeric" })} />
            {orden.hora_inicio && <Row label="Hora" value={orden.hora_inicio.slice(0,5)} />}
            <Row label="Sede" value={`${orden.sedes?.nombre} — ${orden.sedes?.direccion}`} />
            {(() => {
              const ids = orden.tecnicos_ids?.length ? orden.tecnicos_ids : (orden.tecnico_id ? [orden.tecnico_id] : []);
              const asignados = tecnicos.filter(t => ids.includes(t.id));
              return (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Técnicos</p>
                  {asignados.length > 0
                    ? <p className="text-sm text-slate-700">{asignados.map(t => t.nombre).join(", ")}</p>
                    : <p className="text-sm text-slate-400 italic">Sin asignar</p>}
                </div>
              );
            })()}
            {orden.descripcion && <Row label="Descripción" value={orden.descripcion} />}
            {orden.observaciones && <Row label="Observaciones" value={orden.observaciones} />}
            {orden.fecha_inicio_real && (
              <Row label="Inicio real" value={new Date(orden.fecha_inicio_real).toLocaleString("es-AR")} />
            )}
            {orden.fecha_cierre_real && (
              <Row label="Cierre real" value={new Date(orden.fecha_cierre_real).toLocaleString("es-AR")} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}
