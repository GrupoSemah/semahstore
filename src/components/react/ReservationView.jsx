import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, Eye, Tag } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExportReservations } from "@/components/export/ExportReservations"

export const ReservationView = () => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(null)
  const [cancelDialog, setCancelDialog] = useState(null)
  const [cancelReason, setCancelReason] = useState("")
  const [updating, setUpdating] = useState(false)
  const [csrfToken, setCsrfToken] = useState(null)

  useEffect(() => {
    fetchReservations()
  }, [])

  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await fetch('/api/csrf', {
          headers: {
            'x-api-key': import.meta.env.PUBLIC_API_KEY
          }
        })
        const data = await response.json()
        if (data && data.token) {
          setCsrfToken(data.token)
        } else {
          console.error("No se pudo obtener el token CSRF")
        }
      } catch (error) {
        console.error("Error al obtener token CSRF:", error)
      }
    }
    
    fetchCSRFToken()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/reservations", {
        headers: {
          'x-api-key': import.meta.env.PUBLIC_API_KEY
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al obtener las reservas")
      }

      setReservations(data)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!statusUpdateDialog) return
    if (!csrfToken) {
      toast.error("Error de seguridad: No se pudo obtener el token CSRF")
      return
    }

    const { reservationId, newStatus } = statusUpdateDialog
    setUpdating(true)

    try {
      const response = await fetch("/api/reservations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({
          reservationId: reservationId,
          status: newStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al actualizar el estado")
      }

      // Actualizar la lista de reservas
      setReservations((prevReservations) =>
        prevReservations.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status: newStatus }
            : reservation
        )
      )

      toast.success("Estado actualizado correctamente")
    } catch (error) {
      console.error("Error:", error)
      toast.error(error.message || "Error al actualizar el estado")
    } finally {
      setUpdating(false)
      setStatusUpdateDialog(null)
    }
  }
  
  const handleCancelReservation = async () => {
    if (!cancelDialog) return
    if (!csrfToken) {
      toast.error("Error de seguridad: No se pudo obtener el token CSRF")
      return
    }

    const { reservationId } = cancelDialog
    setUpdating(true)

    try {
      const response = await fetch("/api/reservations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({
          reservationId: reservationId,
          status: "canceled",
          cancellationReason: cancelReason.trim() || "Sin justificación",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al cancelar la reserva")
      }

      // Actualizar la lista de reservas
      setReservations((prevReservations) =>
        prevReservations.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status: "canceled", cancellationReason: cancelReason }
            : reservation
        )
      )

      toast.success("Reserva cancelada correctamente")
    } catch (error) {
      console.error("Error:", error)
      toast.error(error.message || "Error al cancelar la reserva")
    } finally {
      setUpdating(false)
      setCancelDialog(null)
      setCancelReason('')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  const formatCurrency = (amount) => {
    return amount.toLocaleString("es-ES", {
      style: "currency",
      currency: "USD",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reservas</h2>
        <div className="flex gap-2">
          <ExportReservations reservations={reservations} />
          <Button onClick={fetchReservations}>Actualizar</Button>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No hay reservas registradas</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell className="font-mono">{reservation.code}</TableCell>
                  <TableCell>{reservation.customerName}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{reservation.customerEmail}</div>
                      <div className="text-muted-foreground">
                        {reservation.customerPhone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        reservation.status === "pending" 
                          ? "default" 
                          : reservation.status === "completed"
                            ? "success"
                            : "destructive"
                      }
                    >
                      {reservation.status === "pending" 
                        ? "Pendiente" 
                        : reservation.status === "completed"
                          ? "Completada"
                          : "Cancelada"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(reservation.total)}</TableCell>
                  <TableCell>{formatDate(reservation.createdAt)}</TableCell>
                  <TableCell>
                    {reservation.offerId ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Tag size={12} /> Oferta
                      </Badge>
                    ) : (
                      <Badge variant="outline">Precio de lista</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedReservation(reservation)}
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {reservation.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setStatusUpdateDialog({
                                reservationId: reservation.id,
                                newStatus: "completed",
                                code: reservation.code,
                              })
                            }
                            title="Marcar como completada"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setCancelDialog({
                                reservationId: reservation.id,
                                code: reservation.code,
                              })
                            }
                            title="Cancelar reserva"
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!selectedReservation}
        onOpenChange={() => setSelectedReservation(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalles de la Reserva
              {selectedReservation?.offerId && (
                <Badge variant="secondary" className="ml-2 flex items-center gap-1 text-xs">
                  <Tag size={12} /> Oferta aceptada
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Información detallada de la reserva seleccionada.
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-6 relative">
              {selectedReservation.status === "completed" ? (
                <div className="absolute inset-0 flex items-center justify-center z-10 overflow-hidden pointer-events-none">
                  <div className="relative w-full h-full">
                    <div 
                      className="absolute transform rotate-[-35deg] bg-green-600/20 text-green-700 text-7xl font-extrabold tracking-wider uppercase flex items-center justify-center w-[150%] py-3"
                      style={{ 
                        top: '50%', 
                        left: '-25%', 
                        borderTop: '2px solid #16a34a',
                        borderBottom: '2px solid #16a34a',
                        textShadow: '2px 2px 4px rgba(0,128,0,0.2)',
                        fontFamily: '"Impact", "Arial Black", sans-serif'
                      }}
                    >
                      PAGADO
                    </div>
                  </div>
                </div>
              ) : selectedReservation.status === "canceled" ? (
                <div className="absolute inset-0 flex items-center justify-center z-10 overflow-hidden pointer-events-none">
                  <div className="relative w-full h-full">
                    <div 
                      className="absolute transform rotate-[-35deg] bg-red-600/20 text-white text-7xl font-extrabold tracking-wider uppercase flex items-center justify-center w-[150%] py-3"
                      style={{ 
                        top: '50%', 
                        left: '-25%', 
                        borderTop: '2px solid #dc2626',
                        borderBottom: '2px solid #dc2626',
                        textShadow: '2px 2px 4px rgba(220,38,38,0.2)',
                        fontFamily: '"Impact", "Arial Black", sans-serif'
                      }}
                    >
                      CANCELADO
                    </div>
                  </div>
                </div>
              ) : null}  
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Información del Cliente</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Nombre:</span>{" "}
                      {selectedReservation.customerName}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      {selectedReservation.customerEmail}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Teléfono:</span>{" "}
                      {selectedReservation.customerPhone}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Detalles de la Reserva</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Código:</span>{" "}
                      <code className="font-mono">{selectedReservation.code}</code>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Fecha:</span>{" "}
                      {formatDate(selectedReservation.createdAt)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Estado:</span>{" "}
                      <Badge
                        variant={
                          selectedReservation.status === "pending"
                            ? "default"
                            : selectedReservation.status === "completed"
                              ? "success"
                              : "destructive"
                        }
                      >
                        {selectedReservation.status === "pending"
                          ? "Pendiente"
                          : selectedReservation.status === "completed"
                            ? "Completada"
                            : "Cancelada"}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Productos Reservados</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReservation.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.device.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-right font-semibold"
                      >
                        Total:
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(selectedReservation.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {selectedReservation.comments && (
                <div>
                  <h4 className="font-semibold mb-2">Comentarios</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedReservation.comments}
                  </p>
                </div>
              )}
              
              {selectedReservation.cancellationReason && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Motivo de cancelación</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedReservation.cancellationReason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!statusUpdateDialog}
        onOpenChange={(open) => !open && setStatusUpdateDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas marcar la reserva {statusUpdateDialog?.code} como completada?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdate}
              disabled={updating}
              className="bg-primary text-white"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog
        open={!!cancelDialog}
        onOpenChange={(open) => {
          if (!open) {
            setCancelDialog(null);
            setCancelReason('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar reserva</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por cancelar la reserva {cancelDialog?.code}. Esta acción devolverá los productos al inventario.
              Por favor, ingresa un motivo para la cancelación:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="cancel-reason" className="mb-2 block">Motivo de cancelación:</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ingresa el motivo por el cual se cancela esta reserva"
              className="resize-none"
              rows={3}
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelReservation}
              disabled={updating}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar cancelación"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 