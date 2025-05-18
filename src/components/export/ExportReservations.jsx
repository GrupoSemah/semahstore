import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown } from "lucide-react";

export function ExportReservations({ reservations }) {
  const [exporting, setExporting] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-DO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(amount);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Importar dinámicamente la biblioteca xlsx para evitar problemas de SSR
      const XLSX = await import("xlsx");
      
      // Preparar los datos para Excel
      const data = reservations.map((reservation) => {
        // Lista de productos como string
        const products = reservation.items
          .map((item) => `${item.device.name} (${item.quantity} x ${formatCurrency(item.price)})`)
          .join("\n");
        
        return {
          "Código": reservation.code,
          "Fecha": formatDate(reservation.createdAt),
          "Cliente": reservation.customerName,
          "Email": reservation.customerEmail,
          "Teléfono": reservation.customerPhone,
          "Estado": reservation.status === "pending" 
            ? "Pendiente" 
            : reservation.status === "completed" 
              ? "Completada" 
              : "Cancelada",
          "Total": formatCurrency(reservation.total),
          "Productos": products,
          "Comentarios": reservation.comments || "",
          "Razón de Cancelación": reservation.status === "canceled" ? (reservation.cancellationReason || "") : "",
        };
      });
      
      // Crear hoja de trabajo
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Ajustar el ancho de las columnas
      const columnWidths = [
        { wch: 15 }, // Código
        { wch: 20 }, // Fecha
        { wch: 25 }, // Cliente
        { wch: 25 }, // Email
        { wch: 15 }, // Teléfono
        { wch: 15 }, // Estado
        { wch: 15 }, // Total
        { wch: 50 }, // Productos
        { wch: 30 }, // Comentarios
        { wch: 30 }, // Razón de Cancelación
      ];
      worksheet["!cols"] = columnWidths;
      
      // Crear libro
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reservas");
      
      // Generar archivo y descargarlo
      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `Reservas_SEMAH_${today}.xlsx`);
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      alert("Hubo un error al exportar las reservas. Por favor, intenta de nuevo.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exporting || reservations.length === 0}
      className="flex items-center gap-2"
      variant="outline"
    >
      {exporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Exportar a Excel
        </>
      )}
    </Button>
  );
}
