// Cliente HTTP con JWT — igual a App Logic, adaptado para FieldOps
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function request(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("fieldops_token") : null;

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem("fieldops_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(err.detail || "Error en la API");
  }

  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};
