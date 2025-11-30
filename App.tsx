import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Pacientes from "./pages/Pacientes";
import PacienteDetalhes from "./pages/PacienteDetalhes";
import NovaConsulta from "./pages/NovaConsulta";

import ConsultaDetalhesV2 from "./pages/ConsultaDetalhesV2";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import NovaConsultaPage from "./pages/NovaConsultaPage";
import AgendaPage from "./pages/AgendaPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import EscoresPage from "./pages/EscoresPage";
import BioimpedanciasPage from "./pages/BioimpedanciasPage";
import BioimpedanciaDetalhes from "./pages/BioimpedanciaDetalhes";
import ProtocolosPage from "./pages/ProtocolosPage";
import PrescricoesPage from "./pages/PrescricoesPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import LayoutsPage from "./pages/LayoutsPage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/nova-consulta"} component={NovaConsultaPage} />
      <Route path={"/agenda"} component={AgendaPage} />
      <Route path={"/pacientes"} component={Pacientes} />
      <Route path={"/pacientes/:id"} component={PacienteDetalhes} />
      <Route path={"/consulta/nova/:pacienteId"} component={NovaConsulta} />
      <Route path={"/consulta/:id"} component={ConsultaDetalhesV2} />
      <Route path={"/templates"} component={Templates} />
      <Route path={"/relatorios"} component={RelatoriosPage} />
      <Route path={"/escores"} component={EscoresPage} />
      <Route path={"/bioimpedancias"} component={BioimpedanciasPage} />
      <Route path={"/bioimpedancia/:id"} component={BioimpedanciaDetalhes} />
      <Route path={"/protocolos"} component={ProtocolosPage} />
      <Route path={"/prescricoes/:id"} component={PrescricoesPage} />
      <Route path={"/configuracoes"} component={ConfiguracoesPage} />
      <Route path={"/layouts"} component={LayoutsPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
