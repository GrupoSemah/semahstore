import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock } from "lucide-react";

// Acceso a la variable de entorno (debe tener prefijo PUBLIC_ en componentes cliente)
const AUTH_KEY = import.meta.env.PUBLIC_AUTH_KEY;

export const AuthModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  // Verificar si ya está autenticado al cargar el componente
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (isAuthenticated) {
      setIsOpen(false);
    }
  }, []);

  // Si se cierra el modal sin autenticarse, redirige a la página principal
  const handleOpenChange = (open) => {
    if (!open) {
      // Solo permitimos cerrar el modal si está autenticado
      const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
      if (!isAuthenticated) {
        window.location.href = '/';
      }
      setIsOpen(open);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError("Por favor ingrese la contraseña");
      return;
    }

    setIsChecking(true);
    
    // Simple verificación local de la contraseña
    setTimeout(() => {
      if (password === AUTH_KEY) {
        // Guardar estado de autenticación en sessionStorage (se borra al cerrar el navegador)
        sessionStorage.setItem('adminAuthenticated', 'true');
        toast.success("Acceso concedido");
        setIsOpen(false);
      } else {
        setError("Contraseña incorrecta");
        toast.error("Acceso denegado");
      }
      setIsChecking(false);
    }, 500); // pequeño retraso para simular verificación
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Acceso Restringido
          </DialogTitle>
          <DialogDescription>
            Esta sección requiere autenticación. Por favor ingrese la contraseña.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Ingrese la contraseña"
              disabled={isChecking}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={isChecking}>
              {isChecking ? "Verificando..." : "Acceder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
