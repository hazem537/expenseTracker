import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-navy text-gold-bright hover:bg-navy-mid',
        secondary: 'bg-gold-soft/50 text-heading hover:bg-gold-soft',
        outline: 'border border-gold-soft bg-surface text-heading hover:bg-gold-soft/40',
        ghost: 'text-heading hover:bg-gold-soft/40',
        destructive: 'bg-red-700 text-white hover:bg-red-800',
        gold: 'bg-gold text-navy hover:bg-gold-bright',
        stock: 'bg-stock text-white hover:bg-stock/90',
      },
      size: {
        default: 'h-11 px-4',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-12 rounded-xl px-5',
        icon: 'size-11',
        fab: 'size-14 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
