import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

// Clases compartidas por todos los campos de formulario (Input, Textarea y Select)
export const fieldClasses =
  "w-full min-w-0 rounded-lg border border-input bg-ink-800 px-2.5 text-sm text-white transition-colors outline-none placeholder:text-ink-400 focus-visible:border-brand-400 focus-visible:ring-3 focus-visible:ring-brand-400/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        fieldClasses,
        "h-10 py-1 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
