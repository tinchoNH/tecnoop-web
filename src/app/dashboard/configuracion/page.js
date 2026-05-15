"use client";
import { useState, useEffect } from "react";
import { Card } from "@tremor/react";
import { Settings, Package, Plus, Trash2, Save, ToggleLeft, ToggleRight, Tag, X } from "lucide-react";
import { api } from "@/lib/api";

const TABS = [
  { key: "general",   label: "General",   icon: Settings },
  { key: "productos", label: "Productos",  icon: Package  },
];

const FEATURES = [
  { key: "usa_fotos",     label: "Fotos en OTs",          desc: "El técnico puede subir fotos al realizar un servicio" },
  { key: "usa_firma",     label: "Firma del cliente",     desc: "Se requiere firma al cerrar una OT" },
  { key: "usa_productos", label: "Productos / insumos",   desc: "Registrar qué productos se usaron en cada servicio" },
  { key: "usa_equipos",   label: "Equipos de técnicos",   desc: "Asignar múltiples técnicos a una misma OT" },
];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState("general");

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Adaptá la plataforma al flujo de trabajo de tu empresa</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "general"   && <TabGeneral />}
      {tab === "productos" && <TabProductos />}
    </div>
  );
}

/* ─── Tab General ─── */
function TabGeneral() {
  const [config,          setConfig]         = useState(null);
  const [loading,         setLoading]        = useState(true);
  const [saving,          setSaving]         = useState(false);
  const [saved,           setSaved]          = useState(false);
  const [nuevoTipo,       setNuevoTipo]      = useState("");
  const [errorTipo,       setErrorTipo]      = useState("");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try { setConfig(await api.get("/configuracion/")); }
    finally { setLoading(false); }
  }

  async function guardar() {
    setSaving(true); setSaved(false);
    try {
      await api.put("/configuracion/", config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }

  function toggleFeature(key) {
    setConfig(c => ({ ...c, [key]: !c[key] }));
  }

  function agregarTipo() {
    const t = nuevoTipo.trim();
    if (!t) return;
    if (config.tipos_servicio.map(x => x.toLowerCase()).includes(t.toLowerCase())) {
      setErrorTipo("Ya existe ese tipo de servicio");
      return;
    }
    setConfig(c => ({ ...c, tipos_servicio: [...c.tipos_servicio, t] }));
    setNuevoTipo(""); setErrorTipo("");
  }

  function quitarTipo(tipo) {
    setConfig(c => ({ ...c, tipos_servicio: c.tipos_servicio.filter(t => t !== tipo) }));
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Features */}
      <Card>
        <p className="text-sm font-semibold text-slate-700 mb-4">Funcionalidades activas</p>
        <div className="space-y-4">
          {FEATURES.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </div>
              <button onClick={() => toggleFeature(key)} className="shrink-0 transition">
                {config[key]
                  ? <ToggleRight className="w-8 h-8 text-indigo-600" />
                  : <ToggleLeft  className="w-8 h-8 text-slate-300" />
                }
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Tipos de servicio */}
      <Card>
        <p className="text-sm font-semibold text-slate-700 mb-1">Tipos de servicio</p>
        <p className="text-xs text-slate-400 mb-4">
          Definí los servicios que ofrece tu empresa. Se usarán al crear OTs y contratos.
        </p>

        {/* Input para agregar */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <input
              value={nuevoTipo}
              onChange={e => { setNuevoTipo(e.target.value); setErrorTipo(""); }}
              onKeyDown={e => e.key === "Enter" && agregarTipo()}
              placeholder="ej: Higienización de tapizados"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition"
            />
            {errorTipo && <p className="text-xs text-red-500 mt-1">{errorTipo}</p>}
          </div>
          <button onClick={agregarTipo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 text-sm text-indigo-600 hover:bg-indigo-50 transition">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {/* Lista */}
        {config.tipos_servicio.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">
            Sin tipos de servicio — se usará campo de texto libre en las OTs
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {config.tipos_servicio.map(tipo => (
              <span key={tipo}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full">
                <Tag className="w-3 h-3" />
                {tipo}
                <button onClick={() => quitarTipo(tipo)} className="hover:text-red-500 transition ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Guardar */}
      <div className="flex items-center gap-3">
        <button onClick={guardar} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
          style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        {saved && <p className="text-sm text-emerald-600 font-medium">✓ Guardado</p>}
      </div>
    </div>
  );
}

/* ─── Tab Productos ─── */
function TabProductos() {
  const [productos, setProductos] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ nombre: "", unidad: "unidad" });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const UNIDADES = ["unidad", "litro", "ml", "kg", "gramo", "metro", "m²", "dosis"];

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try { setProductos(await api.get("/configuracion/productos")); }
    finally { setLoading(false); }
  }

  async function crear(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.post("/configuracion/productos", form);
      setForm({ nombre: "", unidad: "unidad" });
      setShowForm(false);
      await cargar();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  async function eliminar(id, nombre) {
    if (!confirm(`¿Eliminar "${nombre}" del catálogo?`)) return;
    await api.delete(`/configuracion/productos/${id}`);
    await cargar();
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">Catálogo de productos e insumos</p>
            <p className="text-xs text-slate-400 mt-0.5">
              El técnico selecciona de este catálogo al registrar los insumos de una OT
            </p>
          </div>
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition"
            style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {/* Formulario inline */}
        {showForm && (
          <form onSubmit={crear} className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600 block mb-1">Nombre del producto *</label>
                <input required value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))}
                  placeholder="ej: Cloro líquido"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Unidad de medida</label>
                <select value={form.unidad} onChange={e => setForm(f => ({...f, unidad: e.target.value}))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-100 transition">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition"
                style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        )}

        {/* Lista */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Sin productos cargados</p>
            <p className="text-xs text-slate-300 mt-0.5">Agregá los insumos que usa tu empresa</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {productos.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.nombre}</p>
                    <p className="text-xs text-slate-400">por {p.unidad}</p>
                  </div>
                </div>
                <button onClick={() => eliminar(p.id, p.nombre)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
