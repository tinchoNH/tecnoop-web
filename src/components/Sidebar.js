"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  ClipboardList, Users, Building2, FileText,
  BarChart3, Map, Settings, LogOut, ChevronDown,
  ChevronRight, Shield,
} from "lucide-react";

const MODULOS = [
  {
    key: "ordenes",
    label: "Órdenes de Trabajo",
    icon: ClipboardList,
    subs: [
      { href: "/dashboard/ordenes",           label: "Vista del día" },
      { href: "/dashboard/ordenes/historial", label: "Historial" },
    ],
  },
  {
    key: "tecnicos",
    label: "Técnicos",
    icon: Users,
    subs: [{ href: "/dashboard/tecnicos", label: "Lista de técnicos" }],
  },
  {
    key: "clientes",
    label: "Clientes",
    icon: Building2,
    subs: [{ href: "/dashboard/clientes", label: "Lista de clientes" }],
  },
  {
    key: "contratos",
    label: "Contratos",
    icon: FileText,
    subs: [{ href: "/dashboard/contratos", label: "Contratos recurrentes" }],
  },
  {
    key: "estadisticas",
    label: "Estadísticas",
    icon: BarChart3,
    subs: [{ href: "/dashboard/estadisticas", label: "Resumen general" }],
  },
  {
    key: "mapa",
    label: "Mapa en vivo",
    icon: Map,
    subs: [{ href: "/dashboard/mapa", label: "Técnicos en campo" }],
  },
  {
    key: "configuracion",
    label: "Configuración",
    icon: Settings,
    subs: [{ href: "/dashboard/configuracion", label: "Configuración" }],
  },
];

const MODULO_ADMIN = {
  key: "admin", label: "Administración", icon: Shield,
  subs: [{ href: "/dashboard/admin/usuarios", label: "Usuarios" }],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, rol, logout } = useAuth();

  const modulos = (rol === "admin" || rol === "superadmin")
    ? [...MODULOS, MODULO_ADMIN]
    : MODULOS;

  const [open, setOpen] = useState(() => {
    for (const m of MODULOS) {
      if (m.subs?.some(s => pathname.startsWith(s.href))) return m.key;
    }
    return "ordenes";
  });

  return (
    <aside className="w-60 min-h-screen flex flex-col shrink-0 border-r border-slate-200 bg-white">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 hover:bg-slate-50 transition">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
          style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>T</div>
        <div>
          <p className="font-bold text-slate-900 text-sm leading-tight">TecnoOP</p>
          <p className="text-xs text-slate-400 leading-tight">{user}</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-0.5">
        {modulos.map(({ key, label, icon: Icon, subs }) => {
          const isOpen = open === key;
          const isActive = subs?.some(s => pathname.startsWith(s.href));
          return (
            <div key={key}>
              <button onClick={() => setOpen(isOpen ? "" : key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition text-left
                  ${isActive || isOpen ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-50"/> : <ChevronRight className="w-3.5 h-3.5 opacity-30"/>}
              </button>
              {isOpen && subs && (
                <div className="ml-9 mt-0.5 space-y-0.5">
                  {subs.map(sub => {
                    const active = pathname === sub.href || pathname.startsWith(sub.href + "/");
                    return (
                      <Link key={sub.href} href={sub.href}
                        className={`block px-3 py-1.5 rounded-lg text-xs transition
                          ${active ? "bg-indigo-100 text-indigo-700 font-semibold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100">
        <button onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition">
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
