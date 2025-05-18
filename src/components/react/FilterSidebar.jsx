import { useState, useEffect, useCallback } from "react"
import { useStore } from "@/store/deviceStore"
import axios from "axios"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export const FilterSidebar = () => {
  const { filters, updateFilter, clearFilters } = useStore()
  const [types, setTypes] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFilters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get('/api/filters', {
        headers: {
          'x-api-key': import.meta.env.PUBLIC_API_KEY
        }
      })
      
      if (!response.data) {
        throw new Error("No se recibieron datos del servidor")
      }

      const { types: typesData, brands: brandsData } = response.data
      
      if (!Array.isArray(typesData) || !Array.isArray(brandsData)) {
        throw new Error("Los datos recibidos no tienen el formato esperado")
      }

      setTypes(typesData)
      setBrands(brandsData)
    } catch (error) {
      console.error("Error detallado:", error)
      setError(error.response?.data?.message || error.message || "Error al cargar los filtros")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFilters()
  }, [fetchFilters])

  const handleFilterChange = (name, value) => {
    if (name === "minPrice" || name === "maxPrice") {
      const numValue = value === "" ? "" : Number(value)
      
      if (value !== "" && isNaN(numValue)) {
        return
      }

      if (name === "minPrice" && filters.maxPrice !== "" && numValue > Number(filters.maxPrice)) {
        return
      }
      if (name === "maxPrice" && filters.minPrice !== "" && numValue < Number(filters.minPrice)) {
        return
      }

      updateFilter(name, numValue)
    } else {
      updateFilter(name, value)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex flex-col gap-2">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={fetchFilters} disabled={loading} className="self-end">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  "Reintentar"
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select 
            value={filters.type} 
            onValueChange={(value) => handleFilterChange("type", value)}
            disabled={loading}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Marca</Label>
          <Select 
            value={filters.brand} 
            onValueChange={(value) => handleFilterChange("brand", value)}
            disabled={loading}
          >
            <SelectTrigger id="brand">
              <SelectValue placeholder="Seleccionar marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxPrice">Precio Máximo</Label>
          <Input
            type="number"
            id="maxPrice"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
            min={filters.minPrice || "0"}
            step="any"
            placeholder="0.00"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minPrice">Precio Mínimo</Label>
          <Input
            type="number"
            id="minPrice"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange("minPrice", e.target.value)}
            min="0"
            step="any"
            placeholder="0.00"
            disabled={loading}
          />
        </div>

        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full"
          disabled={loading}
        >
          Limpiar Filtros
        </Button>
      </CardContent>
    </Card>
  )
}

