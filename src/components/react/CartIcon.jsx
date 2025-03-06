import { useState } from "react"
import { CartSidebar } from "@/components/react/CartSidebar"

export const CartIcon = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <CartSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

