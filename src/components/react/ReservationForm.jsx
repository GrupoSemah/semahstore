import { useState, useEffect } from "react"
import { Check, AlertCircle, Loader2 } from "lucide-react"
import { useCart } from "@/store/cartStore"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSheetStore } from "@/store/sheetStore"

export const ReservationForm = ({ onClose, cartItems, total }) => {
  const { clearCart, validateCart } = useCart()
  const { setOpen } = useSheetStore()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    comments: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reservationCode, setReservationCode] = useState(null)
  const [error, setError] = useState(null)
  const [stockValidation, setStockValidation] = useState({ valid: true, invalidItems: [] })
  const [isOpen, setIsOpen] = useState(true)
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    const validateStock = async () => {
      setIsValidating(true)
      try {
        const validation = await validateCart()
        setStockValidation(validation)
      } catch (err) {
        console.error("Error validating stock:", err)
        setError("Error al validar el stock disponible")
      } finally {
        setIsValidating(false)
      }
    }

    validateStock()
  }, [validateCart])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const reservationData = {
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          comments: formData.comments,
        },
        items: cartItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
      }

      console.log("Enviando datos:", reservationData)

      // Usar axios en lugar de fetch
      const response = await axios.post("/api/reservations", reservationData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      console.log("Respuesta:", response.data)

      if (!response.data.success) {
        throw new Error(response.data.message || "Error al procesar la reserva")
      }

      setReservationCode(response.data.reservationCode)
      clearCart()
    } catch (error) {
      console.error("Error detallado:", error)
      setError(error.message || "Error al procesar la reserva")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (reservationCode) {
      setOpen(false)
      onClose()
      window.location.href = "/"
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{reservationCode ? "Reserva Completada" : "Completar Reserva"}</DialogTitle>
          {!reservationCode && <DialogDescription>Completa tus datos para finalizar la reserva</DialogDescription>}
        </DialogHeader>

        {isValidating ? (
          <div className="text-center py-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Validando disponibilidad de stock...</p>
          </div>
        ) : reservationCode ? (
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">¡Reserva Exitosa!</h3>
            <p className="mb-4">Tu código de reserva es:</p>
            <div className="bg-muted p-3 rounded-md text-center text-xl font-mono mb-4">{reservationCode}</div>
            <p className="text-sm text-muted-foreground">
              Hemos enviado los detalles de tu reserva a tu correo electrónico. Guarda este código para futuras
              referencias.
            </p>
            <Button onClick={handleClose} className="mt-6">
              Cerrar
            </Button>
          </div>
        ) : !stockValidation.valid ? (
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de Stock</AlertTitle>
              <AlertDescription>
                No hay suficiente stock para completar tu reserva. Por favor, revisa tu carrito.
              </AlertDescription>
            </Alert>

            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Productos con problemas de stock:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {stockValidation.invalidItems.map((item) => (
                  <li key={item.id}>
                    {item.name} - Solicitado: {item.requestedQuantity}, Disponible: {item.availableStock}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleClose}>Volver al Carrito</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ingresa tu nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Tu número de teléfono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comentarios (opcional)</Label>
              <Textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows="3"
                placeholder="Agrega cualquier comentario adicional"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar Reserva"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

