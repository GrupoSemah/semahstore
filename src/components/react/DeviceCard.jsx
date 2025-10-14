import { useCart } from "@/store/cartStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, AlertCircle, Info, Tag, Percent } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { useSheetStore } from "@/store/sheetStore"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export const DeviceCard = ({ device }) => {
  const { addToCart } = useCart()
  const { setOpen } = useSheetStore()
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const isOutOfStock = device.stock <= 0
  
  // Calcular precio con descuento del 50%
  const discountedPrice = device.price * 0.5

  const handleAddToCart = () => {
    addToCart(device)
    setOpen(true)
    toast.success("Producto agregado al carrito", {
      description: `${device.name} se ha agregado con 50% de descuento`
    })
  }
  
  const handleOpenDescription = () => {
    setDescriptionDialogOpen(true)
  }

  return (
    <>
      <Card className={`h-full flex flex-col ${isOutOfStock ? "opacity-70" : ""}`}>
        <div 
          className="aspect-square w-full relative overflow-hidden rounded-t-lg cursor-pointer"
          onClick={() => setImageDialogOpen(true)}
        >
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
          <div 
            className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1" 
            onClick={handleOpenDescription}
          >
            <p className="line-clamp-2">{device.description}</p>
            {device.description.length > 60 && (
              <Info className="h-3 w-3 flex-shrink-0 text-muted-foreground/70" />
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={isOutOfStock ? "destructive" : "secondary"} className="text-xs">
              Stock: {device.stock}
            </Badge>
            <Badge variant="default" className="text-xs bg-[#FF6B1E] hover:bg-[#FF8C4E]">
              <Percent className="h-3 w-3 mr-1" />
              50% OFF
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center pt-2">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground line-through">${device.price.toLocaleString()}</span>
            <span className="text-xl font-bold text-[#FF6B1E]">${discountedPrice.toLocaleString()}</span>
          </div>

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
            <Button onClick={handleAddToCart} size="sm" className="bg-[#FF6B1E] hover:bg-[#FF8C4E]">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={descriptionDialogOpen} onOpenChange={setDescriptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{device.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <h4 className="font-medium mb-1">Descripción:</h4>
            <p className="text-sm text-muted-foreground">{device.description}</p>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex justify-between">
              <span className="font-medium">Marca:</span>
              <span>{device.brand}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tipo:</span>
              <span>{device.type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Precio:</span>
              <div className="flex flex-col items-end">
                <span className="text-sm text-muted-foreground line-through">${device.price.toLocaleString()}</span>
                <span className="text-lg font-bold text-[#FF6B1E]">${discountedPrice.toLocaleString()}</span>
                <Badge variant="default" className="text-xs bg-[#FF6B1E] mt-1">50% OFF</Badge>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Stock disponible:</span>
              <span>{device.stock} unidad(es)</span>
            </div>
          </div>
          {!isOutOfStock && (
            <div className="flex justify-end mt-4">
              <Button onClick={handleAddToCart} className="bg-[#FF6B1E] hover:bg-[#FF8C4E]">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Agregar al carrito
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para vista ampliada de imagen */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl h-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{device.name}</DialogTitle>
            <DialogDescription>
              {device.brand} - {device.type}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-2 h-full">
            <img
              src={device.image || "/placeholder.svg"}
              alt={device.name}
              className="w-full h-full object-contain max-h-[calc(90vh-10rem)]"
            />
          </div>
          <DialogFooter className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground line-through">${device.price.toLocaleString()}</span>
                <Badge variant="default" className="text-xs bg-[#FF6B1E]">50% OFF</Badge>
              </div>
              <span className="text-lg font-bold text-[#FF6B1E]">${discountedPrice.toLocaleString()}</span>
              {device.stock <= 0 && (
                <Badge variant="destructive" className="mt-1">
                  Sin Stock
                </Badge>
              )}
              {device.stock > 0 && (
                <Badge variant="outline" className="mt-1">
                  Stock: {device.stock}
                </Badge>
              )}
            </div>
            {device.stock > 0 && (
              <Button onClick={handleAddToCart} size="sm" className="bg-[#FF6B1E] hover:bg-[#FF8C4E]">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Agregar al carrito
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

