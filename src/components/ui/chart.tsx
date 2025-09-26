import React from "react"
import {
  Legend as RechartsPrimitiveLegend,
  ResponsiveContainer,
  Tooltip as RechartsPrimitiveTooltip,
} from "recharts"

import { cn } from "@/lib/utils"

// Chart Container
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: any
    children: React.ComponentProps<
      typeof ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, ...props }, ref) => {
  const chartContainerId = `chart-container-${id}`

  return (
    <div
      ref={ref}
      id={chartContainerId}
      className={cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve]:stroke-primary [&_.recharts-dot_path]:fill-primary [&_.recharts-legend-item_text]:text-muted-foreground [&_.recharts-polar-grid_[text-anchor=middle]]:fill-muted-foreground [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle]:fill-primary [&_.recharts-scatter-symbol]:fill-primary [&_.recharts-tooltip-cursor]:stroke-border [&_.recharts-tooltip-wrapper]:rounded-lg [&_.recharts-tooltip-wrapper]:border-border [&_.recharts-tooltip-wrapper]:bg-background [&_.recharts-tooltip-wrapper]:text-foreground",
        className
      )}
      {...props}
    >
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

// Chart Tooltip
const ChartTooltip = RechartsPrimitiveTooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    React.ComponentProps<typeof RechartsPrimitiveTooltip> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
      payload?: any[]
      label?: string | number
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelClassName,
      formatter,
      color,
      nameKey,
    },
    ref
  ) => {
    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!hideLabel ? (
          <div className={cn("font-medium", labelClassName)}>
            {label}
          </div>
        ) : null}
        <div className="grid gap-1.5">
          {payload.map((item, i) => {
            const key = `${nameKey || item.name || "value"}`
            const itemColor = color || item.color || "hsl(var(--primary))"
            const value =
              !formatter
                ? item.value
                : formatter(item.value, item.name, item, i, item.payload)

            if (item.value === null || item.value === undefined) {
              return null
            }

            return (
              <div
                key={item.key || `item-${i}`}
                className="flex items-center justify-between gap-1.5"
              >
                <div className="flex items-center gap-1.5">
                  {!hideIndicator ? (
                    <span
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-[2px]",
                        indicator === "dot" && "rounded-full",
                        indicator === "dashed" && "border-2 border-dashed",
                        className
                      )}
                      style={{
                        backgroundColor:
                          indicator !== "dashed" ? itemColor : undefined,
                        borderColor:
                          indicator === "dashed" ? itemColor : undefined,
                      }}
                    />
                  ) : null}
                  <div className="flex-1 text-muted-foreground">{key}</div>
                </div>
                <div className="font-medium text-foreground">{value}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

// Chart Legend
const ChartLegend = RechartsPrimitiveLegend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<any, "verticalAlign"> & {
      hideIcon?: boolean
      payload?: any[]
    }
>(({ className, hideIcon = false, payload, verticalAlign }, ref) => {
  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-4" : "pt-4",
        className
      )}
    >
      {(payload as any[]).map((item) => {
        return (
          <div
            key={item.value}
            className={cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            )}
          >
            {!hideIcon ? (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            ) : null}
            {item.value}
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}