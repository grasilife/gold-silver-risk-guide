import { ref, computed, watch, onMounted } from 'vue'
import type { Record, Signal, Summary, Advice, Thresholds } from '../types'

const STORAGE_KEY = 'gold-silver-tracker'

// 阈值设置
const thresholds: Thresholds = {
  goldSilverRatio: { bullish: 50, bearish: 80 },
  comexInventory: { bullish: 150, bearish: 120 },
  momentum: { bullish: 70, bearish: 30 },
  cotCommercial: { bullish: -50000, bearish: -20000 }
}

export function useTracker() {
  const records = ref<Record[]>([])
  const showForm = ref(false)

  // 表单初始值
  const getInitialForm = (): Omit<Record, 'id'> => ({
    date: new Date().toISOString().split('T')[0],
    silverPrice: '',
    goldPrice: '',
    goldSilverRatio: '',
    momentum: '',
    comexInventory: '',
    cotCommercial: '',
    cotSpeculator: '',
    slvHoldings: '',
    note: ''
  })

  const form = ref<Omit<Record, 'id'>>(getInitialForm())

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

  // 添加记录
  const addRecord = () => {
    const newRecord: Record = { ...form.value, id: Date.now() }
    records.value.unshift(newRecord)
    saveToLocal()
    resetForm()
    showForm.value = false
  }

  // 删除记录
  const deleteRecord = (id: number) => {
    records.value = records.value.filter(r => r.id !== id)
    saveToLocal()
  }

  // 重置表单
  const resetForm = () => {
    form.value = getInitialForm()
  }

  // 本地存储
  const saveToLocal = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
  }

  const loadFromLocal = () => {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      records.value = JSON.parse(data)
    }
  }

  // 导出CSV
  const exportCSV = () => {
    const headers = ['日期', '白银', '黄金', '金银比', '动量', '库存', 'COT商业', 'COT投机', 'SLV', '利多', '利空', '建议', '备注']
    const rows = records.value.map(r => {
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
    link.download = `金银追踪_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // 当前日期是否是周三或周五
  const isWednesday = computed(() => new Date().getDay() === 3)
  const isFriday = computed(() => new Date().getDay() === 5)

  onMounted(() => {
    loadFromLocal()
  })

  watch(records, saveToLocal, { deep: true })

  return {
    records,
    showForm,
    form,
    thresholds,
    getSignal,
    calculateSummary,
    getAdvice,
    addRecord,
    deleteRecord,
    resetForm,
    exportCSV,
    isWednesday,
    isFriday
  }
}
