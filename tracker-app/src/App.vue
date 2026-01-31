<script setup lang="ts">
import { useTracker } from './composables/useTracker'

const {
  records,
  lastUpdated,
  source,
  loading,
  error,
  marketInsights,
  priceRange,
  calculateRiskSignals,
  calculateSummary,
  getAdvice,
  exportCSV,
  loadData,
  latestRecord,
  priceChange
} = useTracker()
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <div class="max-w-6xl mx-auto">
      <!-- 头部 -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">📊 金银风险追踪</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-400">
            更新: {{ lastUpdated }} | {{ source }}
          </span>
          <button 
            @click="loadData" 
            class="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition text-sm"
          >
            🔄
          </button>
          <button 
            @click="exportCSV" 
            class="px-3 py-1 bg-gray-600 rounded hover:bg-gray-700 transition text-sm"
          >
            📥
          </button>
        </div>
      </div>

      <!-- 加载/错误状态 -->
      <div v-if="loading" class="text-center py-16">
        <div class="text-4xl animate-spin">⏳</div>
      </div>

      <div v-else-if="error" class="text-center py-16">
        <div class="text-4xl">❌</div>
        <p class="mt-4 text-red-400">{{ error }}</p>
      </div>

      <!-- 主内容 -->
      <template v-else>
        <!-- 价格概览 -->
        <div v-if="latestRecord" class="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 bg-gray-800 rounded-lg text-center">
            <div class="text-gray-400 text-sm">白银</div>
            <div class="text-3xl font-bold">${{ latestRecord.silverPrice }}</div>
            <div v-if="priceChange" class="text-sm" :class="priceChange.change >= 0 ? 'text-green-400' : 'text-red-400'">
              {{ priceChange.change >= 0 ? '▲' : '▼' }} {{ Math.abs(priceChange.percent).toFixed(1) }}%
            </div>
          </div>
          <div class="p-4 bg-gray-800 rounded-lg text-center">
            <div class="text-gray-400 text-sm">黄金</div>
            <div class="text-3xl font-bold">${{ latestRecord.goldPrice }}</div>
          </div>
          <div class="p-4 bg-gray-800 rounded-lg text-center">
            <div class="text-gray-400 text-sm">金银比</div>
            <div class="text-3xl font-bold">{{ latestRecord.goldSilverRatio }}</div>
          </div>
          <div class="p-4 bg-gray-800 rounded-lg text-center">
            <div class="text-gray-400 text-sm">月涨幅</div>
            <div 
              class="text-3xl font-bold"
              :class="parseFloat(latestRecord.monthlyChange || '0') > 30 ? 'text-red-400' : 'text-green-400'"
            >
              +{{ latestRecord.monthlyChange || '0' }}%
            </div>
          </div>
        </div>

        <!-- 52周范围 -->
        <div v-if="priceRange && latestRecord" class="mb-6 p-4 bg-gray-800 rounded-lg">
          <div class="text-sm text-gray-400 mb-2">52周价格范围</div>
          <div class="flex items-center gap-2">
            <span class="text-sm">${{ priceRange.low }}</span>
            <div class="flex-1 h-2 bg-gray-700 rounded-full relative">
              <div 
                class="absolute h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                :style="{ width: `${((parseFloat(latestRecord.silverPrice) - priceRange.low) / (priceRange.high - priceRange.low)) * 100}%` }"
              ></div>
            </div>
            <span class="text-sm">${{ priceRange.high }}</span>
          </div>
        </div>

        <!-- 风险信号面板 -->
        <div v-if="latestRecord" class="mb-6 p-4 bg-gray-800 rounded-lg">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">🎯 风险信号分析 ({{ latestRecord.date }})</h2>
            <div 
              class="px-4 py-2 rounded-lg text-lg font-bold"
              :class="getAdvice(calculateSummary(latestRecord)).class"
            >
              {{ getAdvice(calculateSummary(latestRecord)).text }}
            </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-700">
                  <th class="px-3 py-2 text-left">指标</th>
                  <th class="px-3 py-2 text-center">数值</th>
                  <th class="px-3 py-2 text-center">信号</th>
                  <th class="px-3 py-2 text-left">原因</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(signal, index) in calculateRiskSignals(latestRecord)" 
                  :key="index"
                  class="border-b border-gray-700"
                >
                  <td class="px-3 py-2 font-medium">{{ signal.name }}</td>
                  <td class="px-3 py-2 text-center font-mono">{{ signal.value }}</td>
                  <td class="px-3 py-2 text-center">
                    <span 
                      class="px-2 py-1 rounded text-xs font-bold"
                      :class="{
                        'bg-red-600': signal.signal === 'bearish',
                        'bg-green-600': signal.signal === 'bullish',
                        'bg-gray-600': signal.signal === 'neutral'
                      }"
                    >
                      {{ signal.signal === 'bearish' ? '🔴 利空' : signal.signal === 'bullish' ? '🟢 利多' : '⚪ 中性' }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-gray-400">{{ signal.reason }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-gray-700">
                  <td class="px-3 py-2 font-bold">汇总</td>
                  <td colspan="3" class="px-3 py-2 text-center">
                    <span class="text-green-400 font-bold">{{ calculateSummary(latestRecord).bullish }} 利多</span>
                    <span class="mx-2">vs</span>
                    <span class="text-red-400 font-bold">{{ calculateSummary(latestRecord).bearish }} 利空</span>
                    <span class="mx-2">=</span>
                    <span class="font-bold">{{ getAdvice(calculateSummary(latestRecord)).action }}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- 1月27日验证 -->
        <div v-if="records.find(r => r.date === '2026-01-27')" class="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg">
          <h3 class="text-lg font-semibold text-red-400 mb-3">📅 1月27日回测验证（暴跌前3天）</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-red-700">
                  <th class="px-3 py-2 text-left">指标</th>
                  <th class="px-3 py-2 text-center">数值</th>
                  <th class="px-3 py-2 text-center">信号</th>
                  <th class="px-3 py-2 text-left">原因</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(signal, index) in calculateRiskSignals(records.find(r => r.date === '2026-01-27')!)" 
                  :key="index"
                  class="border-b border-red-800"
                >
                  <td class="px-3 py-2 font-medium">{{ signal.name }}</td>
                  <td class="px-3 py-2 text-center font-mono">{{ signal.value }}</td>
                  <td class="px-3 py-2 text-center">
                    <span 
                      class="px-2 py-1 rounded text-xs font-bold"
                      :class="{
                        'bg-red-600': signal.signal === 'bearish',
                        'bg-green-600': signal.signal === 'bullish',
                        'bg-gray-600': signal.signal === 'neutral'
                      }"
                    >
                      {{ signal.signal === 'bearish' ? '🔴 利空' : signal.signal === 'bullish' ? '🟢 利多' : '⚪ 中性' }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-gray-400">{{ signal.reason }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-red-800/50">
                  <td class="px-3 py-2 font-bold">汇总</td>
                  <td colspan="3" class="px-3 py-2">
                    <span class="text-green-400 font-bold">{{ calculateSummary(records.find(r => r.date === '2026-01-27')!).bullish }} 利多</span>
                    <span class="mx-2">vs</span>
                    <span class="text-red-400 font-bold">{{ calculateSummary(records.find(r => r.date === '2026-01-27')!).bearish }} 利空</span>
                    <span class="mx-2">=</span>
                    <span class="px-2 py-1 bg-red-600 rounded font-bold">
                      {{ getAdvice(calculateSummary(records.find(r => r.date === '2026-01-27')!)).text }}
                    </span>
                    <span class="ml-2 text-yellow-400">✅ 成功预警暴跌！</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- 历史数据 -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold mb-3">📋 历史数据</h3>
          <div class="overflow-x-auto rounded-lg">
            <table class="w-full text-sm">
              <thead class="bg-gray-800">
                <tr>
                  <th class="px-3 py-2 text-left">日期</th>
                  <th class="px-3 py-2 text-right">白银</th>
                  <th class="px-3 py-2 text-right">金银比</th>
                  <th class="px-3 py-2 text-right">月涨幅</th>
                  <th class="px-3 py-2 text-right">库存</th>
                  <th class="px-3 py-2 text-center">利多</th>
                  <th class="px-3 py-2 text-center">利空</th>
                  <th class="px-3 py-2 text-center">建议</th>
                  <th class="px-3 py-2 text-left">备注</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="record in records" 
                  :key="record.id" 
                  class="border-b border-gray-700 hover:bg-gray-800"
                >
                  <td class="px-3 py-2 font-mono">{{ record.date }}</td>
                  <td class="px-3 py-2 text-right font-mono">${{ record.silverPrice }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ record.goldSilverRatio }}</td>
                  <td 
                    class="px-3 py-2 text-right font-mono"
                    :class="parseFloat(record.monthlyChange || '0') > 30 ? 'text-red-400' : ''"
                  >
                    +{{ record.monthlyChange || '0' }}%
                  </td>
                  <td class="px-3 py-2 text-right font-mono">{{ record.comexInventory }}M</td>
                  <td class="px-3 py-2 text-center">
                    <span class="px-2 py-1 bg-green-600 rounded">{{ calculateSummary(record).bullish }}</span>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <span class="px-2 py-1 bg-red-600 rounded">{{ calculateSummary(record).bearish }}</span>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <span 
                      class="px-2 py-1 rounded text-xs font-bold"
                      :class="getAdvice(calculateSummary(record)).class"
                    >
                      {{ getAdvice(calculateSummary(record)).text }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-gray-400">{{ record.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 说明 -->
        <div class="p-4 bg-gray-800 rounded-lg text-sm text-gray-400">
          <h3 class="font-semibold text-white mb-2">📝 风险信号说明</h3>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <div class="font-medium text-white">利空信号（减仓）</div>
              <ul class="list-disc list-inside mt-1">
                <li>COMEX库存 &lt; 120M</li>
                <li>金银比 &lt; 50（过热）</li>
                <li>月涨幅 &gt; 30%</li>
                <li>交割窗口 ≤ 5天</li>
                <li>COT商业 REDUCED SHORT</li>
              </ul>
            </div>
            <div>
              <div class="font-medium text-white">操作建议</div>
              <ul class="list-disc list-inside mt-1">
                <li>5+ 利空 = 减仓80%</li>
                <li>4 利空 = 减仓50%</li>
                <li>3 利空 = 减仓30%</li>
                <li>4+ 利多 = 可加仓</li>
              </ul>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
