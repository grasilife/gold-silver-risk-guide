<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// 数据状态
const records = ref([])
const showForm = ref(false)

// 表单数据
const form = ref({
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

// 阈值设置
const thresholds = {
  goldSilverRatio: { bullish: 50, bearish: 80 },
  comexInventory: { bullish: 150, bearish: 120 },
  momentum: { bullish: 70, bearish: 30 },
  cotCommercial: { bullish: -50000, bearish: -20000 }
}

// 计算信号
const getSignal = (field, value) => {
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
const calculateSummary = (record) => {
  let bullish = 0
  let bearish = 0
  
  const signals = [
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
const getAdvice = (summary) => {
  if (summary.bullish >= 4) return { text: '可加仓', class: 'bg-green-500' }
  if (summary.bearish >= 4) return { text: '应减仓', class: 'bg-red-500' }
  if (summary.bullish >= 3) return { text: '偏多观望', class: 'bg-green-300' }
  if (summary.bearish >= 3) return { text: '偏空观望', class: 'bg-red-300' }
  return { text: '观望', class: 'bg-yellow-400' }
}

// 添加记录
const addRecord = () => {
  const newRecord = { ...form.value, id: Date.now() }
  records.value.unshift(newRecord)
  saveToLocal()
  resetForm()
  showForm.value = false
}

// 删除记录
const deleteRecord = (id) => {
  records.value = records.value.filter(r => r.id !== id)
  saveToLocal()
}

// 重置表单
const resetForm = () => {
  form.value = {
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
  }
}

// 本地存储
const saveToLocal = () => {
  localStorage.setItem('gold-silver-tracker', JSON.stringify(records.value))
}

const loadFromLocal = () => {
  const data = localStorage.getItem('gold-silver-tracker')
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
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <!-- 头部 -->
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">📊 金银数据追踪</h1>
        <div class="space-x-2">
          <button @click="showForm = !showForm" class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
            {{ showForm ? '取消' : '+ 添加数据' }}
          </button>
          <button @click="exportCSV" class="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">
            导出CSV
          </button>
        </div>
      </div>

      <!-- 提醒 -->
      <div class="mb-4 p-3 bg-gray-800 rounded-lg">
        <div class="flex gap-4 text-sm">
          <span v-if="isWednesday" class="text-yellow-400">📅 今天是周三，记得查库存！</span>
          <span v-if="isFriday" class="text-yellow-400">📅 今天是周五，记得查COT！</span>
          <span class="text-gray-400">数据来源：<a href="https://silverdata.io" target="_blank" class="text-blue-400 hover:underline">silverdata.io</a></span>
        </div>
      </div>

      <!-- 添加表单 -->
      <div v-if="showForm" class="mb-6 p-4 bg-gray-800 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">添加今日数据</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">日期</label>
            <input v-model="form.date" type="date" class="w-full px-3 py-2 bg-gray-700 rounded">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">白银价格 ($)</label>
            <input v-model="form.silverPrice" type="text" placeholder="98.50" class="w-full px-3 py-2 bg-gray-700 rounded">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">黄金价格 ($)</label>
            <input v-model="form.goldPrice" type="text" placeholder="5067" class="w-full px-3 py-2 bg-gray-700 rounded">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">金银比</label>
            <input v-model="form.goldSilverRatio" type="text" placeholder="46.6" class="w-full px-3 py-2 bg-gray-700 rounded">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">动量分数</label>
            <input v-model="form.momentum" type="text" placeholder="100" class="w-full px-3 py-2 bg-gray-700 rounded">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">COMEX库存 (M)</label>
            <input v-model="form.comexInventory" type="text" placeholder="105" class="w-full px-3 py-2 bg-gray-700 rounded">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">COT商业</label>
            <input v-model="form.cotCommercial" type="text" placeholder="-21213" class="w-full px-3 py-2 bg-gray-700 rounded">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">COT投机</label>
            <input v-model="form.cotSpeculator" type="text" placeholder="7699" class="w-full px-3 py-2 bg-gray-700 rounded">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">SLV持仓 (M)</label>
            <input v-model="form.slvHoldings" type="text" placeholder="499" class="w-full px-3 py-2 bg-gray-700 rounded">
          </div>
          <div class="col-span-2 md:col-span-3">
            <label class="block text-sm text-gray-400 mb-1">备注</label>
            <input v-model="form.note" type="text" placeholder="非农日/CPI/交割窗口等" class="w-full px-3 py-2 bg-gray-700 rounded">
          </div>
        </div>
        <div class="mt-4">
          <button @click="addRecord" class="px-6 py-2 bg-green-600 rounded hover:bg-green-700">保存</button>
        </div>
      </div>

      <!-- 阈值说明 -->
      <div class="mb-4 p-3 bg-gray-800 rounded-lg text-sm">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><span class="text-gray-400">金银比:</span> <span class="text-green-400">&lt;50利多</span> / <span class="text-red-400">&gt;80利空</span></div>
          <div><span class="text-gray-400">库存:</span> <span class="text-green-400">&gt;150M利多</span> / <span class="text-red-400">&lt;120M利空</span></div>
          <div><span class="text-gray-400">动量:</span> <span class="text-green-400">&gt;70利多</span> / <span class="text-red-400">&lt;30利空</span></div>
          <div><span class="text-gray-400">COT商业:</span> <span class="text-green-400">&lt;-50K利多</span> / <span class="text-red-400">&gt;-20K利空</span></div>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-800">
            <tr>
              <th class="px-3 py-2 text-left">日期</th>
              <th class="px-3 py-2 text-right">白银</th>
              <th class="px-3 py-2 text-right">黄金</th>
              <th class="px-3 py-2 text-right">金银比</th>
              <th class="px-3 py-2 text-right">动量</th>
              <th class="px-3 py-2 text-right">库存</th>
              <th class="px-3 py-2 text-right">COT商业</th>
              <th class="px-3 py-2 text-center">利多</th>
              <th class="px-3 py-2 text-center">利空</th>
              <th class="px-3 py-2 text-center">建议</th>
              <th class="px-3 py-2 text-left">备注</th>
              <th class="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in records" :key="record.id" class="border-b border-gray-700 hover:bg-gray-800">
              <td class="px-3 py-2">{{ record.date }}</td>
              <td class="px-3 py-2 text-right">${{ record.silverPrice }}</td>
              <td class="px-3 py-2 text-right">${{ record.goldPrice }}</td>
              <td class="px-3 py-2 text-right" :class="{
                'text-green-400': getSignal('goldSilverRatio', record.goldSilverRatio) === 'bullish',
                'text-red-400': getSignal('goldSilverRatio', record.goldSilverRatio) === 'bearish'
              }">{{ record.goldSilverRatio }}</td>
              <td class="px-3 py-2 text-right" :class="{
                'text-green-400': getSignal('momentum', record.momentum) === 'bullish',
                'text-red-400': getSignal('momentum', record.momentum) === 'bearish'
              }">{{ record.momentum }}</td>
              <td class="px-3 py-2 text-right" :class="{
                'text-green-400': getSignal('comexInventory', record.comexInventory) === 'bullish',
                'text-red-400': getSignal('comexInventory', record.comexInventory) === 'bearish'
              }">{{ record.comexInventory }}M</td>
              <td class="px-3 py-2 text-right" :class="{
                'text-green-400': getSignal('cotCommercial', record.cotCommercial) === 'bullish',
                'text-red-400': getSignal('cotCommercial', record.cotCommercial) === 'bearish'
              }">{{ record.cotCommercial }}</td>
              <td class="px-3 py-2 text-center">
                <span class="px-2 py-1 bg-green-600 rounded">{{ calculateSummary(record).bullish }}</span>
              </td>
              <td class="px-3 py-2 text-center">
                <span class="px-2 py-1 bg-red-600 rounded">{{ calculateSummary(record).bearish }}</span>
              </td>
              <td class="px-3 py-2 text-center">
                <span class="px-2 py-1 rounded text-black" :class="getAdvice(calculateSummary(record)).class">
                  {{ getAdvice(calculateSummary(record)).text }}
                </span>
              </td>
              <td class="px-3 py-2 text-gray-400">{{ record.note }}</td>
              <td class="px-3 py-2">
                <button @click="deleteRecord(record.id)" class="text-red-400 hover:text-red-300">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 空状态 -->
      <div v-if="records.length === 0" class="text-center py-10 text-gray-500">
        <p>还没有数据，点击"添加数据"开始记录</p>
      </div>

      <!-- 底部说明 -->
      <div class="mt-6 p-4 bg-gray-800 rounded-lg text-sm text-gray-400">
        <h3 class="font-semibold text-white mb-2">📱 使用说明</h3>
        <ul class="list-disc list-inside space-y-1">
          <li>每天：记录价格、金银比、动量（2分钟）</li>
          <li>周三：重点记录COMEX库存</li>
          <li>周五：重点记录COT持仓</li>
          <li>数据保存在浏览器本地，不会丢失</li>
          <li>可导出CSV备份</li>
        </ul>
      </div>
    </div>
  </div>
</template>
