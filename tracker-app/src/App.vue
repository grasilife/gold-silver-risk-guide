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
  getSignal,
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
        <h1 class="text-2xl font-bold">📊 金银数据追踪</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-400">
            更新: {{ lastUpdated }} | 来源: {{ source }}
          </span>
          <button 
            @click="loadData" 
            class="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition text-sm"
          >
            🔄 刷新
          </button>
          <button 
            @click="exportCSV" 
            class="px-3 py-1 bg-gray-600 rounded hover:bg-gray-700 transition text-sm"
          >
            📥 导出
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-16">
        <div class="text-4xl animate-spin">⏳</div>
        <p class="mt-4 text-gray-400">加载数据中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center py-16">
        <div class="text-4xl">❌</div>
        <p class="mt-4 text-red-400">{{ error }}</p>
        <button @click="loadData" class="mt-4 px-4 py-2 bg-blue-600 rounded">重试</button>
      </div>

      <!-- 主内容 -->
      <template v-else>
        <!-- 价格概览 -->
        <div v-if="latestRecord" class="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- 白银价格 -->
          <div class="p-4 bg-gray-800 rounded-lg text-center">
            <div class="text-gray-400 text-sm mb-1">白银 Ag</div>
            <div class="text-3xl font-bold">${{ latestRecord.silverPrice }}</div>
            <div v-if="priceChange" class="text-sm mt-1" :class="priceChange.change >= 0 ? 'text-green-400' : 'text-red-400'">
              {{ priceChange.change >= 0 ? '▲' : '▼' }} {{ Math.abs(priceChange.percent).toFixed(2) }}%
            </div>
          </div>
          
          <!-- 黄金价格 -->
          <div class="p-4 bg-gray-800 rounded-lg text-center">
            <div class="text-gray-400 text-sm mb-1">黄金 Au</div>
            <div class="text-3xl font-bold">${{ latestRecord.goldPrice }}</div>
          </div>
          
          <!-- 金银比 -->
          <div class="p-4 bg-gray-800 rounded-lg text-center">
            <div class="text-gray-400 text-sm mb-1">金银比</div>
            <div 
              class="text-3xl font-bold"
              :class="{
                'text-green-400': getSignal('goldSilverRatio', latestRecord.goldSilverRatio) === 'bullish',
                'text-red-400': getSignal('goldSilverRatio', latestRecord.goldSilverRatio) === 'bearish'
              }"
            >
              {{ latestRecord.goldSilverRatio }}
            </div>
            <div v-if="marketInsights" class="text-xs text-gray-500 mt-1">
              第{{ marketInsights.goldSilverRatio.percentile }}百分位
            </div>
          </div>
          
          <!-- 动量 -->
          <div class="p-4 bg-gray-800 rounded-lg text-center">
            <div class="text-gray-400 text-sm mb-1">动量分数</div>
            <div 
              class="text-3xl font-bold"
              :class="{
                'text-green-400': getSignal('momentum', latestRecord.momentum) === 'bullish',
                'text-red-400': getSignal('momentum', latestRecord.momentum) === 'bearish'
              }"
            >
              {{ latestRecord.momentum }}/100
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
                class="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                :style="{ width: `${((parseFloat(latestRecord.silverPrice) - priceRange.low) / (priceRange.high - priceRange.low)) * 100}%` }"
              ></div>
            </div>
            <span class="text-sm">${{ priceRange.high }}</span>
          </div>
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>距低点 +{{ priceRange.currentFromLow }}</span>
            <span>距高点 -{{ priceRange.currentFromHigh }}</span>
          </div>
        </div>

        <!-- 市场洞察 -->
        <div v-if="marketInsights" class="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-3 bg-gray-800 rounded-lg">
            <div class="text-xs text-gray-400">金银比信号</div>
            <div class="font-semibold" :class="marketInsights.goldSilverRatio.signal === 'bullish' ? 'text-green-400' : 'text-gray-300'">
              {{ marketInsights.goldSilverRatio.signal === 'bullish' ? '🟢 看多' : '⚪ 中性' }}
            </div>
            <div class="text-xs text-gray-500 mt-1">{{ marketInsights.goldSilverRatio.description }}</div>
          </div>
          
          <div class="p-3 bg-gray-800 rounded-lg">
            <div class="text-xs text-gray-400">COT持仓</div>
            <div class="font-semibold" :class="marketInsights.cotPositioning.signal === 'bullish' ? 'text-green-400' : 'text-gray-300'">
              {{ marketInsights.cotPositioning.signal === 'bullish' ? '🟢 看多' : marketInsights.cotPositioning.signal === 'bearish' ? '🔴 看空' : '⚪ 中性' }}
            </div>
            <div class="text-xs text-gray-500 mt-1">商业: {{ marketInsights.cotPositioning.commercial.toLocaleString() }}</div>
          </div>
          
          <div class="p-3 bg-gray-800 rounded-lg">
            <div class="text-xs text-gray-400">技术面</div>
            <div class="font-semibold" :class="marketInsights.technical.signal === 'bullish' ? 'text-green-400' : 'text-gray-300'">
              {{ marketInsights.technical.signal === 'bullish' ? '🟢 看多' : '⚪ 中性' }}
            </div>
            <div class="text-xs text-gray-500 mt-1">RSI: {{ marketInsights.technical.rsi }}</div>
          </div>
          
          <div class="p-3 bg-gray-800 rounded-lg">
            <div class="text-xs text-gray-400">动量信号</div>
            <div class="font-semibold" :class="marketInsights.momentum.signal === 'bullish' ? 'text-green-400' : 'text-gray-300'">
              {{ marketInsights.momentum.signal === 'bullish' ? '🟢 强势看多' : '⚪ 中性' }}
            </div>
            <div class="text-xs text-gray-500 mt-1">{{ marketInsights.momentum.description }}</div>
          </div>
        </div>

        <!-- COMEX库存详情 -->
        <div v-if="latestRecord" class="mb-6 p-4 bg-gray-800 rounded-lg">
          <div class="text-sm font-semibold mb-3">📦 COMEX库存 (百万盎司)</div>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-red-400">{{ latestRecord.comexInventory }}M</div>
              <div class="text-xs text-gray-400">Registered (可交割)</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-yellow-400">{{ latestRecord.comexEligible || '--' }}M</div>
              <div class="text-xs text-gray-400">Eligible (合格)</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-300">{{ latestRecord.comexTotal || '--' }}M</div>
              <div class="text-xs text-gray-400">Total (总计)</div>
            </div>
          </div>
        </div>

        <!-- ETF持仓 -->
        <div v-if="latestRecord" class="mb-6 p-4 bg-gray-800 rounded-lg">
          <div class="text-sm font-semibold mb-3">📈 ETF持仓 (百万盎司)</div>
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-blue-400">{{ latestRecord.slvHoldings }}M</div>
              <div class="text-xs text-gray-400">SLV (iShares)</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-purple-400">{{ latestRecord.pslvHoldings || '--' }}M</div>
              <div class="text-xs text-gray-400">PSLV (Sprott)</div>
            </div>
          </div>
        </div>

        <!-- 综合建议 -->
        <div v-if="latestRecord" class="mb-6 p-4 bg-gray-800 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-400">综合建议</div>
              <div class="text-lg">
                利多信号: <span class="text-green-400 font-bold">{{ calculateSummary(latestRecord).bullish }}</span> | 
                利空信号: <span class="text-red-400 font-bold">{{ calculateSummary(latestRecord).bearish }}</span>
              </div>
            </div>
            <div 
              class="px-6 py-3 rounded-lg text-xl font-bold text-gray-900"
              :class="getAdvice(calculateSummary(latestRecord)).class"
            >
              {{ getAdvice(calculateSummary(latestRecord)).text }}
            </div>
          </div>
        </div>

        <!-- 历史数据表格 -->
        <div class="mb-6">
          <div class="text-sm font-semibold mb-3">📋 历史数据</div>
          <div class="overflow-x-auto rounded-lg">
            <table class="w-full text-sm">
              <thead class="bg-gray-800">
                <tr>
                  <th class="px-3 py-2 text-left">日期</th>
                  <th class="px-3 py-2 text-right">白银</th>
                  <th class="px-3 py-2 text-right">黄金</th>
                  <th class="px-3 py-2 text-right">金银比</th>
                  <th class="px-3 py-2 text-right">动量</th>
                  <th class="px-3 py-2 text-right">库存</th>
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
                  <td class="px-3 py-2 text-right font-mono">${{ record.goldPrice }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ record.goldSilverRatio }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ record.momentum }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ record.comexInventory }}M</td>
                  <td class="px-3 py-2 text-gray-400">{{ record.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 底部说明 -->
        <div class="p-4 bg-gray-800 rounded-lg text-sm text-gray-400">
          <h3 class="font-semibold text-white mb-2">📱 数据说明</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>数据来源: <a href="https://silverdata.io" target="_blank" class="text-blue-400 hover:underline">silverdata.io</a></li>
            <li>库存每日更新，COT每周五更新</li>
            <li>Registered = 可交割库存（关键指标）</li>
            <li>动量100 = 强势看多，0 = 强势看空</li>
          </ul>
        </div>
      </template>

      <!-- 版权信息 -->
      <div class="mt-4 text-center text-gray-600 text-xs">
        金银数据追踪 v2.0 | 数据来源 silverdata.io
      </div>
    </div>
  </div>
</template>
