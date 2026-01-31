import { ref, computed, onMounted } from 'vue'
import type { Record, Signal, Summary, Advice, Thresholds, MarketInsights, PriceRange, DataFile, RiskSignal, DeliveryDate } from '../types'

// 2026年COMEX白银交割日历
const deliveryCalendar2026: DeliveryDate[] = [
  { date: '2026-01-29', event: '2月合约第一通知日', risk: 'high' },
  { date: '2026-01-30', event: '2月合约第一通知日+1', risk: 'high' },
  { date: '2026-02-26', event: '2月合约最后交易日', risk: 'high' },
  { date: '2026-02-27', event: '3月合约第一通知日', risk: 'high' },
  { date: '2026-03-27', event: '3月合约最后交易日', risk: 'high' },
  { date: '2026-03-30', event: '4月合约第一通知日', risk: 'high' },
  { date: '2026-05-28', event: '5月合约最后交易日', risk: 'high' },
  { date: '2026-05-29', event: '6月合约第一通知日', risk: 'high' },
  { date: '2026-07-29', event: '7月合约最后交易日', risk: 'high' },
  { date: '2026-07-30', event: '8月合约第一通知日', risk: 'high' },
  { date: '2026-09-28', event: '9月合约最后交易日', risk: 'high' },
  { date: '2026-09-29', event: '10月合约第一通知日', risk: 'high' },
  { date: '2026-12-29', event: '12月合约最后交易日', risk: 'high' },
  { date: '2026-12-30', event: '1月合约第一通知日', risk: 'high' },
]

// 阈值设置
const thresholds: Thresholds = {
  goldSilverRatio: { bullish: 80, bearish: 50 },  // 修正：低金银比=过热=利空
  comexInventory: { bullish: 150, bearish: 120 },
  momentum: { bullish: 70, bearish: 30 },
  cotCommercial: { bullish: -50000, bearish: -20000 },
  monthlyChange: { bullish: 10, bearish: 30 },   // 月涨幅>30%=过热
  weeklyChange: { bullish: 5, bearish: 15 }      // 周涨幅>15%=过热
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

  // 检查交割窗口
  const checkDeliveryWindow = (dateStr: string): { inWindow: boolean; daysTo: number; event: string } | null => {
    const date = new Date(dateStr)
    for (const d of deliveryCalendar2026) {
      const eventDate = new Date(d.date)
      const diff = Math.floor((eventDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      if (diff >= 0 && diff <= 5) {
        return { inWindow: true, daysTo: diff, event: d.event }
      }
    }
    return null
  }

  // 计算完整风险信号
  const calculateRiskSignals = (record: Record): RiskSignal[] => {
    const signals: RiskSignal[] = []
    
    // 1. COMEX库存
    const inventory = parseFloat(record.comexInventory)
    if (inventory < thresholds.comexInventory.bearish) {
      signals.push({ name: 'COMEX库存', value: `${inventory}M`, signal: 'bearish', reason: '低于120M危险线' })
    } else if (inventory > thresholds.comexInventory.bullish) {
      signals.push({ name: 'COMEX库存', value: `${inventory}M`, signal: 'bullish', reason: '库存充足' })
    } else {
      signals.push({ name: 'COMEX库存', value: `${inventory}M`, signal: 'neutral', reason: '库存正常' })
    }

    // 2. COT变化方向
    if (record.cotChange) {
      if (record.cotChange.includes('REDUCED SHORT')) {
        signals.push({ name: 'COT商业', value: record.cotChange, signal: 'bearish', reason: '商业空头减仓，准备交割' })
      } else if (record.cotChange.includes('ADDED SHORT')) {
        signals.push({ name: 'COT商业', value: record.cotChange, signal: 'bullish', reason: '商业空头加仓' })
      }
    } else {
      const cot = parseFloat(record.cotCommercial)
      if (cot > thresholds.cotCommercial.bearish) {
        signals.push({ name: 'COT商业', value: record.cotCommercial, signal: 'bearish', reason: '空头持仓过低' })
      } else {
        signals.push({ name: 'COT商业', value: record.cotCommercial, signal: 'neutral', reason: '持仓中性' })
      }
    }

    // 3. 金银比（低=过热=利空）
    const ratio = parseFloat(record.goldSilverRatio)
    if (ratio < thresholds.goldSilverRatio.bearish) {
      signals.push({ name: '金银比', value: record.goldSilverRatio, signal: 'bearish', reason: '白银过热，<50危险' })
    } else if (ratio > thresholds.goldSilverRatio.bullish) {
      signals.push({ name: '金银比', value: record.goldSilverRatio, signal: 'bullish', reason: '白银相对便宜' })
    } else {
      signals.push({ name: '金银比', value: record.goldSilverRatio, signal: 'neutral', reason: '正常范围' })
    }

    // 4. 月涨幅
    if (record.monthlyChange) {
      const monthly = parseFloat(record.monthlyChange)
      if (monthly > thresholds.monthlyChange.bearish) {
        signals.push({ name: '月涨幅', value: `+${monthly}%`, signal: 'bearish', reason: '涨幅过大，过热' })
      } else if (monthly > thresholds.monthlyChange.bullish) {
        signals.push({ name: '月涨幅', value: `+${monthly}%`, signal: 'neutral', reason: '涨幅正常' })
      } else {
        signals.push({ name: '月涨幅', value: `+${monthly}%`, signal: 'bullish', reason: '涨幅温和' })
      }
    }

    // 5. 交割窗口
    const delivery = checkDeliveryWindow(record.date)
    if (delivery) {
      signals.push({ 
        name: '交割窗口', 
        value: `${delivery.daysTo}天后`, 
        signal: 'bearish', 
        reason: delivery.event 
      })
    }

    // 6. 动量（高动量在过热环境=利空）
    const momentum = parseFloat(record.momentum)
    const hasOverheat = signals.some(s => s.name === '月涨幅' && s.signal === 'bearish')
    if (momentum > thresholds.momentum.bullish) {
      if (hasOverheat) {
        signals.push({ name: '动量', value: `${momentum}/100`, signal: 'bearish', reason: '过热环境下高动量=追涨风险' })
      } else {
        signals.push({ name: '动量', value: `${momentum}/100`, signal: 'bullish', reason: '强势趋势' })
      }
    } else if (momentum < thresholds.momentum.bearish) {
      signals.push({ name: '动量', value: `${momentum}/100`, signal: 'bearish', reason: '弱势' })
    } else {
      signals.push({ name: '动量', value: `${momentum}/100`, signal: 'neutral', reason: '中性' })
    }

    return signals
  }

  // 计算汇总
  const calculateSummary = (record: Record): Summary => {
    const signals = calculateRiskSignals(record)
    let bullish = 0
    let bearish = 0
    signals.forEach(s => {
      if (s.signal === 'bullish') bullish++
      if (s.signal === 'bearish') bearish++
    })
    return { bullish, bearish }
  }

  // 获取操作建议
  const getAdvice = (summary: Summary): Advice => {
    const total = summary.bullish + summary.bearish
    const bearishRatio = summary.bearish / total

    if (summary.bearish >= 5) return { text: '🔴 减仓80%', class: 'bg-red-600', action: '立即减仓' }
    if (summary.bearish >= 4) return { text: '🔴 减仓50%', class: 'bg-red-500', action: '减仓' }
    if (summary.bearish >= 3) return { text: '🟡 减仓30%', class: 'bg-orange-500', action: '谨慎减仓' }
    if (summary.bullish >= 4) return { text: '🟢 可加仓', class: 'bg-green-500', action: '逢低加仓' }
    if (summary.bullish >= 3) return { text: '🟢 持有', class: 'bg-green-400', action: '持有观望' }
    return { text: '⚪ 观望', class: 'bg-yellow-400', action: '观望' }
  }

  // 导出CSV
  const exportCSV = () => {
    const headers = ['日期', '白银', '黄金', '金银比', '动量', '库存', 'COT商业', '月涨幅', '利多', '利空', '建议', '备注']
    const rows = records.value.map((r: Record) => {
      const summary = calculateSummary(r)
      const advice = getAdvice(summary)
      return [
        r.date, r.silverPrice, r.goldPrice, r.goldSilverRatio, r.momentum,
        r.comexInventory, r.cotCommercial, r.monthlyChange || '',
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
    deliveryCalendar: deliveryCalendar2026,
    calculateRiskSignals,
    calculateSummary,
    getAdvice,
    checkDeliveryWindow,
    exportCSV,
    loadData,
    latestRecord,
    priceChange
  }
}
