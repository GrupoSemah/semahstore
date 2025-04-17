import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Componente modal de confirmación reutilizable para acciones que requieren confirmación
 * 
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.trigger - Elemento que activará el modal
 * @param {string} props.title - Título del modal
 * @param {string} props.description - Descripción o mensaje del modal
 * @param {string} props.confirmLabel - Texto del botón de confirmación
 * @param {string} props.cancelLabel - Texto del botón de cancelación
 * @param {Function} props.onConfirm - Función a ejecutar cuando se confirma la acción
 * @param {string} props.confirmVariant - Variante del botón de confirmación (default, destructive, etc.)
 * @returns {JSX.Element}
 */
export const ConfirmationModal = ({
  trigger,
  title = "¿Estás seguro?",
  description = "Esta acción no se puede deshacer.",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  confirmVariant = "destructive",
}) => {
  const handleConfirm = () => {
    if (typeof onConfirm === "function") {
      onConfirm();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              confirmVariant === "destructive"
                ? "bg-destructive text-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
