"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,       setUser]       = useState(null);
  const [token,      setToken]      = useState(null);
  const [rol,        setRol]        = useState(null);
  const [empresaId,  setEmpresaId]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("tecnoop_token");
    const u = localStorage.getItem("tecnoop_usuario");
    const r = localStorage.getItem("tecnoop_rol");
    const e = localStorage.getItem("tecnoop_empresa_id");
    if (t && u) {
      setToken(t);
      setUser(u);
      setRol(r || "tecnico");
      setEmpresaId(e);
    }
    setLoading(false);
  }, []);

  const login = (tok, usuario, rol, empresaId) => {
    localStorage.setItem("tecnoop_token",      tok);
    localStorage.setItem("tecnoop_usuario",    usuario);
    localStorage.setItem("tecnoop_rol",        rol || "tecnico");
    localStorage.setItem("tecnoop_empresa_id", empresaId || "");
    setToken(tok);
    setUser(usuario);
    setRol(rol || "tecnico");
    setEmpresaId(empresaId);
    router.push("/dashboard");
  };

  const logout = () => {
    ["tecnoop_token", "tecnoop_usuario", "tecnoop_rol", "tecnoop_empresa_id"]
      .forEach(k => localStorage.removeItem(k));
    setToken(null);
    setUser(null);
    setRol(null);
    setEmpresaId(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, rol, empresaId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
