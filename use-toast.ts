// Hook simplificado de toast usando alert nativo
// TODO: Substituir por biblioteca de toast mais robusta (sonner, react-hot-toast, etc)

interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    const message = description ? `${title}\n\n${description}` : title;
    
    if (variant === "destructive") {
      alert(`❌ ${message}`);
    } else {
      alert(`✅ ${message}`);
    }
  };

  return { toast };
}
