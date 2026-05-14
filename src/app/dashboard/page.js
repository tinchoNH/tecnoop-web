"use client";
import { Card, Metric, Text, Badge, ProgressBar, AreaChart } from "@tremor/react";
import { ClipboardList, Users, CheckCircle, Clock } from "lucide-react";

const otsSemana = [
  { dia: "Lun", Realizadas: 8, Pendientes: 2 },
  { dia: "Mar", Realizadas: 11, Pendientes: 1 },
  { dia: "Mié", Realizadas: 7, Pendientes: 3 },
  { dia: "Jue", Realizadas: 9, Pendientes: 2 },
  { dia: "Vie", Realizadas: 12, Pendientes: 0 },
  { dia: "Hoy", Realizadas: 4, Pendientes: 5 },
];

const tecnicos = [
  { nombre: "Martínez", ots: 3, total: 4, estado: "En servicio" },
  { nombre: "Rodríguez", ots: 1, total: 3, estado: "En ruta"    },
  { nombre: "González",  ots: 2, total: 2, estado: "Disponible" },
  { nombre: "Fernández", ots: 0, total: 2, estado: "Disponible" },
];

const colorEstado = { "En servicio": "emerald", "En ruta": "yellow", "Disponible": "blue" };

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {new Date().toLocaleDateString("es-AR", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "OTs hoy",     value: "12", sub: "↑ 3 vs ayer",       icon: ClipboardList, color: "indigo" },
          { label: "En curso",    value: "5",  sub: "4 técnicos activos", icon: Users,         color: "emerald" },
          { label: "Realizadas",  value: "4",  sub: "33% completado",     icon: CheckCircle,   color: "blue" },
          { label: "Pendientes",  value: "3",  sub: "1 sin asignar",      icon: Clock,         color: "amber" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
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

      <div className="grid grid-cols-3 gap-4">
        {/* Gráfico */}
        <Card className="col-span-2">
          <Text className="font-semibold text-slate-800 mb-4">OTs esta semana</Text>
          <AreaChart
            data={otsSemana}
            index="dia"
            categories={["Realizadas", "Pendientes"]}
            colors={["indigo", "amber"]}
            className="h-48"
            showLegend={true}
            showGridLines={false}
          />
        </Card>

        {/* Técnicos */}
        <Card>
          <Text className="font-semibold text-slate-800 mb-4">Técnicos hoy</Text>
          <div className="space-y-4">
            {tecnicos.map(t => (
              <div key={t.nombre}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                      {t.nombre[0]}
                    </div>
                    <Text className="text-sm font-medium text-slate-700">{t.nombre}</Text>
                  </div>
                  <Badge color={colorEstado[t.estado]} size="xs">{t.estado}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar value={(t.ots / t.total) * 100} color="indigo" className="flex-1" />
                  <Text className="text-xs text-slate-400 w-8 text-right">{t.ots}/{t.total}</Text>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
