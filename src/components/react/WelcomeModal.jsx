import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBag, CreditCard, Mail } from "lucide-react";

export const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the modal has been shown before in this session
    const hasShownWelcome = sessionStorage.getItem("hasShownWelcome");
    
    if (!hasShownWelcome) {
      // Only show on first visit of the session
      setIsOpen(true);
      sessionStorage.setItem("hasShownWelcome", "true");
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">¡Bienvenido a SEMAH Store!</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Tu marketplace exclusivo para equipos tecnológicos y otros
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-3">
          <div className="flex items-start gap-3">
            <ShoppingBag className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium">Reserva equipos sin uso</h3>
              <p className="text-sm text-muted-foreground">
                En nuestra tienda online puedes reservar equipos tecnológicos sin uso 
                disponibles en las oficinas de SEMAH. Navega por nuestro catálogo y añade 
                los productos que desees a tu carrito.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CreditCard className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium">Métodos de pago flexibles</h3>
              <p className="text-sm text-muted-foreground">
                Para completar tu compra, comunícate con Carla Ferrer quien te enviará un 
                link de pago. Aceptamos efectivo, tarjetas Visa/Mastercard y Yappy para 
                tu comodidad.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium">Proceso de compra simple</h3>
              <p className="text-sm text-muted-foreground">
                Tras realizar tu reserva, recibirás un correo electrónico con los detalles. 
                Completa el pago y listo - tus equipos estarán apartados para ti.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} className="w-full">
            Comenzar a comprar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
