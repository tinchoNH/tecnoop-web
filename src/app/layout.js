import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata = {
  title: "FieldOps",
  description: "Gestión de técnicos en campo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
