import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "TecnoOP",
  description: "Gestión de técnicos en campo",
};

export const viewport = {
  themeColor: "#6366f1",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="TecnoOP" />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
