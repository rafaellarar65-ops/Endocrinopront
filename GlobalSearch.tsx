import { useState, useEffect } from "react";
import { Search, X, User, Calendar, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: pacientes } = trpc.pacientes.search.useQuery(
    { searchTerm },
    { enabled: searchTerm.length >= 2 && isAuthenticated }
  );

  const { data: consultas } = trpc.consultas.list.useQuery(undefined, {
    enabled: isOpen,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredConsultas = consultas?.filter((consulta) => {
    if (searchTerm.length < 2) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      consulta.id.toString().includes(searchLower) ||
      new Date(consulta.dataHora).toLocaleDateString("pt-BR").includes(searchLower)
    );
  });

  const handleSelectPaciente = (pacienteId: number) => {
    setLocation(`/pacientes/${pacienteId}`);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSelectConsulta = (consultaId: number) => {
    setLocation(`/consulta/${consultaId}`);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative w-64 justify-start text-sm text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="fixed left-1/2 top-20 w-full max-w-2xl -translate-x-1/2" onClick={(e) => e.stopPropagation()}>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar pacientes, consultas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-0 focus-visible:ring-0"
                  autoFocus
                />
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {searchTerm.length >= 2 && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Pacientes */}
                  {pacientes && pacientes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Pacientes
                      </h3>
                      <div className="space-y-1">
                        {pacientes.map((paciente) => (
                          <button
                            key={paciente.id}
                            onClick={() => handleSelectPaciente(paciente.id)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="font-medium">{paciente.nome}</div>
                            {paciente.cpf && (
                              <div className="text-sm text-gray-500">CPF: {paciente.cpf}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Consultas */}
                  {filteredConsultas && filteredConsultas.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Consultas
                      </h3>
                      <div className="space-y-1">
                        {filteredConsultas.slice(0, 5).map((consulta) => (
                          <button
                            key={consulta.id}
                            onClick={() => handleSelectConsulta(consulta.id)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="font-medium">
                              Consulta #{consulta.id}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(consulta.dataHora).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No results */}
                  {pacientes?.length === 0 && filteredConsultas?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum resultado encontrado
                    </div>
                  )}
                </div>
              )}

              {searchTerm.length < 2 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Digite pelo menos 2 caracteres para buscar
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
