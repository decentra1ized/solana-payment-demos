import * as React from "react"
import { cn } from "@/lib/utils"

export interface StableInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onValueChange: (value: string) => void
}

/**
 * StableInput - An input that manages its own local state to prevent
 * focus loss during parent component re-renders.
 * Uses onBlur and Enter key to sync value back to parent.
 */
const StableInput = React.forwardRef<HTMLInputElement, StableInputProps>(
  ({ className, type, value, onValueChange, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(value)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Sync from parent when value changes externally
    React.useEffect(() => {
      if (document.activeElement !== inputRef.current) {
        setLocalValue(value)
      }
    }, [value])

    const syncValue = () => {
      if (localValue !== value) {
        onValueChange(localValue)
      }
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={(node) => {
          (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value)
          // Immediately sync for number inputs
          if (type === 'number') {
            onValueChange(e.target.value)
          }
        }}
        onBlur={syncValue}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            syncValue()
          }
        }}
        {...props}
      />
    )
  }
)
StableInput.displayName = "StableInput"

export { StableInput }
