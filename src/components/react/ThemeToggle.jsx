import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export const ThemeToggle = () => {
  // Usar una inicialización segura para SSR
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState("light")

  // Solo ejecutar en el cliente después del montaje
  useEffect(() => {
    setMounted(true)
    // Cargar el tema del localStorage después de montar el componente
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)

    // Aplicar el tema en el documento
    const root = window.document.documentElement
    if (savedTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [])

  // Actualizar el tema cuando cambia
  useEffect(() => {
    if (!mounted) return
    
    const root = window.document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme, mounted])

  // Durante el SSR, renderizar un botón con estado por defecto
  // para evitar discrepancias entre servidor y cliente
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        title="Cambiar tema"
      >
        <Moon className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      title={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  )
} 