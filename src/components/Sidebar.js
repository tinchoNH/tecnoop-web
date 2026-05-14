"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const MODULOS_BASE = [
  {
    key: "ordenes",
    nombre: "Órdenes de Trabajo",
    icon: "📋",
    subs: [
      { href: "/dashboard/ordenes",          label: "Vista del día" },
      { href: "/dashboard/ordenes/historial", label: "Historial" },
    ],
  },
  {
    key: "tecnicos",
    nombre: "Técnicos",
    icon: "👷",
    subs: [
      { href: "/dashboard/tecnicos", label: "Lista de técnicos" },
    ],
  },
  {
    key: "clientes",
    nombre: "Clientes",
    icon: "🏢",
    subs: [
      { href: "/dashboard/clientes", label: "Lista de clientes" },
    ],
  },
  {
    key: "contratos",
    nombre: "Contratos",
    icon: "📄",
    subs: [
      { href: "/dashboard/contratos", label: "Contratos recurrentes" },
    ],
  },
  {
    key: "estadisticas",
    nombre: "Estadísticas",
    icon: "📊",
    subs: [
      { href: "/dashboard/estadisticas", label: "Resumen general" },
    ],
  },
  {
    key: "mapa",
    nombre: "Mapa",
    icon: "🗺️",
    subs: [
      { href: "/dashboard/mapa", label: "Técnicos en tiempo real" },
    ],
  },
  {
    key: "configuracion",
    nombre: "Configuración",
    icon: "⚙️",
    subs: [
      { href: "/dashboard/configuracion", label: "Configuración" },
    ],
  },
];

const MODULO_ADMIN = {
  key: "admin",
  nombre: "Administración",
  icon: "🔐",
  subs: [
    { href: "/dashboard/admin/usuarios", label: "Usuarios" },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, rol, logout } = useAuth();

  const todosModulos = rol === "admin" || rol === "superadmin"
    ? [...MODULOS_BASE, MODULO_ADMIN]
    : MODULOS_BASE;

  const [openModulo, setOpenModulo] = useState(() => {
    for (const mod of MODULOS_BASE) {
      if (mod.subs?.some(s => pathname.startsWith(s.href.split("?")[0]))) return mod.nombre;
    }
    return "Órdenes de Trabajo";
  });

  return (
    <aside className="w-60 min-h-screen flex flex-col shrink-0"
      style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)" }}>

      <Link href="/dashboard"
        className="block px-5 py-5 border-b border-indigo-700/50 hover:bg-white/10 transition">
        <h1 className="text-base font-bold text-white">TecnoOP</h1>
        <p className="text-xs text-indigo-300 mt-0.5">Bienvenido, {user}</p>
      </Link>

      <nav className="flex-1 py-3 overflow-y-auto">
        {todosModulos.map(mod => (
          <div key={mod.nombre}>
            <button
              onClick={() => setOpenModulo(openModulo === mod.nombre ? "" : mod.nombre)}
              className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm transition text-left
                ${openModulo === mod.nombre
                  ? "bg-white/10 text-white"
                  : "text-indigo-200 hover:bg-white/8 hover:text-white"
                }`}
            >
              <span>{mod.icon}</span>
              <span className="flex-1 font-medium">{mod.nombre}</span>
              <span className="text-xs text-indigo-400">{openModulo === mod.nombre ? "▾" : "▸"}</span>
            </button>

            {openModulo === mod.nombre && mod.subs && (
              <div className="ml-9 border-l border-indigo-600/50">
                {mod.subs.map(sub => {
                  const isActive = pathname === sub.href.split("?")[0];
                  return (
                    <Link key={sub.href} href={sub.href}
                      className={`block px-4 py-2 text-sm transition
                        ${isActive
                          ? "text-white bg-white/15 font-medium border-l-2 border-indigo-300 -ml-px"
                          : "text-indigo-300 hover:text-white hover:bg-white/8"
                        }`}>
                      {sub.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-indigo-700/50 flex items-center justify-between">
        <button onClick={logout}
          className="text-sm text-indigo-300 hover:text-red-400 transition text-left">
          Cerrar sesión
        </button>
        <span className="text-xs text-indigo-500">v0.1</span>
      </div>
    </aside>
  );
}
