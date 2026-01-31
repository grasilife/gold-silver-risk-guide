import { ref, computed, onMounted } from 'vue'
import type { Record, Signal, Summary, Advice, Thresholds, MarketInsights, PriceRange, DataFile } from '../types'

// 阈值设置
const thresholds: Thresholds = {
  goldSilverRatio: { bullish: 50, bearish: 80 },
  comexInventory: { bullish: 150, bearish: 120 },
  momentum: { bullish: 70, bearish: 30 },
  cotCommercial: { bullish: -50000, bearish: -20000 }
}

export function useTracker() {
  const records = ref<Record[]>([])
  const lastUpdated = ref('')
  const source = ref('')
  const loading = ref(true)
  const error = ref('')
  const marketInsights = ref<MarketInsights | null>(null)
  const priceRange = ref<PriceRange | null>(null)

  // 从JSON文件加载数据
  const loadData = async () => {
    loading.value = true
    error.value = ''
    try {
      const response = await fetch('/data.json')
      if (!response.ok) throw new Error('加载数据失败')
      const data: DataFile = await response.json()
      records.value = data.records.map((r, index: number) => ({
        ...r,
        id: index
      }))
      lastUpdated.value = data.lastUpdated
      source.value = data.source || 'silverdata.io'
      marketInsights.value = data.marketInsights || null
      priceRange.value = data.priceRange52Week || null
    } catch (e) {
      error.value = e instanceof Error ? e.message : '未知错误'
    } finally {
      loading.value = false
    }
  }

  // 计算信号
  const getSignal = (field: keyof Thresholds, value: string): Signal => {
    if (!value || value === '') return 'neutral'
    const num = parseFloat(value.toString().replace('M', ''))
    const t = thresholds[field]
    if (!t) return 'neutral'

    if (field === 'goldSilverRatio') {
      if (num < t.bullish) return 'bullish'
      if (num > t.bearish) return 'bearish'
    } else if (field === 'comexInventory') {
      if (num > t.bullish) return 'bullish'
      if (num < t.bearish) return 'bearish'
    } else if (field === 'momentum') {
      if (num > t.bullish) return 'bullish'
      if (num < t.bearish) return 'bearish'
    } else if (field === 'cotCommercial') {
      if (num < t.bullish) return 'bullish'
      if (num > t.bearish) return 'bearish'
    }
    return 'neutral'
  }

  // 计算汇总
  const calculateSummary = (record: Record): Summary => {
    let bullish = 0
    let bearish = 0

    const signals: Signal[] = [
      getSignal('goldSilverRatio', record.goldSilverRatio),
      getSignal('comexInventory', record.comexInventory),
      getSignal('momentum', record.momentum),
      getSignal('cotCommercial', record.cotCommercial)
    ]

    signals.forEach(s => {
      if (s === 'bullish') bullish++
      if (s === 'bearish') bearish++
    })

    return { bullish, bearish }
  }

  // 获取操作建议
  const getAdvice = (summary: Summary): Advice => {
    if (summary.bullish >= 4) return { text: '可加仓', class: 'bg-green-500' }
    if (summary.bearish >= 4) return { text: '应减仓', class: 'bg-red-500' }
    if (summary.bullish >= 3) return { text: '偏多观望', class: 'bg-green-300' }
    if (summary.bearish >= 3) return { text: '偏空观望', class: 'bg-red-300' }
    return { text: '观望', class: 'bg-yellow-400' }
  }

  // 导出CSV
  const exportCSV = () => {
    const headers = ['日期', '白银', '黄金', '金银比', '动量', '库存', 'COT商业', 'COT投机', 'SLV', '利多', '利空', '建议', '备注']
    const rows = records.value.map((r: Record) => {
      const summary = calculateSummary(r)
      const advice = getAdvice(summary)
      return [
        r.date, r.silverPrice, r.goldPrice, r.goldSilverRatio, r.momentum,
        r.comexInventory, r.cotCommercial, r.cotSpeculator, r.slvHoldings,
        summary.bullish, summary.bearish, advice.text, r.note
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `金银追踪_${new Date().toISOString().split('T')[0] ?? ''}.csv`
    link.click()
  }

  // 当前日期是否是周三或周五
  const isWednesday = computed(() => new Date().getDay() === 3)
  const isFriday = computed(() => new Date().getDay() === 5)

  // 最新记录
  const latestRecord = computed(() => records.value[0] || null)

  // 价格变化
  const priceChange = computed(() => {
    if (records.value.length < 2) return null
    const today = parseFloat(records.value[0]?.silverPrice || '0')
    const yesterday = parseFloat(records.value[1]?.silverPrice || '0')
    if (!today || !yesterday) return null
    const change = today - yesterday
    const percent = (change / yesterday) * 100
    return { change, percent }
  })

  onMounted(() => {
    loadData()
  })

  return {
    records,
    lastUpdated,
    source,
    loading,
    error,
    thresholds,
    marketInsights,
    priceRange,
    getSignal,
    calculateSummary,
    getAdvice,
    exportCSV,
    loadData,
    isWednesday,
    isFriday,
    latestRecord,
    priceChange
  }
}
