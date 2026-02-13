'use client'

import * as React from 'react'
import { DayPicker, DayPickerProps } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CalendarProps = DayPickerProps

function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center pt-1 relative items-center w-full',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          'absolute left-1 top-0 z-10',
          'inline-flex items-center justify-center',
          'h-7 w-7 rounded-md',
          'border border-white/10 bg-transparent',
          'text-text-muted hover:text-text-primary hover:bg-white/5',
          'transition-colors'
        ),
        button_next: cn(
          'absolute right-1 top-0 z-10',
          'inline-flex items-center justify-center',
          'h-7 w-7 rounded-md',
          'border border-white/10 bg-transparent',
          'text-text-muted hover:text-text-primary hover:bg-white/5',
          'transition-colors'
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'text-text-muted rounded-md w-9 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2',
        day: cn(
          'relative p-0 text-center text-sm',
          'focus-within:relative focus-within:z-20',
          '[&:has([aria-selected])]:bg-primary-mid/20',
          '[&:has([aria-selected].day-outside)]:bg-primary-mid/10',
          '[&:has([aria-selected].day-range-end)]:rounded-r-md'
        ),
        day_button: cn(
          'inline-flex items-center justify-center',
          'h-9 w-9 rounded-md',
          'text-sm font-normal',
          'transition-colors',
          'hover:bg-primary-mid/20 hover:text-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-primary-mid focus:ring-offset-2 focus:ring-offset-bg-dark',
          'aria-selected:bg-primary-mid aria-selected:text-white aria-selected:hover:bg-primary-mid',
          'disabled:pointer-events-none disabled:opacity-50'
        ),
        range_end: 'day-range-end',
        selected:
          'bg-primary-mid text-white hover:bg-primary-mid hover:text-white focus:bg-primary-mid focus:text-white',
        today: 'bg-accent-primary/20 text-accent-primary',
        outside:
          'day-outside text-text-muted/50 aria-selected:bg-primary-mid/30 aria-selected:text-text-muted',
        disabled: 'text-text-muted/30',
        range_middle:
          'aria-selected:bg-primary-mid/20 aria-selected:text-text-primary',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
