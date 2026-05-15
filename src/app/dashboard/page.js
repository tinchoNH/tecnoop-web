"use client";
import { useEffect, useState } from "react";
import { Card, Metric, Text, Badge, ProgressBar, AreaChart } from "@tremor/react";
import { ClipboardList, Users, CheckCircle, Clock } from "lucide-react";
import { api } from "@/lib/api";

const colorEstado = {
  disponible: "blue",
  en_servicio: "emerald",
  ausente: "red",
};

const labelEstado = {
  disponible: "Disponible",
  en_servicio: "En servicio",
  ausente: "Ausente",
};

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-slate-200 rounded w-20" />
            <div className="h-8 bg-slate-200 rounded w-12" />
            <div className="h-3 bg-slate-200 rounded w-24" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/estadisticas/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const hoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const kpis = data
    ? [
        {
          label: "OTs hoy",
          value: String(data.ots_hoy.total),
          sub: data.ots_ayer_total > 0
            ? `${data.ots_hoy.total >= data.ots_ayer_total ? "↑" : "↓"} ${Math.abs(data.ots_hoy.total - data.ots_ayer_total)} vs ayer`
            : "Sin datos de ayer",
          icon: ClipboardList,
          color: "indigo",
        },
        {
          label: "En curso",
          value: String(data.ots_hoy.en_curso),
          sub: `${data.tecnicos_hoy.length} técnico${data.tecnicos_hoy.length !== 1 ? "s" : ""} activo${data.tecnicos_hoy.length !== 1 ? "s" : ""}`,
          icon: Users,
          color: "emerald",
        },
        {
          label: "Realizadas",
          value: String(data.ots_hoy.realizadas),
          sub: data.ots_hoy.total > 0
            ? `${Math.round((data.ots_hoy.realizadas / data.ots_hoy.total) * 100)}% completado`
            : "Sin OTs hoy",
          icon: CheckCircle,
          color: "blue",
        },
        {
          label: "Pendientes",
          value: String(data.ots_hoy.pendientes),
          sub: data.ots_hoy.sin_asignar > 0
            ? `${data.ots_hoy.sin_asignar} sin asignar`
            : "Todas asignadas",
          icon: Clock,
          color: "amber",
        },
      ]
    : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">{hoy}</p>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Error al cargar datos: {error}
        </div>
      )}

      {!data ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {kpis.map(({ label, value, sub, icon: Icon, color }) => (
            <Card key={label} className="relative overflow-hidden">
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
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <Text className="font-semibold text-slate-800 mb-4">OTs esta semana</Text>
          {data ? (
            <AreaChart
              data={data.semana}
              index="dia"
              categories={["realizadas", "pendientes"]}
              colors={["indigo", "amber"]}
              className="h-48"
              showLegend={true}
              showGridLines={false}
            />
          ) : (
            <div className="h-48 animate-pulse bg-slate-100 rounded" />
          )}
        </Card>

        <Card>
          <Text className="font-semibold text-slate-800 mb-4">Técnicos hoy</Text>
          {data ? (
            data.tecnicos_hoy.length === 0 ? (
              <Text className="text-slate-400 text-sm">Sin técnicos asignados hoy</Text>
            ) : (
              <div className="space-y-4">
                {data.tecnicos_hoy.map((t) => (
                  <div key={t.nombre}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                          {t.nombre[0]}
                        </div>
                        <Text className="text-sm font-medium text-slate-700">{t.nombre}</Text>
                      </div>
                      <Badge color={colorEstado[t.estado] || "gray"} size="xs">
                        {labelEstado[t.estado] || t.estado}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={t.total > 0 ? (t.realizadas / t.total) * 100 : 0}
                        color="indigo"
                        className="flex-1"
                      />
                      <Text className="text-xs text-slate-400 w-8 text-right">
                        {t.realizadas}/{t.total}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-1">
                  <div className="h-3 bg-slate-200 rounded w-32" />
                  <div className="h-2 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
