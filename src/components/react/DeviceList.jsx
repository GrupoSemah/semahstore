import { useState, useEffect } from "react"
import { DeviceCard } from "@/components/react/DeviceCard"
import { useStore } from "@/store/deviceStore"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export const DeviceList = ({ devices }) => {

  const { filters } = useStore()
  const [filteredDevices, setFilteredDevices] = useState(devices)
  const [showOutOfStock, setShowOutOfStock] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showAll, setShowAll] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    // Resetear a la primera página cuando cambian los filtros o al activar/desactivar showAll
    if (!showAll) {
      setCurrentPage(1)
    }
    
    let result = [...devices]

    // Filtrar por búsqueda
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchTerm = filters.searchTerm.toLowerCase().trim()
      result = result.filter(device => {
        // Buscar en campos de texto
        const textMatch = (
          device.name.toLowerCase().includes(searchTerm) ||
          device.brand.toLowerCase().includes(searchTerm) ||
          device.type.toLowerCase().includes(searchTerm) ||
          device.description.toLowerCase().includes(searchTerm)
        )
        
        // Buscar por precio
        const priceAsString = device.price.toString()
        const priceMatch = priceAsString.includes(searchTerm)
        
        return textMatch || priceMatch
      })
      // Filtrado por búsqueda aplicado
    }

    // Filtrar por tipo
    if (filters.type && filters.type !== 'all') {
      result = result.filter(device => device.type === filters.type)
      // Filtrado por tipo aplicado
    }

    // Filtrar por marca
    if (filters.brand && filters.brand !== 'all') {
      result = result.filter(device => device.brand === filters.brand)
      // Filtrado por marca aplicado
    }

    // Filtrar por precio mínimo
    if (filters.minPrice !== '') {
      const minPrice = Number(filters.minPrice)
      if (!isNaN(minPrice)) {
        result = result.filter(device => device.price >= minPrice)
        // Filtrado por precio mínimo aplicado
      }
    }

    // Filtrar por precio máximo
    if (filters.maxPrice !== '') {
      const maxPrice = Number(filters.maxPrice)
      if (!isNaN(maxPrice)) {
        result = result.filter(device => device.price <= maxPrice)
        // Filtrado por precio máximo aplicado
      }
    }

    // Filtrar por stock
    if (!showOutOfStock) {
      result = result.filter(device => device.stock > 0)
      // Filtrado por stock aplicado
    }

    // Resultado final aplicando todos los filtros
    setFilteredDevices(result)
  }, [devices, filters, showOutOfStock, showAll])

  if (filteredDevices.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold">No se encontraron equipos</h2>
        <p className="mt-2 text-gray-600">Intenta cambiar los filtros de búsqueda</p>
      </div>
    )
  }

  // Calcular el total de páginas
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage)
  
  // Obtener los elementos para la página actual o todos si showAll está activado
  const currentDevices = showAll 
    ? filteredDevices 
    : filteredDevices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
  
  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      // Scroll to top cuando cambia la página
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-all"
            checked={showAll}
            onCheckedChange={(checked) => setShowAll(checked)}
          />
          <Label htmlFor="show-all" className="cursor-pointer">
            Mostrar todos los productos en una página
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="stock-filter"
            checked={!showOutOfStock}
            onCheckedChange={(checked) => setShowOutOfStock(!checked)}
          />
          <Label htmlFor="stock-filter" className="cursor-pointer">
            Mostrar solo productos con stock
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentDevices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
      
      {/* Paginación */}
      {totalPages > 1 && !showAll && (
        <div className="flex justify-center items-center mt-8 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Información de paginación */}
      {filteredDevices.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {showAll 
            ? `Mostrando todos los ${filteredDevices.length} productos en una página`
            : `Mostrando ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredDevices.length)} de ${filteredDevices.length} productos`
          }
        </div>
      )}
    </div>
  )
}

