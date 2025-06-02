import { useCart } from "@/store/cartStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, AlertCircle, Info, DollarSign, Tag } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { useSheetStore } from "@/store/sheetStore"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const DeviceCard = ({ device }) => {
  const { addToCart } = useCart()
  const { setOpen } = useSheetStore()
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false)
  const [offerDialogOpen, setOfferDialogOpen] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [offerPrice, setOfferPrice] = useState(device.price)
  const [offerError, setOfferError] = useState('')
  const isOutOfStock = device.stock <= 0

  const handleOpenOfferDialog = () => {
    setOfferPrice(device.price)
    setOfferError('')
    setOfferDialogOpen(true)
  }

  const handleAddToCartWithOriginalPrice = () => {
    addToCart(device)
    setOpen(true)
    setOfferDialogOpen(false)
    toast.success("Producto agregado al carrito", {
      description: `${device.name} se ha agregado a tu carrito con el precio original`
    })
  }

  const validateOfferPrice = (price) => {
    const minPrice = device.price * 0.5 // 50% del precio original
    
    if (price <= 0) {
      return 'El precio debe ser mayor que cero'
    }
    
    if (price < minPrice) {
      return `El precio mínimo debe ser al menos el 50% del precio original (${minPrice.toLocaleString()} $)`
    }
    
    return ''
  }

  const handleOfferPriceChange = (e) => {
    const price = parseFloat(e.target.value)
    setOfferPrice(price)
    setOfferError(validateOfferPrice(price))
  }

  const handleAddToCartWithOffer = () => {
    const error = validateOfferPrice(offerPrice)
    if (error) {
      setOfferError(error)
      return
    }
    
    addToCart(device, offerPrice)
    setOpen(true)
    setOfferDialogOpen(false)
    toast.success("Producto con oferta agregado al carrito", {
      description: `${device.name} se ha agregado a tu carrito con una oferta de ${offerPrice.toLocaleString()} $`
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
            <Button onClick={handleOpenOfferDialog} size="sm">
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
            <div className="flex justify-between">
              <span className="font-medium">Precio:</span>
              <span>${device.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Stock disponible:</span>
              <span>{device.stock} unidad(es)</span>
            </div>
          </div>
          {!isOutOfStock && (
            <div className="flex justify-end mt-4">
              <Button onClick={handleOpenOfferDialog}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Agregar al carrito
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar al carrito</DialogTitle>
            <DialogDescription>
              Elige entre agregar el producto con su precio actual o hacer una oferta
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center"><Tag className="h-4 w-4 mr-2" />Producto</h3>
                <span>{device.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center"><DollarSign className="h-4 w-4 mr-2" />Precio actual</h3>
                <span className="font-semibold">${device.price.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="offerPrice">Tu oferta</Label>
              <div className="flex gap-2 items-center mt-1">
                <Input
                  id="offerPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={offerPrice}
                  onChange={handleOfferPriceChange}
                  className={offerError ? "border-red-500" : ""}
                />
                <span className="text-sm font-medium">$</span>
              </div>
              {offerError && (
                <p className="text-red-500 text-sm mt-1">{offerError}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Puedes ofertar un precio diferente. El precio debe ser al menos el 50% del precio original.
              </p>
            </div>

            <div className="flex justify-between gap-2 mt-2">
              <Button 
                variant="outline" 
                onClick={handleAddToCartWithOriginalPrice}
                className="flex-1"
              >
                Precio actual (${device.price.toLocaleString()})
              </Button>
              <Button 
                onClick={handleAddToCartWithOffer} 
                disabled={!!offerError || !offerPrice}
                className="flex-1"
              >
                Ofertar (${offerPrice?.toLocaleString() || 0})
              </Button>
            </div>
          </div>
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
            <div>
              <span className="font-medium">${device.price.toLocaleString()}</span>
              {device.stock <= 0 && (
                <Badge variant="destructive" className="ml-2">
                  Sin Stock
                </Badge>
              )}
              {device.stock > 0 && (
                <Badge variant="outline" className="ml-2">
                  Stock: {device.stock}
                </Badge>
              )}
            </div>
            {device.stock > 0 && (
              <Button onClick={handleOpenOfferDialog} size="sm">
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

