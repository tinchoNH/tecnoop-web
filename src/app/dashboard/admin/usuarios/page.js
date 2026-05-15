"use client";
import { useState, useEffect } from "react";
import { Badge } from "@tremor/react";
import { Shield, Plus, X, Pencil, Trash2, User } from "lucide-react";
import { api } from "@/lib/api";

const ROL_CONFIG = {
  admin:      { label: "Admin",      color: "violet"  },
  supervisor: { label: "Supervisor", color: "blue"    },
  tecnico:    { label: "Técnico",    color: "emerald" },
  cliente:    { label: "Cliente",    color: "gray"    },
};

const ROLES = Object.entries(ROL_CONFIG).map(([value, { label }]) => ({ value, label }));

export default function UsuariosPage() {
  const [usuarios,     setUsuarios]     = useState([]);
  const [tecnicos,     setTecnicos]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([api.get("/usuarios/"), api.get("/tecnicos/")]);
      setUsuarios(u);
      setTecnicos(t);
    } finally { setLoading(false); }
  }

  const activos   = usuarios.filter(u => u.activo);
  const inactivos = usuarios.filter(u => !u.activo);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Administración</h1>
          <p className="text-sm text-slate-500 mt-0.5">{activos.length} usuario{activos.length !== 1 ? "s" : ""} activo{activos.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition"
          style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuario</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Técnico vinculado</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {[...activos, ...inactivos].map(u => {
                const rol = ROL_CONFIG[u.rol] || { label: u.rol, color: "gray" };
                return (
                  <tr key={u.id}
                    onClick={() => setSeleccionado(u)}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {u.nombre[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{u.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge color={rol.color} size="xs">{rol.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {u.tecnicos?.nombre || <span className="text-slate-300 italic text-xs">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge color={u.activo ? "emerald" : "gray"} size="xs">
                        {u.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-over */}
      <SlideOver
        usuario={seleccionado}
        tecnicos={tecnicos}
        onClose={() => setSeleccionado(null)}
        onActualizado={() => { cargar(); setSeleccionado(null); }}
      />

      {showModal && (
        <ModalNuevoUsuario
          tecnicos={tecnicos}
          onClose={() => setShowModal(false)}
          onCreado={cargar}
        />
      )}
    </div>
  );
}

/* ─── Slide-over ─── */
function SlideOver({ usuario, tecnicos, onClose, onActualizado }) {
  const [editando, setEditando] = useState(false);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!usuario) { setEditando(false); return; }
    setForm({
      nombre:     usuario.nombre,
      rol:        usuario.rol,
      tecnico_id: usuario.tecnico_id || "",
      activo:     usuario.activo,
    });
    setEditando(false);
  }, [usuario?.id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function guardar() {
    setSaving(true);
    try {
      const body = { nombre: form.nombre, rol: form.rol, activo: form.activo };
      if (form.tecnico_id) body.tecnico_id = form.tecnico_id;
      else body.tecnico_id = null;
      await api.patch(`/usuarios/${usuario.id}`, body);
      onActualizado();
    } finally { setSaving(false); }
  }

  async function desactivar() {
    if (!confirm(`¿Desactivar a ${usuario.nombre}?`)) return;
    await api.delete(`/usuarios/${usuario.id}`);
    onActualizado();
  }

  const abierto = !!usuario;
  const rol = usuario ? (ROL_CONFIG[usuario.rol] || { label: usuario.rol, color: "gray" }) : null;

  return (
    <>
      <div onClick={onClose}
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        style={{ opacity: abierto ? 1 : 0, pointerEvents: abierto ? "auto" : "none" }} />

      <div className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: abierto ? "translateX(0)" : "translateX(100%)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {usuario && (
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                {usuario.nombre[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-slate-900 text-sm">{usuario?.nombre}</p>
              {rol && <Badge color={rol.color} size="xs">{rol.label}</Badge>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {usuario && (
            <>
              <Section label="Email">
                <p className="text-sm text-slate-700">{usuario.email}</p>
              </Section>

              <Section label="Nombre">
                {editando ? (
                  <input value={form.nombre} onChange={e => set("nombre", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                ) : (
                  <p className="text-sm text-slate-700">{usuario.nombre}</p>
                )}
              </Section>

              <Section label="Rol">
                {editando ? (
                  <select value={form.rol} onChange={e => set("rol", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                ) : (
                  <Badge color={rol?.color}>{rol?.label}</Badge>
                )}
              </Section>

              <Section label="Técnico vinculado">
                {editando ? (
                  <select value={form.tecnico_id} onChange={e => set("tecnico_id", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                    <option value="">Sin vincular</option>
                    {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                ) : (
                  <p className="text-sm text-slate-700">
                    {usuario.tecnicos?.nombre || <span className="text-slate-400 italic text-xs">Sin vincular</span>}
                  </p>
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
                  <Badge color={usuario.activo ? "emerald" : "gray"}>{usuario.activo ? "Activo" : "Inactivo"}</Badge>
                )}
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          {!editando ? (
            <>
              <button onClick={() => setEditando(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              {usuario?.activo && (
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

/* ─── Modal nuevo usuario ─── */
function ModalNuevoUsuario({ tecnicos, onClose, onCreado }) {
  const [form, setForm] = useState({
    nombre: "", email: "", password: "", rol: "tecnico", tecnico_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const body = { nombre: form.nombre, email: form.email, password: form.password, rol: form.rol };
      if (form.tecnico_id) body.tecnico_id = form.tecnico_id;
      await api.post("/usuarios/", body);
      onCreado(); onClose();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Nuevo usuario</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

          <Field label="Nombre completo *">
            <input required value={form.nombre} onChange={e => set("nombre", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </Field>

          <Field label="Email *">
            <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </Field>

          <Field label="Contraseña *">
            <input required type="password" value={form.password} onChange={e => set("password", e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </Field>

          <Field label="Rol *">
            <select required value={form.rol} onChange={e => set("rol", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>

          {form.rol === "tecnico" && (
            <Field label="Vincular con técnico">
              <select value={form.tecnico_id} onChange={e => set("tecnico_id", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                <option value="">Sin vincular por ahora</option>
                {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1">Necesario para que el técnico vea sus OTs en la app móvil</p>
            </Field>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
              style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
              {saving ? "Creando..." : "Crear usuario"}
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
