"use client";
import { useState, useEffect } from "react";
import { Badge } from "@tremor/react";
import {
  Plus, RefreshCw, Clock, CheckCircle, AlertCircle,
  PlayCircle, XCircle, User, MapPin, Wrench, X, Pencil,
  ChevronRight, Users,
} from "lucide-react";
import { api } from "@/lib/api";

const ESTADO = {
  pendiente:   { color: "amber",   label: "Pendiente",   icon: Clock        },
  asignada:    { color: "blue",    label: "Asignada",    icon: User         },
  en_curso:    { color: "indigo",  label: "En curso",    icon: PlayCircle   },
  realizada:   { color: "emerald", label: "Realizada",   icon: CheckCircle  },
  cancelada:   { color: "red",     label: "Cancelada",   icon: XCircle      },
};

const TRANSICIONES = {
  pendiente: [],
  asignada:  [{ a: "en_curso",  label: "Iniciar" }],
  en_curso:  [{ a: "realizada", label: "Cerrar OT" }],
  realizada: [],
  cancelada: [],
};

export default function OrdenesHoyPage() {
  const [ordenes,     setOrdenes]     = useState([]);
  const [tecnicos,    setTecnicos]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [seleccionada, setSeleccionada] = useState(null);
  const [showModal,   setShowModal]   = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const [ots, tecs] = await Promise.all([
        api.get("/ordenes/hoy"),
        api.get("/tecnicos/"),
      ]);
      setOrdenes(ots);
      setTecnicos(tecs);
    } finally { setLoading(false); }
  }

  // Agrupar: columna por técnico + columna sin asignar
  const sinAsignar = ordenes.filter(o => !o.tecnico_id && o.estado !== "cancelada");
  const porTecnico = tecnicos.map(t => ({
    tecnico: t,
    ots: ordenes.filter(o => {
      if (o.estado === "cancelada") return false;
      const ids = o.tecnicos_ids?.length ? o.tecnicos_ids : (o.tecnico_id ? [o.tecnico_id] : []);
      return ids.includes(t.id);
    }),
  }));

  const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 capitalize">Vista del día</h1>
          <p className="text-sm text-slate-400 mt-0.5 capitalize">{hoy}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={cargar}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition"
            style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
            <Plus className="w-4 h-4" /> Nueva OT
          </button>
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex gap-4 p-6 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-72 shrink-0 space-y-3">
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              {[...Array(3)].map((_, j) => <div key={j} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 p-6 overflow-x-auto flex-1">
          {/* Columna sin asignar */}
          {sinAsignar.length > 0 && (
            <Columna
              titulo="Sin asignar"
              subtitulo={`${sinAsignar.length} OT${sinAsignar.length !== 1 ? "s" : ""}`}
              ots={sinAsignar}
              color="amber"
              onSelect={setSeleccionada}
              seleccionadaId={seleccionada?.id}
            />
          )}

          {/* Columnas por técnico */}
          {porTecnico.map(({ tecnico, ots }) => (
            <Columna
              key={tecnico.id}
              titulo={tecnico.nombre}
              subtitulo={`${ots.length} OT${ots.length !== 1 ? "s" : ""}`}
              ots={ots}
              color="indigo"
              onSelect={setSeleccionada}
              seleccionadaId={seleccionada?.id}
            />
          ))}

          {ordenes.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
              <CheckCircle className="w-12 h-12 text-slate-200" />
              <p className="font-medium">No hay órdenes para hoy</p>
              <button onClick={() => setShowModal(true)} className="text-sm text-indigo-500 hover:underline">
                + Crear la primera OT del día
              </button>
            </div>
          )}
        </div>
      )}

      {/* Slide-over detalle */}
      <SlideOverOT
        orden={seleccionada}
        tecnicos={tecnicos}
        onClose={() => setSeleccionada(null)}
        onActualizada={async (o) => { await cargar(); setSeleccionada(o); }}
        onCancelada={() => { cargar(); setSeleccionada(null); }}
      />

      {showModal && (
        <ModalNuevaOT
          tecnicos={tecnicos}
          onClose={() => setShowModal(false)}
          onCreada={cargar}
        />
      )}
    </div>
  );
}

/* ─── Columna kanban ─── */
function Columna({ titulo, subtitulo, ots, color, onSelect, seleccionadaId }) {
  return (
    <div className="w-72 shrink-0 flex flex-col gap-3">
      <div className={`flex items-center justify-between px-3 py-2 rounded-xl bg-${color}-50`}>
        <div className="flex items-center gap-2">
          <Users className={`w-4 h-4 text-${color}-500`} />
          <span className={`text-sm font-semibold text-${color}-700`}>{titulo}</span>
        </div>
        <span className={`text-xs text-${color}-500 font-medium`}>{subtitulo}</span>
      </div>
      {ots.length === 0 ? (
        <div className="border-2 border-dashed border-slate-100 rounded-xl py-8 text-center">
          <p className="text-xs text-slate-300">Sin OTs</p>
        </div>
      ) : (
        ots.map(o => <OTCard key={o.id} orden={o} onSelect={onSelect} seleccionada={seleccionadaId === o.id} />)
      )}
    </div>
  );
}

/* ─── Tarjeta OT ─── */
function OTCard({ orden, onSelect, seleccionada }) {
  const est = ESTADO[orden.estado] || ESTADO.pendiente;
  const Icon = est.icon;
  return (
    <div onClick={() => onSelect(orden)}
      className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5
        ${seleccionada ? "border-indigo-300 ring-2 ring-indigo-200" : "border-slate-100"}`}>
      <div className="flex items-start justify-between mb-2">
        <Badge color={est.color} size="xs">{est.label}</Badge>
        {orden.hora_inicio && (
          <span className="text-xs text-slate-400 font-medium">{orden.hora_inicio.slice(0,5)}</span>
        )}
      </div>
      <p className="text-sm font-semibold text-slate-800 leading-tight mb-1">{orden.tipo_servicio}</p>
      {orden.clientes && (
        <p className="text-xs text-slate-500 mb-1">{orden.clientes.razon_social}</p>
      )}
      {orden.sedes && (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{orden.sedes.nombre} — {orden.sedes.direccion}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Slide-over detalle OT ─── */
function SlideOverOT({ orden, tecnicos, onClose, onActualizada, onCancelada }) {
  const [editando, setEditando] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({});
  const abierto = !!orden;

  useEffect(() => {
    if (!orden) { setEditando(false); return; }
    const ids = orden.tecnicos_ids?.length ? orden.tecnicos_ids : (orden.tecnico_id ? [orden.tecnico_id] : []);
    setForm({ tecnicos_ids: ids, observaciones: orden.observaciones || "" });
    setEditando(false);
  }, [orden?.id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function avanzarEstado(nuevoEstado) {
    setSaving(true);
    try {
      const updated = await api.patch(`/ordenes/${orden.id}/estado`, { estado: nuevoEstado });
      onActualizada(updated);
    } finally { setSaving(false); }
  }

  function toggleTecnico(id) {
    setForm(f => {
      const ids = f.tecnicos_ids.includes(id)
        ? f.tecnicos_ids.filter(x => x !== id)
        : [...f.tecnicos_ids, id];
      return { ...f, tecnicos_ids: ids };
    });
  }

  async function guardar() {
    setSaving(true);
    try {
      const updated = await api.patch(`/ordenes/${orden.id}`, { tecnicos_ids: form.tecnicos_ids, observaciones: form.observaciones });
      onActualizada(updated);
      setEditando(false);
    } finally { setSaving(false); }
  }

  async function cancelar() {
    if (!confirm("¿Cancelar esta orden?")) return;
    await api.delete(`/ordenes/${orden.id}`);
    onCancelada();
  }

  const est = orden ? (ESTADO[orden.estado] || ESTADO.pendiente) : ESTADO.pendiente;
  const transiciones = orden ? (TRANSICIONES[orden.estado] || []) : [];

  return (
    <>
      <div onClick={onClose}
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        style={{ opacity: abierto ? 1 : 0, pointerEvents: abierto ? "auto" : "none" }} />

      <div className="fixed top-0 right-0 h-full w-[440px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: abierto ? "translateX(0)" : "translateX(100%)" }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge color={est.color}>{est.label}</Badge>
            </div>
            <p className="font-bold text-slate-900">{orden?.tipo_servicio}</p>
            <p className="text-sm text-slate-400 mt-0.5">{orden?.clientes?.razon_social}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {orden && (
            <>
              {/* Acciones de estado */}
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

              {/* Info sede */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ubicación</p>
                <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                  <p className="text-sm font-medium text-slate-700">{orden.sedes?.nombre}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />{orden.sedes?.direccion}
                  </div>
                </div>
              </div>

              {/* Técnicos asignados */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Técnicos</p>
                {editando ? (
                  <div className="space-y-1.5">
                    {tecnicos.map(t => (
                      <label key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                        <input type="checkbox"
                          checked={form.tecnicos_ids.includes(t.id)}
                          onChange={() => toggleTecnico(t.id)}
                          className="accent-indigo-500" />
                        <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {t.nombre.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-700">{t.nombre}</span>
                      </label>
                    ))}
                  </div>
                ) : (() => {
                  const ids = orden.tecnicos_ids?.length ? orden.tecnicos_ids : (orden.tecnico_id ? [orden.tecnico_id] : []);
                  const asignados = tecnicos.filter(t => ids.includes(t.id));
                  return asignados.length > 0 ? (
                    <div className="space-y-2">
                      {asignados.map(t => (
                        <div key={t.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {t.nombre.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                          </div>
                          <p className="text-sm font-medium text-slate-700">{t.nombre}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-300 italic">Sin asignar</p>;
                })()}
              </div>

              {/* Horario */}
              {orden.hora_inicio && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Horario</p>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Clock className="w-4 h-4 text-slate-400" />{orden.hora_inicio.slice(0,5)}
                  </div>
                </div>
              )}

              {/* Descripción */}
              {orden.descripcion && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descripción</p>
                  <p className="text-sm text-slate-600">{orden.descripcion}</p>
                </div>
              )}

              {/* Observaciones */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Observaciones</p>
                {editando ? (
                  <textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)}
                    rows={3} placeholder="Notas internas..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
                ) : (
                  <p className="text-sm text-slate-600">{orden.observaciones || <span className="text-slate-300 italic">Sin observaciones</span>}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {orden && orden.estado !== "realizada" && orden.estado !== "cancelada" && (
          <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
            {!editando ? (
              <>
                <button onClick={() => setEditando(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                <button onClick={cancelar}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-sm text-red-500 hover:bg-red-50 transition">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditando(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                  Cancelar
                </button>
                <button onClick={guardar} disabled={saving}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
                  style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Modal nueva OT ─── */
function ModalNuevaOT({ tecnicos, onClose, onCreada }) {
  const [clientes,      setClientes]      = useState([]);
  const [sedes,         setSedes]         = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [form, setForm] = useState({
    cliente_id: "", sede_id: "", tecnicos_ids: [], tipo_servicio: "",
    descripcion: "", fecha_programada: new Date().toISOString().split("T")[0], hora_inicio: "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([api.get("/clientes/"), api.get("/configuracion/")]).then(([c, cfg]) => {
      setClientes(c);
      setTiposServicio(cfg.tipos_servicio || []);
    });
  }, []);

  useEffect(() => {
    if (!form.cliente_id) { setSedes([]); return; }
    api.get(`/clientes/${form.cliente_id}/sedes`).then(setSedes);
    set("sede_id", "");
  }, [form.cliente_id]);

  function toggleTecnico(id) {
    set("tecnicos_ids", form.tecnicos_ids.includes(id)
      ? form.tecnicos_ids.filter(x => x !== id)
      : [...form.tecnicos_ids, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post("/ordenes/", {
        ...form,
        hora_inicio: form.hora_inicio || undefined,
      });
      onCreada(); onClose();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-bold text-slate-900">Nueva orden de trabajo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Cliente *</label>
            <select required value={form.cliente_id} onChange={e => set("cliente_id", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Sede</label>
            <select value={form.sede_id} onChange={e => set("sede_id", e.target.value)}
              disabled={!form.cliente_id}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-400">
              <option value="">{sedes.length === 0 && form.cliente_id ? "Sin sedes cargadas" : "Sin sede específica"}</option>
              {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre} — {s.direccion}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo de servicio *</label>
            {tiposServicio.length > 0 ? (
              <select required value={form.tipo_servicio} onChange={e => set("tipo_servicio", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">Seleccionar tipo de servicio...</option>
                {tiposServicio.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <input required value={form.tipo_servicio} onChange={e => set("tipo_servicio", e.target.value)}
                placeholder="ej: Limpieza industrial, Control de plagas..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha *</label>
              <input required type="date" value={form.fecha_programada} onChange={e => set("fecha_programada", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Hora</label>
              <input type="time" value={form.hora_inicio} onChange={e => set("hora_inicio", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Técnicos asignados <span className="text-slate-400">(opcional — puede quedar pendiente)</span>
            </label>
            <div className="space-y-1.5">
              {tecnicos.map(t => (
                <label key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input type="checkbox"
                    checked={form.tecnicos_ids.includes(t.id)}
                    onChange={() => toggleTecnico(t.id)}
                    className="accent-indigo-500" />
                  <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {t.nombre.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-700">{t.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
              rows={2} placeholder="Detalles del servicio..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
              style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
              {saving ? "Creando..." : "Crear OT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
