"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, MapPin, Clock, User, FileText, CheckCircle, Play, RotateCcw } from "lucide-react";

const ESTADO_CONFIG = {
  pendiente: { label: "Pendiente", color: "bg-slate-100 text-slate-600" },
  asignada:  { label: "Asignada",  color: "bg-blue-100 text-blue-700"   },
  en_curso:  { label: "En curso",  color: "bg-amber-100 text-amber-700" },
  realizada: { label: "Realizada", color: "bg-emerald-100 text-emerald-700" },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-600"     },
};

export default function OTDetalle() {
  const { id } = useParams();
  const router  = useRouter();
  const [ot,       setOt]       = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [step,     setStep]     = useState("detalle"); // detalle | cierre
  const [saving,   setSaving]   = useState(false);
  const [obs,      setObs]      = useState("");
  const [firmada,  setFirmada]  = useState(false);
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });

  useEffect(() => { cargar(); }, [id]);

  async function cargar() {
    setLoading(true);
    try { setOt(await api.get(`/ordenes/${id}`)); }
    finally { setLoading(false); }
  }

  async function iniciar() {
    setSaving(true);
    try {
      const updated = await api.patch(`/ordenes/${id}/estado`, { estado: "en_curso" });
      setOt(updated);
    } finally { setSaving(false); }
  }

  async function cerrar() {
    const canvas = canvasRef.current;
    if (!firmada) { alert("Por favor firmá antes de cerrar la OT"); return; }
    setSaving(true);
    try {
      const firma_url = canvas.toDataURL("image/png");
      await api.patch(`/ordenes/${id}/estado`, { estado: "realizada" });
      await api.patch(`/ordenes/${id}`, { observaciones: obs, firma_url });
      router.push("/tecnico");
    } finally { setSaving(false); }
  }

  // Canvas firma
  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.stroke();
    lastPos.current = pos;
    setFirmada(true);
  }

  function stopDraw() { drawing.current = false; }

  function limpiarFirma() {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setFirmada(false);
  }

  if (loading) return (
    <div className="p-4 space-y-3">
      <div className="h-6 bg-slate-200 rounded w-32 animate-pulse" />
      <div className="bg-white rounded-2xl p-4 space-y-3 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-48" />
        <div className="h-3 bg-slate-100 rounded w-64" />
        <div className="h-3 bg-slate-100 rounded w-40" />
      </div>
    </div>
  );

  if (!ot) return (
    <div className="p-4">
      <p className="text-slate-500 text-sm">Orden no encontrada</p>
    </div>
  );

  const cfg = ESTADO_CONFIG[ot.estado] || ESTADO_CONFIG.pendiente;

  return (
    <div className="p-4 space-y-4">
      {/* Nav */}
      <button onClick={() => router.push("/tecnico")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition -ml-1">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      {step === "detalle" && (
        <>
          {/* Cabecera */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-slate-900">{ot.clientes?.razon_social}</p>
                <p className="text-sm text-slate-500 mt-0.5">{ot.tipo_servicio}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
            </div>

            <div className="space-y-2.5 border-t border-slate-50 pt-3">
              <Row icon={MapPin} text={`${ot.sedes?.nombre} — ${ot.sedes?.direccion}`} />
              {ot.hora_inicio && <Row icon={Clock} text={`Hora programada: ${ot.hora_inicio?.slice(0,5)}`} />}
              {ot.tecnicos && <Row icon={User} text={ot.tecnicos.nombre} />}
            </div>
          </div>

          {/* Descripción */}
          {ot.descripcion && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descripción</p>
              <p className="text-sm text-slate-700 leading-relaxed">{ot.descripcion}</p>
            </div>
          )}

          {/* Observaciones si ya está cerrada */}
          {ot.estado === "realizada" && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">OT completada</p>
              </div>
              {ot.observaciones && <p className="text-sm text-emerald-600">{ot.observaciones}</p>}
              {ot.firma_url && (
                <div className="mt-3">
                  <p className="text-xs text-emerald-500 mb-1">Firma del cliente</p>
                  <img src={ot.firma_url} alt="firma" className="border border-emerald-200 rounded-xl max-h-24 bg-white" />
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="space-y-2">
            {ot.estado === "asignada" && (
              <button onClick={iniciar} disabled={saving}
                className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-[0.98]"
                style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
                <Play className="w-4 h-4" />
                {saving ? "Iniciando..." : "Iniciar OT"}
              </button>
            )}
            {ot.estado === "en_curso" && (
              <button onClick={() => setStep("cierre")}
                className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
                style={{background:"linear-gradient(135deg,#10b981,#059669)"}}>
                <CheckCircle className="w-4 h-4" />
                Cerrar OT
              </button>
            )}
          </div>
        </>
      )}

      {step === "cierre" && (
        <>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-semibold text-slate-900 mb-1">{ot.clientes?.razon_social}</p>
            <p className="text-sm text-slate-500">{ot.tipo_servicio}</p>
          </div>

          {/* Observaciones */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Observaciones
            </label>
            <textarea
              value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Detallá el trabajo realizado, materiales usados, novedades..."
              rows={4}
              className="w-full text-sm text-slate-700 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          {/* Firma */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Firma del cliente
              </label>
              <button onClick={limpiarFirma}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition">
                <RotateCcw className="w-3 h-3" /> Limpiar
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <canvas
                ref={canvasRef}
                width={340} height={160}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            {!firmada && (
              <p className="text-xs text-slate-400 text-center mt-2">Pedile al cliente que firme acá arriba</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button onClick={() => setStep("detalle")}
              className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
              Cancelar
            </button>
            <button onClick={cerrar} disabled={saving || !firmada}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-white text-sm disabled:opacity-50 transition active:scale-[0.98]"
              style={{background:"linear-gradient(135deg,#10b981,#059669)"}}>
              {saving ? "Guardando..." : "Confirmar cierre"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ icon: Icon, text }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-slate-600">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
