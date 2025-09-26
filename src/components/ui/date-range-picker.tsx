import React, { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'

interface DateRange {
  from: Date
  to: Date
}

interface DatePickerWithRangeProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
}

export function DatePickerWithRange({ value, onChange }: DatePickerWithRangeProps) {
  const [dateRange, setDateRange] = useState<DateRange>(
    value || {
      from: new Date(new Date().setDate(new Date().getDate() - 7)),
      to: new Date()
    }
  )

  const handleSelect = (range: DateRange) => {
    setDateRange(range)
    onChange?.(range)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, 'LLL dd, y')} -{' '}
                {format(dateRange.to, 'LLL dd, y')}
              </>
            ) : (
              format(dateRange.from, 'LLL dd, y')
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">From</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={format(dateRange.from, 'yyyy-MM-dd')}
                  onChange={(e) => handleSelect({
                    ...dateRange,
                    from: new Date(e.target.value)
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">To</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={format(dateRange.to, 'yyyy-MM-dd')}
                  onChange={(e) => handleSelect({
                    ...dateRange,
                    to: new Date(e.target.value)
                  })}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSelect({
                  from: new Date(new Date().setDate(new Date().getDate() - 7)),
                  to: new Date()
                })}
              >
                Last 7 days
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSelect({
                  from: new Date(new Date().setDate(new Date().getDate() - 30)),
                  to: new Date()
                })}
              >
                Last 30 days
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}