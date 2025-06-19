import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const OfferDetailsModal = ({ 
  open, 
  onOpenChange, 
  deviceName, 
  offers, 
  formatDate, 
  renderStatusBadge,
  onAccept,
  onReject
}) => {
  // Ordenar las ofertas: pendientes primero, luego por precio más cercano al original
  const sortedOffers = [...offers].sort((a, b) => {
    // Priorizar ofertas pendientes
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    
    // Luego, ordenar por precio más cercano al original (menor diferencia porcentual)
    const diffA = Math.abs(a.offerPrice - a.originalPrice) / a.originalPrice;
    const diffB = Math.abs(b.offerPrice - b.originalPrice) / b.originalPrice;
    return diffA - diffB;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto max-w-md md:max-w-4xl lg:max-w-6xl w-[95vw] md:w-[95vw]">
        <DialogHeader>
          <DialogTitle>Ofertas para {deviceName}</DialogTitle>
          <DialogDescription>
            Lista de todas las ofertas realizadas para este producto
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 overflow-x-auto w-full">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Cliente</TableHead>
                <TableHead className="text-right whitespace-nowrap">Precio Original</TableHead>
                <TableHead className="text-right whitespace-nowrap">Oferta</TableHead>
                <TableHead className="whitespace-nowrap">Cantidad</TableHead>
                <TableHead className="text-center whitespace-nowrap">Estado</TableHead>
                <TableHead className="text-center whitespace-nowrap">Fecha</TableHead>
                <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOffers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    <div className="font-medium">{offer.customerName}</div>
                    <div className="text-xs text-muted-foreground">{offer.customerEmail}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    ${offer.originalPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${offer.offerPrice.toLocaleString()}{' '}
                    <span className="text-xs text-muted-foreground">
                      ({Math.round((offer.offerPrice / offer.originalPrice) * 100)}%)
                    </span>
                  </TableCell>
                  <TableCell>{offer.quantity}</TableCell>
                  <TableCell className="text-center">
                    {renderStatusBadge(offer.status)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-xs">{formatDate(offer.createdAt)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {offer.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button 
                          onClick={() => onAccept(offer)} 
                          size="sm" 
                          variant="outline"
                          className="h-8 gap-1"
                        >
                          <Check size={14} /> Aceptar
                        </Button>
                        <Button 
                          onClick={() => onReject(offer)} 
                          size="sm" 
                          variant="outline"
                          className="h-8 gap-1 text-destructive hover:text-destructive"
                        >
                          <X size={14} /> Rechazar
                        </Button>
                      </div>
                    )}
                    {offer.status !== 'pending' && (
                      <span className="text-xs text-muted-foreground">
                        {offer.status === 'rejected' && offer.rejectionReason ? 
                          `Motivo: ${offer.rejectionReason}` : 
                          'No disponible'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
