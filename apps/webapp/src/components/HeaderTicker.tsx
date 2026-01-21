import { useBtcPrice } from "@/hooks/useBtcPrice"
import { useEpochCountdown } from "@/hooks/useEpochCountdown"
import { useRpcHealth } from "@/hooks/useRpcHealth"
import { useEffect, useState } from "react"

const CYCLE_INTERVAL_MS = 4000 // 4 seconds per metric
const MEZO_PLACEHOLDER_PRICE = 0.22

type TickerMetric = {
  id: string
  label: string
  value: string
  icon?: string
  statusColor?: string
}

function formatPrice(price: number | null): string {
  if (price === null) return "—"

  if (price >= 1000) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
}

function TickerItem({
  metric,
  animationClass,
}: {
  metric: TickerMetric
  animationClass?: string
}): JSX.Element {
  return (
    <div
      className={`absolute inset-0 flex items-center gap-2 ${animationClass ?? ""}`}
    >
      {metric.icon && (
        <img
          src={metric.icon}
          alt={metric.label}
          width={20}
          height={20}
          className="h-5 w-5 rounded-full"
        />
      )}
      {metric.statusColor && (
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: metric.statusColor,
            boxShadow: `0 0 6px ${metric.statusColor}`,
          }}
        />
      )}
      <span className="whitespace-nowrap font-mono text-xs text-[var(--content-secondary)]">
        {metric.label}
      </span>
      <span className="whitespace-nowrap font-mono text-xs tabular-nums text-[#F7931A]">
        {metric.value}
      </span>
    </div>
  )
}

export function HeaderTicker(): JSX.Element {
  const { price: btcPrice, isLoading: btcLoading } = useBtcPrice()
  const { timeRemaining } = useEpochCountdown()
  const { status: rpcStatus } = useRpcHealth()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "connected":
        return "#22C55E"
      case "delayed":
        return "#EAB308"
      case "disconnected":
        return "#EF4444"
      default:
        return "#22C55E"
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "connected":
        return "Synced"
      case "delayed":
        return "Delayed"
      case "disconnected":
        return "Offline"
      default:
        return "Synced"
    }
  }

  const metrics: TickerMetric[] = [
    {
      id: "mezo",
      label: "$MEZO",
      value: `$${formatPrice(MEZO_PLACEHOLDER_PRICE)}`,
      icon: "/token icons/Mezo.svg",
    },
    {
      id: "btc",
      label: "$BTC",
      value: btcLoading ? "..." : `$${formatPrice(btcPrice)}`,
      icon: "/token icons/Bitcoin.svg",
    },
    {
      id: "epoch",
      label: "Epoch",
      value: timeRemaining,
    },
    {
      id: "rpc",
      label: "RPC",
      value: getStatusLabel(rpcStatus),
      statusColor: getStatusColor(rpcStatus),
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setPrevIndex(currentIndex)

      // After transition starts, update to next index
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % metrics.length)
      }, 50)

      // Reset transition state after animation completes
      setTimeout(() => {
        setIsTransitioning(false)
        setPrevIndex(null)
      }, 400)
    }, CYCLE_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [currentIndex, metrics.length])

  const safeCurrentIndex = currentIndex % metrics.length
  const currentMetric: TickerMetric = metrics[safeCurrentIndex] as TickerMetric
  const prevMetric: TickerMetric | null =
    prevIndex !== null
      ? (metrics[prevIndex % metrics.length] as TickerMetric)
      : null

  return (
    <div className="flex items-center">
      {/* Orange accent bar */}
      <div className="mr-3 h-6 w-0.5 bg-[#F7931A]" />

      {/* Ticker container - fixed width to prevent layout shift */}
      <div className="relative h-5 w-[180px] overflow-hidden">
        {/* Previous item sliding out */}
        {isTransitioning && prevMetric && (
          <TickerItem metric={prevMetric} animationClass="ticker-slide-out" />
        )}

        {/* Current item */}
        <TickerItem
          metric={currentMetric}
          animationClass={isTransitioning ? "ticker-slide-in" : ""}
        />
      </div>
    </div>
  )
}
