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
  cotChange?: string  // 新增：COT变化方向
  cotSpeculator: string
  slvHoldings: string
  pslvHoldings?: string
  monthlyChange?: string  // 新增：月涨幅
  weeklyChange?: string   // 新增：周涨幅
  deliveryWindow?: string // 新增：交割窗口状态
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
    change?: string  // 新增：REDUCED SHORT / ADDED SHORT
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

// 交割日历
export interface DeliveryDate {
  date: string
  event: string
  risk: 'high' | 'medium' | 'low'
}

// 完整数据结构
export interface DataFile {
  lastUpdated: string
  source: string
  records: Omit<Record, 'id'>[]
  marketInsights: MarketInsights
  priceRange52Week: PriceRange
  deliveryCalendar?: DeliveryDate[]
}

// 信号类型
export type Signal = 'bullish' | 'bearish' | 'neutral'

// 风险信号
export interface RiskSignal {
  name: string
  value: string
  signal: Signal
  reason: string
}

// 汇总类型
export interface Summary {
  bullish: number
  bearish: number
}

// 建议类型
export interface Advice {
  text: string
  class: string
  action?: string
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
  monthlyChange: Threshold
  weeklyChange: Threshold
}
