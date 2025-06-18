import { useCart } from "@/store/cartStore"
import { Trash, ShoppingCart, Tag } from "lucide-react"
import { useState } from "react"
import { ReservationForm } from "@/components/react/ReservationForm"
import { ConfirmationModal } from "@/components/react/ConfirmationModal"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useSheetStore } from "@/store/sheetStore"

export const CartSidebar = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart()
  const { isOpen, setOpen } = useSheetStore()
  const [showReservationForm, setShowReservationForm] = useState(false)

  const total = cart.reduce((sum, item) => {
    // Usar el precio ofertado si existe, de lo contrario usar el precio original
    const price = item.offerPrice !== null ? item.offerPrice : item.price
    return sum + price * item.quantity
  }, 0)
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0)

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Carrito de Compra</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Tu carrito está vacío</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <div className="h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{item.name}</h3>
                    {item.offerPrice !== null ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-green-600" />
                          <p className="text-sm font-medium text-green-600">
                            ${item.offerPrice.toLocaleString()} <span className="text-xs">(ofertado)</span>
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground line-through">
                          Precio original: ${item.price.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">${item.price.toLocaleString()}</p>
                    )}
                    <div className="flex items-center mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      >
                        -
                      </Button>
                      <span className="mx-2 w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <ConfirmationModal
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    }
                    title="Eliminar artículo"
                    description={`¿Estás seguro de que deseas eliminar "${item.name}" del carrito?`}
                    confirmLabel="Eliminar"
                    onConfirm={() => removeFromCart(item.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t pt-4">
            {/* Resumen de productos */}
            <div className="mb-4">
              {/* Verificar si hay productos con oferta */}
              {cart.some(item => item.offerPrice !== null && item.offerPrice !== item.price) && (
                <div className="p-3 mb-3 bg-amber-50 rounded-md border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Tag className="h-4 w-4 mt-1 text-amber-600" />
                    <div>
                      <p className="font-medium text-sm">Tienes productos con ofertas</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Las ofertas quedarán pendientes hasta ser aprobadas por un administrador.
                        Solo se generará una reserva inmediata para los productos a precio de lista.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Conteo de productos por tipo */}
              <div className="flex gap-3 mb-3 text-sm">
                <div className="flex-1">
                  <p className="text-muted-foreground">Productos precio lista:</p>
                  <p className="font-medium">
                    {cart.filter(item => item.offerPrice === null || item.offerPrice === item.price).length || 0}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground">Productos con oferta:</p>
                  <p className="font-medium">
                    {cart.filter(item => item.offerPrice !== null && item.offerPrice !== item.price).length || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mb-4">
              <span className="font-semibold">Total:</span>
              <span className="font-bold">${total.toLocaleString()}</span>
            </div>

            <div className="space-y-2">
              <Button className="w-full" onClick={() => setShowReservationForm(true)}>
                Reservar Ahora
              </Button>
              <ConfirmationModal
                trigger={
                  <Button variant="outline" className="w-full">
                    Vaciar Carrito
                  </Button>
                }
                title="Vaciar carrito"
                description="¿Estás seguro de que deseas vaciar todo el carrito? Esta acción no se puede deshacer."
                confirmLabel="Vaciar"
                onConfirm={clearCart}
              />
            </div>
          </div>
        )}

        {showReservationForm && (
          <ReservationForm onClose={() => setShowReservationForm(false)} cartItems={cart} total={total} />
        )}
      </SheetContent>
    </Sheet>
  )
}

