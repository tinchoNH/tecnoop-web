"use client";
import { useState, useEffect } from "react";
import { Card, Badge } from "@tremor/react";
import { Users, Plus, Search, Phone, Mail, Car, MapPin, Wrench, Clock, Pencil, Trash2, X, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

const colorEstado = {
  disponible:  { color: "emerald", label: "Disponible"  },
  en_servicio: { color: "blue",    label: "En servicio" },
  ausente:     { color: "red",     label: "Ausente"     },
  vacaciones:  { color: "yellow",  label: "Vacaciones"  },
  licencia:    { color: "orange",  label: "Licencia"    },
};
const ESTADOS = ["disponible", "en_servicio", "ausente", "vacaciones", "licencia"];

export default function TecnicosPage() {
  const [tecnicos,    setTecnicos]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busqueda,    setBusqueda]    = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try { setTecnicos(await api.get("/tecnicos/")); }
    finally { setLoading(false); }
  }

  const filtrados = tecnicos.filter(t =>
    t.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    t.especialidades?.some(e => e.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Técnicos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{tecnicos.length} técnicos activos</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition"
          style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
          <Plus className="w-4 h-4" /> Nuevo técnico
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o especialidad..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 transition text-slate-700" />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <Card className="text-center py-16">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {busqueda ? "Sin resultados para tu búsqueda" : "Todavía no hay técnicos cargados"}
          </p>
          {!busqueda && (
            <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-indigo-600 hover:underline font-medium">
              + Agregar el primero
            </button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtrados.map(t => {
            const est = colorEstado[t.estado] || colorEstado.disponible;
            return (
              <Card key={t.id}
                className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${seleccionado?.id === t.id ? "ring-2 ring-indigo-400" : ""}`}
                onClick={() => setSeleccionado(t)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {t.nombre.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm leading-tight">{t.nombre}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.vehiculo || "Sin vehículo"}</p>
                    </div>
                  </div>
                  <Badge color={est.color} size="xs">{est.label}</Badge>
                </div>
                <div className="space-y-1.5 mb-3">
                  {t.celular && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="w-3.5 h-3.5" />{t.celular}</div>}
                  {t.email   && <div className="flex items-center gap-2 text-xs text-slate-500"><Mail className="w-3.5 h-3.5" />{t.email}</div>}
                  {t.zonas?.length > 0 && <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="w-3.5 h-3.5" />{t.zonas.join(", ")}</div>}
                </div>
                {t.especialidades?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.especialidades.slice(0,3).map(e => (
                      <span key={e} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{e}</span>
                    ))}
                    {t.especialidades.length > 3 && <span className="text-[10px] text-slate-400">+{t.especialidades.length - 3}</span>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Slide-over */}
      <SlideOver
        tecnico={seleccionado}
        onClose={() => setSeleccionado(null)}
        onActualizado={async (t) => { await cargar(); setSeleccionado(t); }}
        onEliminado={() => { cargar(); setSeleccionado(null); }}
      />

      {showModal && <ModalNuevoTecnico onClose={() => setShowModal(false)} onCreado={cargar} />}
    </div>
  );
}

/* ─── Slide-over panel ─── */
function SlideOver({ tecnico, onClose, onActualizado, onEliminado }) {
  const [editando, setEditando] = useState(false);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!tecnico) { setEditando(false); return; }
    setForm({
      nombre:         tecnico.nombre,
      celular:        tecnico.celular || "",
      email:          tecnico.email   || "",
      vehiculo:       tecnico.vehiculo || "",
      zonas:          (tecnico.zonas || []).join(", "),
      especialidades: (tecnico.especialidades || []).join(", "),
      horas_base:     tecnico.horas_base || 8,
      estado:         tecnico.estado || "disponible",
    });
    setEditando(false);
  }, [tecnico?.id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function guardar() {
    setSaving(true);
    try {
      const updated = await api.patch(`/tecnicos/${tecnico.id}`, {
        ...form,
        zonas:          form.zonas.split(",").map(s => s.trim()).filter(Boolean),
        especialidades: form.especialidades.split(",").map(s => s.trim()).filter(Boolean),
        horas_base:     Number(form.horas_base),
      });
      onActualizado(updated);
      setEditando(false);
    } finally { setSaving(false); }
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar a ${tecnico.nombre}?`)) return;
    await api.delete(`/tecnicos/${tecnico.id}`);
    onEliminado();
  }

  const abierto = !!tecnico;
  const est = tecnico ? (colorEstado[tecnico.estado] || colorEstado.disponible) : colorEstado.disponible;

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose}
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        style={{ opacity: abierto ? 1 : 0, pointerEvents: abierto ? "auto" : "none" }} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: abierto ? "translateX(0)" : "translateX(100%)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {tecnico && (
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                {tecnico.nombre.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-slate-900 text-sm">{tecnico?.nombre}</p>
              {tecnico && <Badge color={est.color} size="xs">{est.label}</Badge>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {tecnico && (
            <>
              {/* Estado */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estado</p>
                {editando ? (
                  <select value={form.estado} onChange={e => set("estado", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                    {ESTADOS.map(s => <option key={s} value={s}>{colorEstado[s]?.label}</option>)}
                  </select>
                ) : <Badge color={est.color}>{est.label}</Badge>}
              </div>

              {/* Datos */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Datos de contacto</p>
                <div className="space-y-3">
                  {[
                    { icon: Phone, label: "Celular",    key: "celular",    type: "text"   },
                    { icon: Mail,  label: "Email",      key: "email",      type: "email"  },
                    { icon: Car,   label: "Vehículo",   key: "vehiculo",   type: "text"   },
                    { icon: Clock, label: "Horas/día",  key: "horas_base", type: "number" },
                  ].map(({ icon: Icon, label, key, type }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400 font-medium">{label}</p>
                        {editando ? (
                          <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                            className="w-full text-sm text-slate-700 border-b border-slate-200 focus:outline-none focus:border-indigo-400 bg-transparent mt-0.5" />
                        ) : (
                          <p className="text-sm text-slate-700">{tecnico[key] || <span className="text-slate-300 italic text-xs">Sin datos</span>}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zonas */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Zonas</p>
                {editando ? (
                  <input value={form.zonas} onChange={e => set("zonas", e.target.value)}
                    placeholder="ej: CABA, GBA Norte"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                ) : tecnico.zonas?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {tecnico.zonas.map(z => <span key={z} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{z}</span>)}
                  </div>
                ) : <p className="text-sm text-slate-300 italic">Sin zonas asignadas</p>}
              </div>

              {/* Especialidades */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Especialidades</p>
                {editando ? (
                  <input value={form.especialidades} onChange={e => set("especialidades", e.target.value)}
                    placeholder="ej: Limpieza industrial, Control de plagas"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                ) : tecnico.especialidades?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {tecnico.especialidades.map(e => <span key={e} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">{e}</span>)}
                  </div>
                ) : <p className="text-sm text-slate-300 italic">Sin especialidades</p>}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          {!editando ? (
            <>
              <button onClick={() => setEditando(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              <button onClick={eliminar}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-sm text-red-500 hover:bg-red-50 transition">
                <Trash2 className="w-3.5 h-3.5" />
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
      </div>
    </>
  );
}

/* ─── Modal nuevo técnico ─── */
function ModalNuevoTecnico({ onClose, onCreado }) {
  const [form, setForm] = useState({ nombre:"", celular:"", email:"", vehiculo:"", zonas:"", especialidades:"", horas_base:8 });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post("/tecnicos/", {
        ...form,
        zonas:          form.zonas.split(",").map(s => s.trim()).filter(Boolean),
        especialidades: form.especialidades.split(",").map(s => s.trim()).filter(Boolean),
        horas_base:     Number(form.horas_base),
      });
      onCreado(); onClose();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Nuevo técnico</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre completo *</label>
              <input required value={form.nombre} onChange={e => set("nombre", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Celular</label>
              <input value={form.celular} onChange={e => set("celular", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Vehículo</label>
              <input value={form.vehiculo} onChange={e => set("vehiculo", e.target.value)}
                placeholder="ej: Ford Transit ABC123"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Horas base / día</label>
              <input type="number" value={form.horas_base} onChange={e => set("horas_base", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Zonas <span className="text-slate-400">(separadas por coma)</span></label>
              <input value={form.zonas} onChange={e => set("zonas", e.target.value)}
                placeholder="ej: CABA, GBA Norte, La Plata"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Especialidades <span className="text-slate-400">(separadas por coma)</span></label>
              <input value={form.especialidades} onChange={e => set("especialidades", e.target.value)}
                placeholder="ej: Limpieza industrial, Control de plagas"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
              style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
              {saving ? "Guardando..." : "Crear técnico"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
