"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Badge } from "@tremor/react";
import { ArrowLeft, Phone, Mail, Car, MapPin, Wrench, Clock, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

const colorEstado = {
  disponible:  { color: "emerald", label: "Disponible"  },
  en_servicio: { color: "blue",    label: "En servicio" },
  ausente:     { color: "red",     label: "Ausente"     },
};

const ESTADOS = ["disponible", "en_servicio", "ausente"];

export default function TecnicoDetallePage() {
  const { id } = useParams();
  const router  = useRouter();
  const [tecnico,  setTecnico]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editando, setEditando] = useState(false);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { cargar(); }, [id]);

  async function cargar() {
    try {
      const data = await api.get(`/tecnicos/${id}`);
      setTecnico(data);
      setForm({
        nombre:         data.nombre,
        celular:        data.celular || "",
        email:          data.email   || "",
        vehiculo:       data.vehiculo || "",
        zonas:          (data.zonas || []).join(", "),
        especialidades: (data.especialidades || []).join(", "),
        horas_base:     data.horas_base || 8,
        estado:         data.estado || "disponible",
      });
    } finally { setLoading(false); }
  }

  async function guardar() {
    setSaving(true);
    try {
      await api.patch(`/tecnicos/${id}`, {
        ...form,
        zonas:         form.zonas.split(",").map(s => s.trim()).filter(Boolean),
        especialidades: form.especialidades.split(",").map(s => s.trim()).filter(Boolean),
        horas_base:    Number(form.horas_base),
      });
      await cargar();
      setEditando(false);
    } finally { setSaving(false); }
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar a ${tecnico.nombre}? Esta acción no se puede deshacer.`)) return;
    await api.delete(`/tecnicos/${id}`);
    router.push("/dashboard/tecnicos");
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (loading) return <div className="p-6"><div className="h-64 bg-slate-100 rounded-2xl animate-pulse" /></div>;
  if (!tecnico) return <div className="p-6 text-slate-500">Técnico no encontrado.</div>;

  const est = colorEstado[tecnico.estado] || colorEstado.disponible;

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/dashboard/tecnicos")}
          className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{tecnico.nombre}</h1>
          <p className="text-sm text-slate-400 mt-0.5">Ficha del técnico</p>
        </div>
        <div className="flex gap-2">
          {!editando && (
            <>
              <button onClick={() => setEditando(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              <button onClick={eliminar}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-sm text-red-500 hover:bg-red-50 transition">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </>
          )}
          {editando && (
            <>
              <button onClick={() => setEditando(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button onClick={guardar} disabled={saving}
                className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
                style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Card principal */}
      <Card>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shrink-0">
            {tecnico.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            {editando ? (
              <input value={form.nombre} onChange={e => set("nombre", e.target.value)}
                className="text-lg font-bold text-slate-900 border-b border-indigo-300 focus:outline-none w-full bg-transparent" />
            ) : (
              <h2 className="text-lg font-bold text-slate-900">{tecnico.nombre}</h2>
            )}
            <div className="flex items-center gap-2 mt-1">
              {editando ? (
                <select value={form.estado} onChange={e => set("estado", e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-400">
                  {ESTADOS.map(s => <option key={s} value={s}>{colorEstado[s]?.label}</option>)}
                </select>
              ) : (
                <Badge color={est.color}>{est.label}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {[
            { icon: Phone,  label: "Celular",   key: "celular",   type: "text"   },
            { icon: Mail,   label: "Email",     key: "email",     type: "email"  },
            { icon: Car,    label: "Vehículo",  key: "vehiculo",  type: "text"   },
            { icon: Clock,  label: "Hs. base",  key: "horas_base",type: "number" },
          ].map(({ icon: Icon, label, key, type }) => (
            <div key={key} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
                {editando ? (
                  <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                    className="w-full text-sm text-slate-700 border-b border-slate-200 focus:outline-none focus:border-indigo-400 bg-transparent py-0.5" />
                ) : (
                  <p className="text-sm text-slate-700">{tecnico[key] || <span className="text-slate-300 italic">Sin datos</span>}</p>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-start gap-3 col-span-2">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400 font-medium mb-0.5">Zonas</p>
              {editando ? (
                <input value={form.zonas} onChange={e => set("zonas", e.target.value)}
                  placeholder="ej: CABA, GBA Norte"
                  className="w-full text-sm text-slate-700 border-b border-slate-200 focus:outline-none focus:border-indigo-400 bg-transparent py-0.5" />
              ) : tecnico.zonas?.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {tecnico.zonas.map(z => (
                    <span key={z} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{z}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-300 italic">Sin zonas asignadas</p>}
            </div>
          </div>

          <div className="flex items-start gap-3 col-span-2">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
              <Wrench className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400 font-medium mb-0.5">Especialidades</p>
              {editando ? (
                <input value={form.especialidades} onChange={e => set("especialidades", e.target.value)}
                  placeholder="ej: Limpieza industrial, Control de plagas"
                  className="w-full text-sm text-slate-700 border-b border-slate-200 focus:outline-none focus:border-indigo-400 bg-transparent py-0.5" />
              ) : tecnico.especialidades?.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {tecnico.especialidades.map(e => (
                    <span key={e} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{e}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-300 italic">Sin especialidades</p>}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
