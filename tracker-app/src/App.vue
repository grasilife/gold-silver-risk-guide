<script setup lang="ts">
import { useTracker } from './composables/useTracker'

const {
  records,
  lastUpdated,
  loading,
  error,
  getSignal,
  calculateSummary,
  getAdvice,
  exportCSV,
  loadData,
  isWednesday,
  isFriday,
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
            更新: {{ lastUpdated }}
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
        <!-- 今日概览 -->
        <div v-if="latestRecord" class="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 class="text-lg font-semibold mb-3">📈 最新数据 ({{ latestRecord.date }})</h2>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="text-center">
              <div class="text-gray-400 text-sm">白银</div>
              <div class="text-2xl font-bold">${{ latestRecord.silverPrice }}</div>
              <div v-if="priceChange" class="text-sm" :class="priceChange.change >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ priceChange.change >= 0 ? '+' : '' }}{{ priceChange.percent.toFixed(2) }}%
              </div>
            </div>
            <div class="text-center">
              <div class="text-gray-400 text-sm">黄金</div>
              <div class="text-2xl font-bold">${{ latestRecord.goldPrice }}</div>
            </div>
            <div class="text-center">
              <div class="text-gray-400 text-sm">金银比</div>
              <div 
                class="text-2xl font-bold"
                :class="{
                  'text-green-400': getSignal('goldSilverRatio', latestRecord.goldSilverRatio) === 'bullish',
                  'text-red-400': getSignal('goldSilverRatio', latestRecord.goldSilverRatio) === 'bearish'
                }"
              >
                {{ latestRecord.goldSilverRatio }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-gray-400 text-sm">库存(M)</div>
              <div 
                class="text-2xl font-bold"
                :class="{
                  'text-green-400': getSignal('comexInventory', latestRecord.comexInventory) === 'bullish',
                  'text-red-400': getSignal('comexInventory', latestRecord.comexInventory) === 'bearish'
                }"
              >
                {{ latestRecord.comexInventory }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-gray-400 text-sm">建议</div>
              <div 
                class="text-xl font-bold px-3 py-1 rounded inline-block text-gray-900"
                :class="getAdvice(calculateSummary(latestRecord)).class"
              >
                {{ getAdvice(calculateSummary(latestRecord)).text }}
              </div>
            </div>
          </div>
        </div>

        <!-- 提醒 -->
        <div class="mb-4 p-3 bg-gray-800 rounded-lg">
          <div class="flex flex-wrap gap-4 text-sm">
            <span v-if="isWednesday" class="text-yellow-400 animate-pulse">
              📅 今天是周三，记得查库存！
            </span>
            <span v-if="isFriday" class="text-yellow-400 animate-pulse">
              📅 今天是周五，记得查COT！
            </span>
            <span class="text-gray-400">
              数据来源：
              <a href="https://silverdata.io" target="_blank" class="text-blue-400 hover:underline">silverdata.io</a>
            </span>
          </div>
        </div>

        <!-- 阈值说明 -->
        <div class="mb-4 p-3 bg-gray-800 rounded-lg text-sm">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <span class="text-gray-400">金银比:</span> 
              <span class="text-green-400">&lt;50利多</span> / 
              <span class="text-red-400">&gt;80利空</span>
            </div>
            <div>
              <span class="text-gray-400">库存:</span> 
              <span class="text-green-400">&gt;150M利多</span> / 
              <span class="text-red-400">&lt;120M利空</span>
            </div>
            <div>
              <span class="text-gray-400">动量:</span> 
              <span class="text-green-400">&gt;70利多</span> / 
              <span class="text-red-400">&lt;30利空</span>
            </div>
            <div>
              <span class="text-gray-400">COT商业:</span> 
              <span class="text-green-400">&lt;-50K利多</span> / 
              <span class="text-red-400">&gt;-20K利空</span>
            </div>
          </div>
        </div>

        <!-- 数据表格 -->
        <div class="overflow-x-auto rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-gray-800">
              <tr>
                <th class="px-3 py-3 text-left font-medium">日期</th>
                <th class="px-3 py-3 text-right font-medium">白银</th>
                <th class="px-3 py-3 text-right font-medium">黄金</th>
                <th class="px-3 py-3 text-right font-medium">金银比</th>
                <th class="px-3 py-3 text-right font-medium">动量</th>
                <th class="px-3 py-3 text-right font-medium">库存</th>
                <th class="px-3 py-3 text-right font-medium">COT商业</th>
                <th class="px-3 py-3 text-center font-medium">利多</th>
                <th class="px-3 py-3 text-center font-medium">利空</th>
                <th class="px-3 py-3 text-center font-medium">建议</th>
                <th class="px-3 py-3 text-left font-medium">备注</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="record in records" 
                :key="record.id" 
                class="border-b border-gray-700 hover:bg-gray-800 transition"
              >
                <td class="px-3 py-3 font-mono">{{ record.date }}</td>
                <td class="px-3 py-3 text-right font-mono">${{ record.silverPrice }}</td>
                <td class="px-3 py-3 text-right font-mono">${{ record.goldPrice }}</td>
                <td 
                  class="px-3 py-3 text-right font-mono font-semibold"
                  :class="{
                    'text-green-400': getSignal('goldSilverRatio', record.goldSilverRatio) === 'bullish',
                    'text-red-400': getSignal('goldSilverRatio', record.goldSilverRatio) === 'bearish'
                  }"
                >
                  {{ record.goldSilverRatio }}
                </td>
                <td 
                  class="px-3 py-3 text-right font-mono font-semibold"
                  :class="{
                    'text-green-400': getSignal('momentum', record.momentum) === 'bullish',
                    'text-red-400': getSignal('momentum', record.momentum) === 'bearish'
                  }"
                >
                  {{ record.momentum }}
                </td>
                <td 
                  class="px-3 py-3 text-right font-mono font-semibold"
                  :class="{
                    'text-green-400': getSignal('comexInventory', record.comexInventory) === 'bullish',
                    'text-red-400': getSignal('comexInventory', record.comexInventory) === 'bearish'
                  }"
                >
                  {{ record.comexInventory }}M
                </td>
                <td 
                  class="px-3 py-3 text-right font-mono font-semibold"
                  :class="{
                    'text-green-400': getSignal('cotCommercial', record.cotCommercial) === 'bullish',
                    'text-red-400': getSignal('cotCommercial', record.cotCommercial) === 'bearish'
                  }"
                >
                  {{ record.cotCommercial }}
                </td>
                <td class="px-3 py-3 text-center">
                  <span class="px-2 py-1 bg-green-600 rounded font-semibold">
                    {{ calculateSummary(record).bullish }}
                  </span>
                </td>
                <td class="px-3 py-3 text-center">
                  <span class="px-2 py-1 bg-red-600 rounded font-semibold">
                    {{ calculateSummary(record).bearish }}
                  </span>
                </td>
                <td class="px-3 py-3 text-center">
                  <span 
                    class="px-3 py-1 rounded font-semibold text-gray-900"
                    :class="getAdvice(calculateSummary(record)).class"
                  >
                    {{ getAdvice(calculateSummary(record)).text }}
                  </span>
                </td>
                <td class="px-3 py-3 text-gray-400">{{ record.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 空状态 -->
        <div v-if="records.length === 0" class="text-center py-16 text-gray-500">
          <div class="text-6xl mb-4">📈</div>
          <p class="text-lg">还没有数据</p>
        </div>

        <!-- 底部说明 -->
        <div class="mt-6 p-4 bg-gray-800 rounded-lg text-sm text-gray-400">
          <h3 class="font-semibold text-white mb-2">📱 数据更新说明</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>数据由AI每日爬取更新</li>
            <li>周三重点关注：COMEX库存变化</li>
            <li>周五重点关注：COT持仓报告</li>
            <li>数据文件位置：<code class="bg-gray-700 px-1 rounded">public/data.json</code></li>
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
