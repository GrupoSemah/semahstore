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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Loader2, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

export const ReservationView = () => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/reservations")
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

    const { reservationId, newStatus } = statusUpdateDialog
    setUpdating(true)

    try {
      const response = await fetch("/api/reservations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: reservationId,
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
        <Button onClick={fetchReservations}>Actualizar</Button>
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
                      variant={reservation.status === "pending" ? "default" : "success"}
                    >
                      {reservation.status === "pending" ? "Pendiente" : "Completada"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(reservation.total)}</TableCell>
                  <TableCell>{formatDate(reservation.createdAt)}</TableCell>
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
                          <CheckCircle2 className="h-4 w-4" />
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

      <Dialog
        open={!!selectedReservation}
        onOpenChange={() => setSelectedReservation(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Reserva</DialogTitle>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-6">
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
                            : "success"
                        }
                      >
                        {selectedReservation.status === "pending"
                          ? "Pendiente"
                          : "Completada"}
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
              className="bg-primary"
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
    </div>
  )
} 