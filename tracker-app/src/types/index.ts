// 数据记录类型
export interface Record {
  id: number
  date: string
  silverPrice: string
  goldPrice: string
  goldSilverRatio: string
  momentum: string
  comexInventory: string
  comexEligible?: string
  comexTotal?: string
  cotCommercial: string
  cotSpeculator: string
  slvHoldings: string
  pslvHoldings?: string
  note: string
}

// 市场洞察
export interface MarketInsights {
  goldSilverRatio: {
    value: number
    percentile: number
    signal: string
    description: string
  }
  cotPositioning: {
    commercial: number
    managedMoney: number
    signal: string
    description: string
  }
  momentum: {
    score: number
    signal: string
    description: string
  }
  technical: {
    rsi: number
    sma50: number
    sma200: number
    priceVsSma50: string
    signal: string
  }
}

// 52周价格范围
export interface PriceRange {
  low: number
  high: number
  currentFromLow: string
  currentFromHigh: string
}

// 完整数据结构
export interface DataFile {
  lastUpdated: string
  source: string
  records: Omit<Record, 'id'>[]
  marketInsights: MarketInsights
  priceRange52Week: PriceRange
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
