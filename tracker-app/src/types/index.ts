// 数据记录类型
export interface Record {
  id: number
  date: string
  silverPrice: string
  goldPrice: string
  goldSilverRatio: string
  momentum: string
  comexInventory: string
  cotCommercial: string
  cotSpeculator: string
  slvHoldings: string
  note: string
}

// 信号类型
export type Signal = 'bullish' | 'bearish' | 'neutral'

// 汇总类型
export interface Summary {
  bullish: number
  bearish: number
}

// 建议类型
export interface Advice {
  text: string
  class: string
}

// 阈值类型
export interface Threshold {
  bullish: number
  bearish: number
}

export interface Thresholds {
  goldSilverRatio: Threshold
  comexInventory: Threshold
  momentum: Threshold
  cotCommercial: Threshold
}
