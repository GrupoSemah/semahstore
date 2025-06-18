import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Check, 
  X, 
  Loader2, 
  Clock, 
  Tag, 
  BadgeCheck, 
  AlertTriangle,
  List
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { OfferDetailsModal } from "./OfferDetailsModal";

export const OfferManagement = () => {
  // Agrupar ofertas por dispositivo
  const groupOffersByDevice = () => {
    if (!offers || offers.length === 0) return [];
    
    // Crear un mapa para agrupar por deviceId
    const deviceMap = {};
    
    offers.forEach(offer => {
      const deviceId = offer.device.id;
      
      if (!deviceMap[deviceId]) {
        deviceMap[deviceId] = {
          deviceId,
          deviceName: offer.device.name,
          deviceBrand: offer.device.brand,
          originalPrice: offer.originalPrice,
          offers: [],
          bestOffer: null,
          pendingOffers: 0,
          totalOffers: 0
        };
      }
      
      deviceMap[deviceId].offers.push(offer);
      deviceMap[deviceId].totalOffers++;
      
      if (offer.status === 'pending') {
        deviceMap[deviceId].pendingOffers++;
      }
      
      // Encontrar la mejor oferta (más cercana al precio original)
      if (!deviceMap[deviceId].bestOffer || 
          Math.abs(offer.offerPrice - offer.originalPrice) < 
          Math.abs(deviceMap[deviceId].bestOffer.offerPrice - deviceMap[deviceId].bestOffer.originalPrice)) {
        deviceMap[deviceId].bestOffer = offer;
      }
    });
    
    return Object.values(deviceMap);
  };
  
  // Abrir modal de detalles para un producto
  const openDetailsModal = (deviceId, deviceName) => {
    const deviceOffers = offers.filter(offer => offer.device.id === deviceId);
    setSelectedDeviceOffers(deviceOffers);
    setSelectedDeviceName(deviceName);
    setDetailsModalOpen(true);
  };
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [dialogAction, setDialogAction] = useState(null); // 'accept' o 'reject'
  const [actionLoading, setActionLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState(null);
  
  // Estado para el modal de detalle de ofertas por producto
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDeviceOffers, setSelectedDeviceOffers] = useState([]);
  const [selectedDeviceName, setSelectedDeviceName] = useState("");

  // Obtener el token CSRF
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await axios.get("/api/csrf");
        if (response.data && response.data.token) {
          setCsrfToken(response.data.token);
        }
      } catch (err) {
        console.error("Error al obtener token CSRF:", err);
        setError("Error al obtener el token de seguridad");
      }
    };

    fetchCSRFToken();
  }, []);

  // Cargar ofertas
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/offers");
        setOffers(response.data);
      } catch (err) {
        console.error("Error al cargar ofertas:", err);
        setError("Error al cargar las ofertas");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);
  
  // Formatear la fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Enviar notificación al cliente sobre el estado de su oferta
  const sendNotification = async (offerId) => {
    if (!csrfToken || !offerId) return false;
    
    try {
      const response = await axios.post("/api/offers/notifications", 
        { offerId },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
          }
        }
      );
      
      return response.data.success;
    } catch (err) {
      console.error("Error al enviar notificación:", err);
      return false;
    }
  };

  // Manejar aceptación o rechazo de ofertas
  const handleAction = async () => {
    if (!currentOffer || !dialogAction || !csrfToken) return;

    setActionLoading(true);
    try {
      const payload = { 
        offerId: currentOffer.id, 
        action: dialogAction
      };
      
      // Si es rechazo, añadir razón
      if (dialogAction === 'reject') {
        payload.rejectionReason = rejectionReason;
      }
      
      const response = await axios.patch("/api/offers", payload, {
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        }
      });
      
      if (response.data.success) {
        // Actualizar la lista de ofertas localmente
        setOffers(prevOffers => prevOffers.map(offer => 
          offer.id === currentOffer.id 
            ? {
                ...offer, 
                status: dialogAction === 'accept' ? 'accepted' : 'rejected',
                rejectionReason: dialogAction === 'reject' ? rejectionReason : offer.rejectionReason
              } 
            : offer
        ));
        
        // Enviar notificación al cliente
        const notificationSent = await sendNotification(currentOffer.id);
        
        toast.success(
          dialogAction === 'accept' 
            ? "Oferta aceptada correctamente" 
            : "Oferta rechazada correctamente", 
          { 
            description: dialogAction === 'accept' 
              ? `Se ha generado la reserva con código: ${response.data.reservationCode}${notificationSent ? ' y se ha notificado al cliente.' : ''}` 
              : `${notificationSent ? 'Se ha notificado al cliente.' : ''}` 
          }
        );
      }
    } catch (err) {
      console.error("Error al procesar la oferta:", err);
      toast.error("Error al procesar la oferta", {
        description: err.response?.data?.message || err.message
      });
    } finally {
      setActionLoading(false);
      setDialogOpen(false);
      setCurrentOffer(null);
      setRejectionReason("");
      setDialogAction(null);
    }
  };

  // Abrir diálogo de confirmación para aceptar
  const openAcceptDialog = (offer) => {
    setCurrentOffer(offer);
    setDialogAction('accept');
    setDialogOpen(true);
  };
  
  // Abrir diálogo de confirmación para rechazar
  const openRejectDialog = (offer) => {
    setCurrentOffer(offer);
    setDialogAction('reject');
    setRejectionReason("");
    setDialogOpen(true);
  };
  
  // Renderizar el badge de status
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock size={14} /> Pendiente</Badge>;
      case 'accepted':
        return <Badge variant="success" className="gap-1"><Check size={14} /> Aceptada</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><X size={14} /> Rechazada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Gestión de Ofertas</CardTitle>
          <CardDescription>
            Administra las ofertas realizadas por los clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <div className="text-center p-8 border rounded-md">
              <Tag className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No hay ofertas disponibles</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio Original</TableHead>
                    <TableHead className="text-right">Mejor Oferta</TableHead>
                    <TableHead className="text-center">Cantidad de Ofertas</TableHead>
                    <TableHead className="text-center">Pendientes</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupOffersByDevice().map((group) => (
                    <TableRow key={group.deviceId}>
                      <TableCell>
                        <div className="font-medium">{group.deviceName}</div>
                        <div className="text-xs text-muted-foreground">{group.deviceBrand}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        ${group.originalPrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${group.bestOffer.offerPrice.toLocaleString()}{' '}
                        <span className="text-xs text-muted-foreground">
                          ({Math.round((group.bestOffer.offerPrice / group.originalPrice) * 100)}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{group.totalOffers}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={group.pendingOffers > 0 ? "secondary" : "outline"} className="gap-1">
                          <Clock size={14} />{group.pendingOffers}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            onClick={() => openDetailsModal(group.deviceId, group.deviceName)} 
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                          >
                            <List size={14} /> Ver Detalles
                          </Button>
                          {group.pendingOffers > 0 && (
                            <Button 
                              onClick={() => openAcceptDialog(group.bestOffer)} 
                              size="sm" 
                              variant="outline"
                              className="h-8 gap-1"
                            >
                              <Check size={14} /> Aceptar Mejor
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {dialogAction === 'accept' ? (
            <>
              <DialogHeader>
                <DialogTitle>Aceptar Oferta</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas aceptar esta oferta? Se creará una reserva y se reducirá el stock.
                </DialogDescription>
              </DialogHeader>
              
              {currentOffer && (
                <div className="py-4">
                  <div className="rounded-md bg-muted p-4 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm font-medium">Cliente:</p>
                        <p className="text-sm">{currentOffer.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Producto:</p>
                        <p className="text-sm">{currentOffer.device?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Precio Original:</p>
                        <p className="text-sm">${currentOffer.originalPrice?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Precio Ofertado:</p>
                        <p className="text-sm">${currentOffer.offerPrice?.toLocaleString()} ({Math.round((currentOffer.offerPrice / currentOffer.originalPrice) * 100)}%)</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Cantidad:</p>
                        <p className="text-sm">{currentOffer.quantity}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-start gap-2 mt-2">
                    <BadgeCheck className="h-5 w-5 text-green-500" />
                    <p className="text-sm">
                      Al aceptar la oferta, se generará una reserva automáticamente y se notificará al cliente.
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={actionLoading}>
                  Cancelar
                </Button>
                <Button onClick={handleAction} disabled={actionLoading} className="gap-2">
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Aceptar Oferta
                </Button>
              </DialogFooter>
              {/* Modal para detalles de ofertas por producto */}
      <OfferDetailsModal 
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        deviceName={selectedDeviceName}
        offers={selectedDeviceOffers}
        formatDate={formatDate}
        renderStatusBadge={renderStatusBadge}
        onAccept={openAcceptDialog}
        onReject={openRejectDialog}
      />
    </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Rechazar Oferta</DialogTitle>
                <DialogDescription>
                  Por favor, ingresa una razón para rechazar esta oferta.
                </DialogDescription>
              </DialogHeader>
              
              {currentOffer && (
                <div className="py-4">
                  <div className="rounded-md bg-muted p-4 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm font-medium">Cliente:</p>
                        <p className="text-sm">{currentOffer.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Producto:</p>
                        <p className="text-sm">{currentOffer.device?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Precio Original:</p>
                        <p className="text-sm">${currentOffer.originalPrice?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Precio Ofertado:</p>
                        <p className="text-sm">${currentOffer.offerPrice?.toLocaleString()} ({Math.round((currentOffer.offerPrice / currentOffer.originalPrice) * 100)}%)</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Cantidad:</p>
                        <p className="text-sm">{currentOffer.quantity}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-start gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <p className="text-sm">
                        El cliente recibirá una notificación de rechazo de la oferta.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Razón del rechazo</Label>
                      <Textarea
                        id="reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Ej: La oferta es demasiado baja"
                      />
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={actionLoading}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleAction} disabled={actionLoading || !rejectionReason.trim()} className="gap-2">
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Rechazar Oferta
                </Button>
              </DialogFooter>
              {/* Modal para detalles de ofertas por producto */}
      <OfferDetailsModal 
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        deviceName={selectedDeviceName}
        offers={selectedDeviceOffers}
        formatDate={formatDate}
        renderStatusBadge={renderStatusBadge}
        onAccept={openAcceptDialog}
        onReject={openRejectDialog}
      />
    </>
          )}
        </DialogContent>
      </Dialog>
      {/* Modal para detalles de ofertas por producto */}
      <OfferDetailsModal 
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        deviceName={selectedDeviceName}
        offers={selectedDeviceOffers}
        formatDate={formatDate}
        renderStatusBadge={renderStatusBadge}
        onAccept={openAcceptDialog}
        onReject={openRejectDialog}
      />
    </>
  );
};
