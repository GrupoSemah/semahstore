import { Toaster as SonnerToaster } from "sonner"

function Toaster() {
  return (
    <SonnerToaster
      expand={false}
      richColors
      closeButton
      position="top-right"
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group font-sans border-border",
          title: "text-foreground font-medium",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
    />
  )
}

export { Toaster } 