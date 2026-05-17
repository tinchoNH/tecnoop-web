"use client";
import { useState, useEffect } from "react";
import { Card, Badge } from "@tremor/react";
import {
  Building2, Plus, Search, Phone, Mail, MapPin, User,
  Pencil, Trash2, X, ChevronRight, Home, PlusCircle,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ClientesPage() {
  const [clientes,     setClientes]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [busqueda,     setBusqueda]     = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [showModal,    setShowModal]    = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try { setClientes(await api.get("/clientes/")); }
    finally { setLoading(false); }
  }

  const filtrados = clientes.filter(c =>
    c.razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.localidad?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.cuit?.includes(busqueda)
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clientes.length} clientes activos</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition"
          style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, localidad o CUIT..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 transition text-slate-700" />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <Card className="text-center py-16">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {busqueda ? "Sin resultados para tu búsqueda" : "Todavía no hay clientes cargados"}
          </p>
          {!busqueda && (
            <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-indigo-600 hover:underline font-medium">
              + Agregar el primero
            </button>
          )}
        </Card>
      ) : (() => {
        const ClienteCard = (c) => (
          <Card key={c.id}
            className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${seleccionado?.id === c.id ? "ring-2 ring-indigo-400" : ""}`}
            onClick={() => setSeleccionado(c)}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{c.razon_social}</p>
                {c.cuit && <p className="text-xs text-slate-400 mt-0.5">CUIT {c.cuit}</p>}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
            </div>
            <div className="space-y-1.5">
              {c.responsable && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{c.responsable}</span>
                </div>
              )}
              {c.celular && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5 shrink-0" />{c.celular}
                </div>
              )}
              {(c.localidad || c.direccion) && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{[c.localidad, c.direccion].filter(Boolean).join(" — ")}</span>
                </div>
              )}
            </div>
          </Card>
        );

        // Agrupar por localidad
        const grupos = {};
        filtrados.forEach(c => {
          const loc = c.localidad?.trim() || "Sin localidad";
          if (!grupos[loc]) grupos[loc] = [];
          grupos[loc].push(c);
        });
        const localidades = Object.keys(grupos).sort((a, b) => {
          if (a === "Sin localidad") return 1;
          if (b === "Sin localidad") return -1;
          return a.localeCompare(b, "es");
        });

        return (
          <div className="space-y-8">
            {localidades.map(loc => (
              <div key={loc}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-600">{loc}</span>
                    <span className="text-xs text-slate-400 font-normal">· {grupos[loc].length} {grupos[loc].length === 1 ? "cliente" : "clientes"}</span>
                  </div>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {grupos[loc].map(ClienteCard)}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      <SlideOver
        cliente={seleccionado}
        onClose={() => setSeleccionado(null)}
        onActualizado={async (c) => { await cargar(); setSeleccionado(c); }}
        onEliminado={() => { cargar(); setSeleccionado(null); }}
      />

      {showModal && <ModalNuevoCliente onClose={() => setShowModal(false)} onCreado={cargar} />}
    </div>
  );
}

/* ─── Slide-over ─── */
function SlideOver({ cliente, onClose, onActualizado, onEliminado }) {
  const [tab,       setTab]       = useState("info");   // "info" | "sedes"
  const [editando,  setEditando]  = useState(false);
  const [form,      setForm]      = useState({});
  const [saving,    setSaving]    = useState(false);
  const [sedes,     setSedes]     = useState([]);
  const [loadSedes, setLoadSedes] = useState(false);
  const [showSede,  setShowSede]  = useState(false);

  useEffect(() => {
    if (!cliente) { setEditando(false); setTab("info"); return; }
    setForm({
      razon_social: cliente.razon_social,
      cuit:         cliente.cuit        || "",
      responsable:  cliente.responsable || "",
      celular:      cliente.celular     || "",
      email:        cliente.email       || "",
      direccion:    cliente.direccion   || "",
      localidad:    cliente.localidad   || "",
    });
    setEditando(false);
    setTab("info");
    cargarSedes(cliente.id);
  }, [cliente?.id]);

  async function cargarSedes(id) {
    setLoadSedes(true);
    try { setSedes(await api.get(`/clientes/${id}/sedes`)); }
    finally { setLoadSedes(false); }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function guardar() {
    setSaving(true);
    try {
      const updated = await api.patch(`/clientes/${cliente.id}`, form);
      onActualizado(updated);
      setEditando(false);
    } finally { setSaving(false); }
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar a ${cliente.razon_social}?`)) return;
    await api.delete(`/clientes/${cliente.id}`);
    onEliminado();
  }

  const abierto = !!cliente;

  return (
    <>
      <div onClick={onClose}
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        style={{ opacity: abierto ? 1 : 0, pointerEvents: abierto ? "auto" : "none" }} />

      <div className="fixed top-0 right-0 h-full w-[460px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: abierto ? "translateX(0)" : "translateX(100%)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-tight">{cliente?.razon_social}</p>
              {cliente?.cuit && <p className="text-xs text-slate-400 mt-0.5">CUIT {cliente.cuit}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {[["info", "Información"], ["sedes", `Sedes${sedes.length ? ` (${sedes.length})` : ""}`]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${tab === key ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "info" && cliente && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Datos generales</p>
                <div className="space-y-3">
                  {[
                    { icon: User,   label: "Responsable", key: "responsable", type: "text"  },
                    { icon: Phone,  label: "Celular",      key: "celular",     type: "text"  },
                    { icon: Mail,   label: "Email",        key: "email",       type: "email" },
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
                          <p className="text-sm text-slate-700">{cliente[key] || <span className="text-slate-300 italic text-xs">Sin datos</span>}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Dirección</p>
                <div className="space-y-3">
                  {[
                    { icon: MapPin, label: "Dirección", key: "direccion", type: "text" },
                    { icon: MapPin, label: "Localidad",  key: "localidad", type: "text" },
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
                          <p className="text-sm text-slate-700">{cliente[key] || <span className="text-slate-300 italic text-xs">Sin datos</span>}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {editando && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Fiscal</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 font-medium">CUIT</p>
                      <input value={form.cuit} onChange={e => set("cuit", e.target.value)}
                        className="w-full text-sm text-slate-700 border-b border-slate-200 focus:outline-none focus:border-indigo-400 bg-transparent mt-0.5" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "sedes" && (
            <div className="space-y-3">
              <button onClick={() => setShowSede(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition">
                <PlusCircle className="w-4 h-4" /> Nueva sede
              </button>

              {loadSedes ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
              ) : sedes.length === 0 ? (
                <div className="text-center py-10">
                  <Home className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Sin sedes registradas</p>
                </div>
              ) : (
                sedes.map(s => (
                  <SedeCard key={s.id} sede={s}
                    onActualizada={() => cargarSedes(cliente.id)}
                    onEliminada={() => cargarSedes(cliente.id)} />
                ))
              )}

              {showSede && (
                <ModalNuevaSede
                  clienteId={cliente.id}
                  onClose={() => setShowSede(false)}
                  onCreada={() => { setShowSede(false); cargarSedes(cliente.id); }} />
              )}
            </div>
          )}
        </div>

        {/* Footer — solo en tab info */}
        {tab === "info" && (
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
        )}
      </div>
    </>
  );
}

/* ─── Sede card inline ─── */
function SedeCard({ sede, onActualizada, onEliminada }) {
  const [editando, setEditando] = useState(false);
  const [form,     setForm]     = useState({
    nombre:        sede.nombre,
    direccion:     sede.direccion,
    contacto_sede: sede.contacto_sede || "",
    celular_sede:  sede.celular_sede  || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function guardar() {
    setSaving(true);
    try {
      await api.patch(`/clientes/sedes/${sede.id}`, form);
      onActualizada();
      setEditando(false);
    } finally { setSaving(false); }
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar la sede "${sede.nombre}"?`)) return;
    await api.delete(`/clientes/sedes/${sede.id}`);
    onEliminada();
  }

  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Home className="w-4 h-4 text-slate-400 shrink-0" />
          {editando ? (
            <input value={form.nombre} onChange={e => set("nombre", e.target.value)}
              className="flex-1 text-sm font-semibold text-slate-800 border-b border-slate-200 focus:outline-none focus:border-indigo-400 bg-transparent" />
          ) : (
            <p className="text-sm font-semibold text-slate-800 truncate">{sede.nombre}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {!editando ? (
            <>
              <button onClick={() => setEditando(true)} className="p-1 rounded hover:bg-slate-100 text-slate-400 transition">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={eliminar} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditando(false)} className="text-xs text-slate-400 hover:text-slate-600 px-2">Cancelar</button>
              <button onClick={guardar} disabled={saving}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 px-2">
                {saving ? "..." : "Guardar"}
              </button>
            </>
          )}
        </div>
      </div>
      {editando ? (
        <div className="space-y-2 pl-6">
          <input value={form.direccion} onChange={e => set("direccion", e.target.value)}
            placeholder="Dirección"
            className="w-full text-sm text-slate-600 border-b border-slate-200 focus:outline-none focus:border-indigo-400 bg-transparent" />
          <input value={form.contacto_sede} onChange={e => set("contacto_sede", e.target.value)}
            placeholder="Contacto en sede"
            className="w-full text-sm text-slate-600 border-b border-slate-200 focus:outline-none focus:border-indigo-400 bg-transparent" />
          <input value={form.celular_sede} onChange={e => set("celular_sede", e.target.value)}
            placeholder="Celular sede"
            className="w-full text-sm text-slate-600 border-b border-slate-200 focus:outline-none focus:border-indigo-400 bg-transparent" />
        </div>
      ) : (
        <div className="pl-6 space-y-1">
          <p className="text-xs text-slate-500">{sede.direccion}</p>
          {sede.contacto_sede && <p className="text-xs text-slate-400">{sede.contacto_sede}{sede.celular_sede ? ` · ${sede.celular_sede}` : ""}</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Modal nuevo cliente ─── */
function ModalNuevoCliente({ onClose, onCreado }) {
  const [form, setForm] = useState({
    razon_social: "", cuit: "", responsable: "", celular: "", email: "", direccion: "", localidad: "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post("/clientes/", form);
      onCreado(); onClose();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Nuevo cliente</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Razón social *</label>
              <input required value={form.razon_social} onChange={e => set("razon_social", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">CUIT</label>
              <input value={form.cuit} onChange={e => set("cuit", e.target.value)}
                placeholder="20-12345678-9"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Responsable</label>
              <input value={form.responsable} onChange={e => set("responsable", e.target.value)}
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
              <label className="text-xs font-medium text-slate-600 mb-1 block">Dirección</label>
              <input value={form.direccion} onChange={e => set("direccion", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Localidad</label>
              <input value={form.localidad} onChange={e => set("localidad", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
              style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
              {saving ? "Guardando..." : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Modal nueva sede ─── */
function ModalNuevaSede({ clienteId, onClose, onCreada }) {
  const [form, setForm] = useState({ nombre: "", direccion: "", contacto_sede: "", celular_sede: "" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post(`/clientes/${clienteId}/sedes`, form);
      onCreada();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Nueva sede</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre de la sede *</label>
            <input required value={form.nombre} onChange={e => set("nombre", e.target.value)}
              placeholder="ej: Casa central, Planta Norte"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Dirección *</label>
            <input required value={form.direccion} onChange={e => set("direccion", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Contacto en sede</label>
              <input value={form.contacto_sede} onChange={e => set("contacto_sede", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Celular sede</label>
              <input value={form.celular_sede} onChange={e => set("celular_sede", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
              style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
              {saving ? "Guardando..." : "Crear sede"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
