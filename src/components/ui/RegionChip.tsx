import type { Region } from '@/types'

interface RegionChipProps {
  region: Region | null
}

const REGION_LABELS: Record<Region, string> = {
  china: 'CN',
  usa: 'US',
  global: 'Global',
}

const REGION_CLASSES: Record<Region, string> = {
  china: 'chip-china',
  usa: 'chip-usa',
  global: '',
}

export function RegionChip({ region }: RegionChipProps) {
  if (!region) return null

  return (
    <span
      className={REGION_CLASSES[region]}
      style={{
        fontSize: '10px',
        padding: '2px 8px',
        borderRadius: '4px',
        letterSpacing: '0.3px',
        display: 'inline-block',
      }}
    >
      {REGION_LABELS[region]}
    </span>
  )
}
