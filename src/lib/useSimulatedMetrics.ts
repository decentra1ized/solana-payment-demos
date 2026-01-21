import { useState, useEffect } from 'react'

export interface SolanaMetrics {
  tps: number
  slot: number
  blockHeight: number
  epoch: number
  epochProgress: number
  totalTransactions: number
  activeValidators: number
  averageFee: number
  lastUpdated: Date
}

// Helper to generate random number in range
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Initial simulated values (based on typical Solana network stats)
const BASE_METRICS = {
  slot: 312847562,
  blockHeight: 293847562,
  epoch: 723,
  epochProgress: 67.4,
  totalTransactions: 348927456123,
  activeValidators: 1847,
  averageFee: 0.000005,
}

export function useSimulatedMetrics(updateInterval = 1000): SolanaMetrics {
  const [metrics, setMetrics] = useState<SolanaMetrics>(() => ({
    tps: randomInRange(2500, 3100),
    slot: BASE_METRICS.slot,
    blockHeight: BASE_METRICS.blockHeight,
    epoch: BASE_METRICS.epoch,
    epochProgress: BASE_METRICS.epochProgress,
    totalTransactions: BASE_METRICS.totalTransactions,
    activeValidators: BASE_METRICS.activeValidators,
    averageFee: BASE_METRICS.averageFee,
    lastUpdated: new Date(),
  }))

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        // TPS fluctuates between 2500-3100 with smooth transitions
        const tpsDelta = randomInRange(-150, 150)
        let newTps = prev.tps + tpsDelta
        newTps = Math.max(2500, Math.min(3100, newTps))

        // Slot increases by ~2-3 per second (Solana ~400ms block time)
        const slotIncrease = randomInRange(2, 3)

        // Block height increases similarly
        const blockIncrease = randomInRange(2, 3)

        // Total transactions increases based on TPS
        const txIncrease = newTps + randomInRange(-100, 100)

        // Epoch progress increases slowly
        const epochProgressIncrease = 0.001 + Math.random() * 0.002

        // Validators can fluctuate slightly
        const validatorChange = randomInRange(-2, 2)

        return {
          tps: newTps,
          slot: prev.slot + slotIncrease,
          blockHeight: prev.blockHeight + blockIncrease,
          epoch: prev.epoch,
          epochProgress: Math.min(100, prev.epochProgress + epochProgressIncrease),
          totalTransactions: prev.totalTransactions + txIncrease,
          activeValidators: Math.max(1800, prev.activeValidators + validatorChange),
          averageFee: BASE_METRICS.averageFee + (Math.random() - 0.5) * 0.000001,
          lastUpdated: new Date(),
        }
      })
    }, updateInterval)

    return () => clearInterval(interval)
  }, [updateInterval])

  return metrics
}

// Format number with commas
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

// Format large numbers (e.g., 348B)
export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T'
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toString()
}

// Format date with timezone
export function formatLastUpdated(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }
  return date.toLocaleString(undefined, options)
}

// Get timezone info
export function getTimezoneInfo(): string {
  const offset = new Date().getTimezoneOffset()
  const hours = Math.abs(Math.floor(offset / 60))
  const minutes = Math.abs(offset % 60)
  const sign = offset <= 0 ? '+' : '-'
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone
  return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} (${tzName})`
}
