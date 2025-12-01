import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <AppLayout>
      <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
        <div className="text-6xl font-bold text-primary">404</div>
        <p className="text-muted-foreground max-w-lg">
          A página que você procurou não foi encontrada. Use o menu lateral ou volte para o dashboard.
        </p>
        <Button onClick={() => setLocation("/dashboard")}>Voltar para o início</Button>
      </div>
    </AppLayout>
  );
}
