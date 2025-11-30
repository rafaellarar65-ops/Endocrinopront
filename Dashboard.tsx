import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  FileText, 
  Plus, 
  Users, 
  ClipboardList,
  BarChart3
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const actionCards = [
    {
      title: "Nova Consulta",
      description: "Iniciar novo atendimento",
      icon: Plus,
      color: "bg-[#2C5AA0]",
      action: () => setLocation("/nova-consulta"),
    },
    {
      title: "Acessar Prontuários",
      description: "Ver histórico de pacientes",
      icon: Users,
      color: "bg-[#6B8DBF]",
      action: () => setLocation("/pacientes"),
    },
    {
      title: "Agenda",
      description: "Gerenciar compromissos",
      icon: Calendar,
      color: "bg-[#2C5AA0]",
      action: () => setLocation("/agenda"),
    },
    {
      title: "Relatórios de Saúde",
      description: "Gerar documentos médicos",
      icon: FileText,
      color: "bg-[#6B8DBF]",
      action: () => setLocation("/relatorios"),
    },
    {
      title: "Templates de documentos",
      description: "Modelos personalizados",
      icon: ClipboardList,
      color: "bg-[#2C5AA0]",
      action: () => setLocation("/templates"),
    },
    {
      title: "Escores Cadastrados",
      description: "Ferramentas de avaliação",
      icon: BarChart3,
      color: "bg-[#6B8DBF]",
      action: () => setLocation("/escores"),
    },
  ];

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actionCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.title}
                  className={`${card.color} text-white border-none cursor-pointer hover:opacity-90 transition-opacity`}
                  onClick={card.action}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Icon className="w-12 h-12" />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-2xl mb-2 text-white">{card.title}</CardTitle>
                    <CardDescription className="text-white/80">