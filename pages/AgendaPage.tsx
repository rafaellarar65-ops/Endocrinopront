import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Bell, RefreshCcw, Mail, ArrowRight } from "lucide-react";

const compromissos = [
  { horario: "09:00", paciente: "Ana Souza", tipo: "Retorno", canal: "WhatsApp" },
  { horario: "10:30", paciente: "Carlos Lima", tipo: "Consulta", canal: "E-mail" },
  { horario: "14:00", paciente: "Fernanda Dias", tipo: "Bioimpedância", canal: "WhatsApp" },
];

export default function AgendaPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold">Agenda de Consultas</h1>
              <p className="text-muted-foreground">Calendário interativo com notificações automáticas e sincronização externa.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <RefreshCcw className="h-4 w-4 mr-2" /> Sincronizar Google Calendar
              </Button>
              <Button>
                <CalendarDays className="h-4 w-4 mr-2" /> Nova consulta
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Compromissos do dia</CardTitle>
                <CardDescription>Visão rápida para reagendamento e confirmação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {compromissos.map((c) => (
                  <div key={c.horario} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">{c.horario}</span>
                        <Badge variant="outline">{c.tipo}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{c.paciente}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        Reagendar
                      </Button>
                      <Button size="sm" variant="secondary">
                        Confirmar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-muted/40">
              <CardHeader>
                <CardTitle>Notificações automáticas</CardTitle>
                <CardDescription>E-mail e WhatsApp configurados por padrão.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bell className="h-4 w-4" /> Lembrete 24h antes via WhatsApp
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" /> E-mail de confirmação automática
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> Relembrar 1h antes com link de videochamada
                </div>
                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    Configurar regras de conflito
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Calendário mensal/semanal</CardTitle>
              <CardDescription>Placeholder pronto para receber o componente interativo.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              {["Seg", "Ter", "Qua", "Qui"].map((dia) => (
                <div key={dia} className="rounded-lg border p-3 bg-white">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>{dia}</span>
                    <Badge variant="outline">3 eventos</Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> Consultas
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" /> Reagendamentos
                    </div>
                    <div className="flex items-center gap-1">
                      <Bell className="h-3 w-3" /> Notificações enviadas
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
