"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, Metric, Text, Badge, ProgressBar, BarChart } from "@tremor/react";
import { ClipboardList, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";

function hoy() { return new Date().toISOString().split("T")[0]; }
function inicioMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

const RANGOS = [
  { label: "Este mes",       desde: () => inicioMes(),                                                                hasta: () => hoy() },
  { label: "Últimos 7 días", desde: () => { const d = new Date(); d.setDate(d.getDate()-6); return d.toISOString().split("T")[0]; }, hasta: () => hoy() },
  { label: "Últimos 30 días",desde: () => { const d = new Date(); d.setDate(d.getDate()-29); return d.toISOString().split("T")[0]; }, hasta: () => hoy() },
  { label: "Personalizado",  desde: null, hasta: null },
];

export default function EstadisticasPage() {
  const [rangoIdx, setRangoIdx] = useState(0);
  const [desde,    setDesde]    = useState(inicioMes());
  const [hasta,    setHasta]    = useState(hoy());
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);

  const cargar = useCallback(async (d, h) => {
    setLoading(true);
    setData(null);
    try { setData(await api.get("/estadisticas/resumen", { desde: d, hasta: h })); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(desde, hasta); }, []);

  function aplicarRango(idx) {
    setRangoIdx(idx);
    const r = RANGOS[idx];
    if (r.desde) {
      const d = r.desde(); const h = r.hasta();
      setDesde(d); setHasta(h);
      cargar(d, h);
    }
  }

  function aplicarPersonalizado() {
    cargar(desde, hasta);
  }

  const kpis = data ? [
    { label: "Total OTs",    value: data.kpis.total,      icon: ClipboardList, color: "indigo",  sub: `del ${fmtFecha(data.periodo.desde)} al ${fmtFecha(data.periodo.hasta)}` },
    { label: "Realizadas",   value: data.kpis.realizadas, icon: CheckCircle,   color: "emerald", sub: `${data.kpis.cumplimiento}% de cumplimiento` },
    { label: "Pendientes",   value: data.kpis.pendientes, icon: Clock,         color: "amber",   sub: "en_curso + asignadas + pendientes" },
    { label: "Canceladas",   value: data.kpis.canceladas, icon: XCircle,       color: "red",     sub: `${data.kpis.total > 0 ? Math.round(data.kpis.canceladas/data.kpis.total*100) : 0}% del total` },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Estadísticas</h1>
        <p className="text-sm text-slate-500 mt-0.5">Resumen general de órdenes de trabajo</p>
      </div>

      {/* Filtros de período */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex gap-2">
            {RANGOS.map((r, i) => (
              <button key={r.label} onClick={() => aplicarRango(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${rangoIdx === i ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {r.label}
              </button>
            ))}
          </div>
          {rangoIdx === 3 && (
            <div className="flex items-end gap-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Desde</label>
                <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Hasta</label>
                <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <button onClick={aplicarPersonalizado}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition"
                style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
                Aplicar
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}><div className="animate-pulse space-y-2"><div className="h-3 bg-slate-200 rounded w-20"/><div className="h-8 bg-slate-200 rounded w-12"/><div className="h-3 bg-slate-200 rounded w-24"/></div></Card>
          ))
        ) : kpis.map(({ label, value, icon: Icon, color, sub }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <Text className="text-slate-500 text-xs font-medium">{label}</Text>
                <Metric className="mt-1">{value}</Metric>
                <Text className="text-xs mt-1 text-slate-400">{sub}</Text>
              </div>
              <div className={`p-2.5 rounded-xl bg-${color}-50`}>
                <Icon className={`w-5 h-5 text-${color}-500`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Gráfico + Distribución */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <Text className="font-semibold text-slate-800 mb-1">OTs por día</Text>
          {loading ? (
            <div className="h-52 animate-pulse bg-slate-100 rounded mt-4" />
          ) : data?.por_dia?.length > 0 ? (
            <BarChart
              data={data.por_dia}
              index="dia"
              categories={["realizadas", "pendientes", "canceladas"]}
              colors={["emerald", "amber", "red"]}
              className="h-52"
              showLegend={true}
              showGridLines={false}
              stack={false}
            />
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Sin datos para el período</div>
          )}
        </Card>

        <Card>
          <Text className="font-semibold text-slate-800 mb-4">Por tipo de servicio</Text>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-slate-100 rounded animate-pulse"/>)}</div>
          ) : data?.por_tipo?.length > 0 ? (
            <div className="space-y-3">
              {data.por_tipo.slice(0, 6).map(t => {
                const total = data.kpis.total - data.kpis.canceladas;
                const pct = total > 0 ? Math.round(t.cantidad / total * 100) : 0;
                return (
                  <div key={t.tipo}>
                    <div className="flex justify-between mb-1">
                      <Text className="text-xs text-slate-600 font-medium truncate max-w-[160px]">{t.tipo}</Text>
                      <Text className="text-xs text-slate-400">{t.cantidad}</Text>
                    </div>
                    <ProgressBar value={pct} color="indigo" className="h-1.5" />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center mt-8">Sin datos</p>
          )}
        </Card>
      </div>

      {/* Ranking técnicos */}
      <Card>
        <Text className="font-semibold text-slate-800 mb-4">Ranking de técnicos</Text>
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse"/>)}</div>
        ) : data?.ranking_tecnicos?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">#</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Técnico</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Realizadas</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-40">Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking_tecnicos.map((t, i) => (
                  <tr key={t.nombre} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-slate-400 font-medium">{i + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {t.nombre[0]}
                        </div>
                        <span className="font-medium text-slate-700">{t.nombre}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">{t.realizadas}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{t.total}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={t.pct} color={t.pct >= 80 ? "emerald" : t.pct >= 50 ? "amber" : "red"} className="flex-1 h-1.5" />
                        <span className="text-xs text-slate-400 w-8 text-right">{t.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">Sin datos para el período seleccionado</p>
        )}
      </Card>
    </div>
  );
}

function fmtFecha(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
