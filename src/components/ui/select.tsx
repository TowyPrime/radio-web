import * as React from "react"
import { cn } from "cn"
import { fieldClasses } from "@/components/ui/input"

// Desplegable nativo con el mismo aspecto que los demás campos (accesible y ligero)
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(fieldClasses, "h-10 py-1", className)}
      {...props}
    />
  )
}

export { Select }
