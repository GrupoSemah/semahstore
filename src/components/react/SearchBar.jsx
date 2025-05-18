import { useState, useEffect } from "react"
import { useStore } from "@/store/deviceStore"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export const SearchBar = () => {
  const { filters, updateFilter } = useStore()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Sincronizar el estado local con el store
    setSearchTerm(filters.searchTerm)
  }, [filters.searchTerm])

  const handleSearch = (value) => {
    setSearchTerm(value)
    updateFilter("searchTerm", value)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        placeholder="Buscar por nombre, marca, tipo..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 w-full"
      />
    </div>
  )
} 