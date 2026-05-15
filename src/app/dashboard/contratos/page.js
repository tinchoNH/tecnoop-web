"use client";
import { useState, useEffect } from "react";
import { Card, Badge } from "@tremor/react";
import { FileText, Plus, Search, X, Pencil, Trash2, RefreshCw, Calendar, User, Building2, MapPin } from "lucide-react";
import { api } from "@/lib/api";

const FRECUENCIAS = [
  { value: "diaria",    label: "Diaria"     },
  { value: "semanal",   label: "Semanal"    },
  { value: "quincenal", label: "Quincenal"  },
  { value: "mensual",   label: "Mensual"    },
  { value: "anual",     label: "Anual"      },
];

const DIAS_SEMANA = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

const colorFrecuencia = {
  diaria:    "red",
  semanal:   "blue",
  quincenal: "violet",
  mensual:   "indigo",
  anual:     "emerald",
};

function formatFecha(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function ContratosPage() {
  const [contratos,    setContratos]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [busqueda,     setBusqueda]     = useState("");
  const [showModal,    setShowModal]    = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [soloActivos,  setSoloActivos]  = useState(true);

  useEffect(() => { cargar(); }, [soloActivos]);

  async function cargar() {
    setLoading(true);
    try { setContratos(await api.get("/contratos/", { activo: soloActivos })); }
    finally { setLoading(false); }
  }

  const filtrados = contratos.filter(c => {
    const q = busqueda.toLowerCase();
    return (
      c.clientes?.razon_social?.toLowerCase().includes(q) ||
      c.sedes?.nombre?.toLowerCase().includes(q) ||
      c.tipo_servicio?.toLowerCase().includes(q) ||
      c.tecnicos?.nombre?.toLowerCase().includes(q)
    );
  });

  async function generarOT(contrato) {
    if (!confirm(`¿Generar OT para el ${formatFecha(contrato.prox_ot)}?`)) return;
    try {
      await api.post(`/contratos/${contrato.id}/generar-ot`);
      await cargar();
      alert("OT generada correctamente");
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Contratos recurrentes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtrados.length} contrato{filtrados.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition"
          style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
          <Plus className="w-4 h-4" /> Nuevo contrato
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, sede o servicio..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 transition text-slate-700" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={soloActivos} onChange={e => setSoloActivos(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600" />
          Solo activos
        </label>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <Card className="text-center py-16">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {busqueda ? "Sin resultados para tu búsqueda" : "No hay contratos cargados"}
          </p>
          {!busqueda && (
            <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-indigo-600 hover:underline font-medium">
              + Agregar el primero
            </button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtrados.map(c => (
            <Card key={c.id}
              className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${!c.activo ? "opacity-60" : ""} ${seleccionado?.id === c.id ? "ring-2 ring-indigo-400" : ""}`}
              onClick={() => setSeleccionado(c)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm leading-tight line-clamp-1">{c.clientes?.razon_social || "—"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.tipo_servicio}</p>
                  </div>
                </div>
                <Badge color={c.activo ? colorFrecuencia[c.frecuencia] : "gray"} size="xs">
                  {FRECUENCIAS.find(f => f.value === c.frecuencia)?.label || c.frecuencia}
                </Badge>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="line-clamp-1">{c.sedes?.nombre} — {c.sedes?.direccion}</span>
                </div>
                {c.tecnicos && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    {c.tecnicos.nombre}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  Próxima OT: <span className="font-medium text-slate-700">{formatFecha(c.prox_ot)}</span>
                </div>
              </div>

              {!c.activo && (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inactivo</span>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Slide-over */}
      <SlideOver
        contrato={seleccionado}
        onClose={() => setSeleccionado(null)}
        onActualizado={async () => { await cargar(); setSeleccionado(null); }}
        onGenerarOT={generarOT}
      />

      {showModal && <ModalNuevoContrato onClose={() => setShowModal(false)} onCreado={cargar} />}
    </div>
  );
}

/* ─── Slide-over ─── */
function SlideOver({ contrato, onClose, onActualizado, onGenerarOT }) {
  const [editando, setEditando] = useState(false);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);
  const [tecnicos, setTecnicos] = useState([]);

  useEffect(() => {
    api.get("/tecnicos/").then(setTecnicos).catch(() => {});
  }, []);

  useEffect(() => {
    if (!contrato) { setEditando(false); return; }
    setForm({
      tecnico_id: contrato.tecnico_id || "",
      fin:        contrato.fin || "",
      activo:     contrato.activo,
    });
    setEditando(false);
  }, [contrato?.id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function guardar() {
    setSaving(true);
    try {
      const body = { activo: form.activo };
      if (form.tecnico_id) body.tecnico_id = form.tecnico_id;
      if (form.fin)        body.fin = form.fin;
      await api.patch(`/contratos/${contrato.id}`, body);
      onActualizado();
    } finally { setSaving(false); }
  }

  async function desactivar() {
    if (!confirm("¿Desactivar este contrato?")) return;
    await api.delete(`/contratos/${contrato.id}`);
    onActualizado();
  }

  const abierto = !!contrato;

  return (
    <>
      <div onClick={onClose}
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        style={{ opacity: abierto ? 1 : 0, pointerEvents: abierto ? "auto" : "none" }} />
      <div className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: abierto ? "translateX(0)" : "translateX(100%)" }}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="font-bold text-slate-900 text-sm">{contrato?.clientes?.razon_social}</p>
            <p className="text-xs text-slate-400">{contrato?.tipo_servicio}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {contrato && (
            <>
              <Section label="Sede">
                <p className="text-sm text-slate-700">{contrato.sedes?.nombre}</p>
                <p className="text-xs text-slate-400">{contrato.sedes?.direccion}</p>
              </Section>

              <Section label="Frecuencia">
                <Badge color={colorFrecuencia[contrato.frecuencia] || "gray"}>
                  {FRECUENCIAS.find(f => f.value === contrato.frecuencia)?.label}
                </Badge>
                {contrato.frecuencia === "semanal" && contrato.dia_semana != null && (
                  <p className="text-xs text-slate-500 mt-1">Día: {DIAS_SEMANA[contrato.dia_semana]}</p>
                )}
                {contrato.frecuencia === "mensual" && contrato.dia_mes && (
                  <p className="text-xs text-slate-500 mt-1">Día del mes: {contrato.dia_mes}</p>
                )}
              </Section>

              <Section label="Próxima OT">
                <p className="text-sm font-semibold text-indigo-600">{formatFecha(contrato.prox_ot)}</p>
              </Section>

              <Section label="Vigencia">
                <p className="text-sm text-slate-700">
                  {formatFecha(contrato.inicio)} → {contrato.fin ? formatFecha(contrato.fin) : "Sin fecha de fin"}
                </p>
                {editando && (
                  <div className="mt-2">
                    <label className="text-xs text-slate-400 block mb-1">Fecha de fin</label>
                    <input type="date" value={form.fin} onChange={e => set("fin", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                  </div>
                )}
              </Section>

              <Section label="Técnico asignado">
                {editando ? (
                  <select value={form.tecnico_id} onChange={e => set("tecnico_id", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                    <option value="">Sin técnico</option>
                    {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                ) : (
                  <p className="text-sm text-slate-700">{contrato.tecnicos?.nombre || <span className="text-slate-400 italic text-xs">Sin asignar</span>}</p>
                )}
              </Section>

              <Section label="Estado">
                {editando ? (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.activo} onChange={e => set("activo", e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600" />
                    Activo
                  </label>
                ) : (
                  <Badge color={contrato.activo ? "emerald" : "gray"}>{contrato.activo ? "Activo" : "Inactivo"}</Badge>
                )}
              </Section>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          {!editando ? (
            <>
              <button onClick={() => onGenerarOT(contrato)} disabled={!contrato?.activo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 text-sm text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-40">
                <RefreshCw className="w-3.5 h-3.5" /> Generar OT
              </button>
              <button onClick={() => setEditando(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              {contrato?.activo && (
                <button onClick={desactivar}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-sm text-red-500 hover:bg-red-50 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
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

function Section({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}

/* ─── Modal nuevo contrato ─── */
function ModalNuevoContrato({ onClose, onCreado }) {
  const [clientes,      setClientes]      = useState([]);
  const [sedes,         setSedes]         = useState([]);
  const [tecnicos,      setTecnicos]      = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [form, setForm] = useState({
    cliente_id: "", sede_id: "", tipo_servicio: "", frecuencia: "mensual",
    dia_semana: 1, dia_mes: 1, tecnico_id: "", inicio: new Date().toISOString().split("T")[0], fin: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get("/clientes/").then(setClientes).catch(() => {});
    api.get("/tecnicos/").then(setTecnicos).catch(() => {});
    api.get("/configuracion/").then(cfg => setTiposServicio(cfg.tipos_servicio || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.cliente_id) { setSedes([]); set("sede_id", ""); return; }
    api.get(`/clientes/${form.cliente_id}/sedes`).then(setSedes).catch(() => setSedes([]));
    set("sede_id", "");
  }, [form.cliente_id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const body = {
        cliente_id:   form.cliente_id,
        sede_id:      form.sede_id,
        tipo_servicio: form.tipo_servicio,
        frecuencia:   form.frecuencia,
        inicio:       form.inicio,
      };
      if (form.tecnico_id) body.tecnico_id = form.tecnico_id;
      if (form.fin)        body.fin = form.fin;
      if (form.frecuencia === "semanal")  body.dia_semana = Number(form.dia_semana);
      if (form.frecuencia === "mensual")  body.dia_mes    = Number(form.dia_mes);
      await api.post("/contratos/", body);
      onCreado(); onClose();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-bold text-slate-900">Nuevo contrato</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

          <Field label="Cliente *">
            <select required value={form.cliente_id} onChange={e => set("cliente_id", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
              <option value="">Seleccioná un cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </Field>

          <Field label="Sede *">
            <select required value={form.sede_id} onChange={e => set("sede_id", e.target.value)}
              disabled={!form.cliente_id}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 disabled:bg-slate-50">
              <option value="">{form.cliente_id ? "Seleccioná una sede" : "Primero elegí un cliente"}</option>
              {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre} — {s.direccion}</option>)}
            </select>
          </Field>

          <Field label="Tipo de servicio *">
            {tiposServicio.length > 0 ? (
              <select required value={form.tipo_servicio} onChange={e => set("tipo_servicio", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">Seleccionar tipo de servicio...</option>
                {tiposServicio.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <input required value={form.tipo_servicio} onChange={e => set("tipo_servicio", e.target.value)}
                placeholder="ej: Limpieza industrial, Control de plagas"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            )}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Frecuencia *">
              <select required value={form.frecuencia} onChange={e => set("frecuencia", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                {FRECUENCIAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Field>

            {form.frecuencia === "semanal" && (
              <Field label="Día de la semana">
                <select value={form.dia_semana} onChange={e => set("dia_semana", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                  {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </Field>
            )}

            {form.frecuencia === "mensual" && (
              <Field label="Día del mes">
                <input type="number" min="1" max="31" value={form.dia_mes} onChange={e => set("dia_mes", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Inicio *">
              <input required type="date" value={form.inicio} onChange={e => set("inicio", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            </Field>
            <Field label="Fin (opcional)">
              <input type="date" value={form.fin} onChange={e => set("fin", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            </Field>
          </div>

          <Field label="Técnico asignado (opcional)">
            <select value={form.tecnico_id} onChange={e => set("tecnico_id", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
              <option value="">Sin técnico</option>
              {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
              style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
              {saving ? "Guardando..." : "Crear contrato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
