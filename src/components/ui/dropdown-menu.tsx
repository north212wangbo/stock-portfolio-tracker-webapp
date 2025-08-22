"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

interface DropdownMenuContentProps {
  align?: "start" | "center" | "end"
  className?: string
  children: React.ReactNode
}

interface DropdownMenuItemProps {
  className?: string
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}

interface DropdownMenuLabelProps {
  className?: string
  children: React.ReactNode
}

interface DropdownMenuSeparatorProps {
  className?: string
}

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {}
})

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ asChild, children }) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    setOpen(!open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      "aria-expanded": open,
    } as React.HTMLAttributes<HTMLElement>)
  }

  return (
    <button onClick={handleClick} aria-expanded={open}>
      {children}
    </button>
  )
}

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  align = "center", 
  className, 
  children 
}) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  const alignmentClass = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0'
  }[align]

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        alignmentClass,
        className
      )}
    >
      {children}
    </div>
  )
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  className, 
  onClick, 
  disabled = false,
  children 
}) => {
  const { setOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    if (disabled) return
    onClick?.()
    setOpen(false)
  }

  return (
    <div
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        disabled 
          ? "pointer-events-none opacity-50" 
          : "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        className
      )}
    >
      {children}
    </div>
  )
}

const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ className }) => {
  return (
    <div
      className={cn(
        "-mx-1 my-1 h-px bg-muted",
        className
      )}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}