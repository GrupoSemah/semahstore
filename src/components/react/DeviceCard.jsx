import { useCart } from "@/store/cartStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { useSheetStore } from "@/store/sheetStore"

export const DeviceCard = ({ device }) => {
  const { addToCart } = useCart()
  const { setOpen } = useSheetStore()
  const isOutOfStock = device.stock <= 0

  const handleAddToCart = () => {
    addToCart(device)
    setOpen(true)
    toast.success("Producto agregado al carrito", {
      description: `${device.name} se ha agregado a tu carrito`
    })
  }

  return (
    <Card className={`h-full flex flex-col ${isOutOfStock ? "opacity-70" : ""}`}>
      <div className="aspect-square w-full relative overflow-hidden rounded-t-lg">
        <img
          src={device.image || "/placeholder.svg"}
          alt={device.name}
          className={`w-full h-full object-contain transition-transform ${isOutOfStock ? "" : "hover:scale-102"} duration-300`}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm px-3 py-1">
              Sin Stock
            </Badge>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{device.name}</CardTitle>
          <Badge variant="outline">{device.type}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{device.brand}</p>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2">{device.description}</p>
        <div className="mt-2 flex items-center">
          <Badge variant={isOutOfStock ? "destructive" : "secondary"} className="text-xs">
            Stock: {device.stock}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2">
        <span className="text-xl font-bold">${device.price.toLocaleString()}</span>

        {isOutOfStock ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" disabled className="cursor-not-allowed">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Sin Stock
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Este producto no está disponible actualmente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button onClick={handleAddToCart} size="sm">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

