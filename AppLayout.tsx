import { useAuth } from "@/_core/hooks/useAuth";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { 
  Calendar, 
  Search, 
  Users, 
  Activity, 
  BarChart3,
  LogOut,
  Settings,
  Layout,
  Save,
  FileCheck
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { logout } = useAuth();
  const [location, setLocation] = useLocation();

  const menuItems = [
    { icon: Activity, label: "Página inicial", path: "/dashboard" },
    { icon: Calendar, label: "Agenda", path: "/agenda" },
    { icon: Users, label: "Pacientes", path: "/pacientes" },
    { icon: BarChart3, label: "Bioimpedâncias", path: "/bioimpedancias" },
    { icon: Save, label: "Protocolos salvos", path: "/protocolos" },
    { icon: FileCheck, label: "Prescrições salvas", path: "/prescricoes" },
    { icon: Settings, label: "Configurações", path: "/configuracoes" },
    { icon: Layout, label: "Layouts", path: "/layouts" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-72 bg-[#2C5AA0] text-white flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-serif">RL</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Rafael Lara</h1>
              <p className="text-sm text-white/70">CRM-BA 12345</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  isActive ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/20">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Header com busca global */}
        <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
          <div className="max-w-6xl mx-auto flex justify-center">
            <GlobalSearch />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
