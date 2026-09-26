import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar, SidebarReopenButton } from "@/components/layout/sidebar";
import { PomodoroProvider } from "@/components/pomodoro/pomodoro-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Mission Control — Kubestronaut Tracker",
  description: "Painel pessoal de tracking para a jornada Kubestronaut (CNCF).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-bg text-ink font-sans antialiased">
        <PomodoroProvider>
          <div className="starfield" aria-hidden="true" />
          <div className="relative flex min-h-screen">
            <Sidebar />
            <SidebarReopenButton />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </PomodoroProvider>
      </body>
    </html>
  );
}
