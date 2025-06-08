import "bootstrap/dist/css/bootstrap.min.css"; // Importa estilos de Bootstrap

import "./globals.css"; // Estilos globales

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BootstrapClient from "@/components/BootstrapClient"; // 🚀 nuevo componente

import { Geist, Geist_Mono } from "next/font/google"; // Fuentes de Google

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sistema POS",
  description: "Sistema de Gestión de Ventas y Facturación",
};

export default function RootLayout({ children }) {

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <BootstrapClient /> {/* 🔵 Cargar primero */}
        <Navbar />
        <main className="container-fluid">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
