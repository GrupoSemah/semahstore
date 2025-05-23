import { useState, useEffect } from "react"
import { DeviceCard } from "@/components/react/DeviceCard"
import { useStore } from "@/store/deviceStore"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export const DeviceList = ({ devices }) => {
  const { filters } = useStore()
  const [filteredDevices, setFilteredDevices] = useState(devices)
  const [showOutOfStock, setShowOutOfStock] = useState(true)

  useEffect(() => {
    let result = [...devices]

    // Filtrar por búsqueda
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchTerm = filters.searchTerm.toLowerCase().trim()
      result = result.filter(device => 
        device.name.toLowerCase().includes(searchTerm) ||
        device.brand.toLowerCase().includes(searchTerm) ||
        device.type.toLowerCase().includes(searchTerm) ||
        device.description.toLowerCase().includes(searchTerm)
      )
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
  }, [devices, filters, showOutOfStock])

  if (filteredDevices.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold">No se encontraron equipos</h2>
        <p className="mt-2 text-gray-600">Intenta cambiar los filtros de búsqueda</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center space-x-2">
        <Switch
          id="stock-filter"
          checked={!showOutOfStock}
          onCheckedChange={(checked) => setShowOutOfStock(!checked)}
        />
        <Label htmlFor="stock-filter" className="cursor-pointer">
          Mostrar solo productos con stock
        </Label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </div>
  )
}

