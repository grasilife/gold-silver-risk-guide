<script setup lang="ts">
import { useTracker } from './composables/useTracker'

const {
  records,
  showForm,
  form,
  getSignal,
  calculateSummary,
  getAdvice,
  addRecord,
  deleteRecord,
  exportCSV,
  isWednesday,
  isFriday
} = useTracker()
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <!-- 头部 -->
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">📊 金银数据追踪</h1>
        <div class="space-x-2">
          <button 
            @click="showForm = !showForm" 
            class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            {{ showForm ? '取消' : '+ 添加数据' }}
          </button>
          <button 
            @click="exportCSV" 
            class="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition"
          >
            导出CSV
          </button>
        </div>
      </div>

      <!-- 提醒 -->
      <div class="mb-4 p-3 bg-gray-800 rounded-lg">
        <div class="flex gap-4 text-sm">
          <span v-if="isWednesday" class="text-yellow-400 animate-pulse">
            📅 今天是周三，记得查库存！
          </span>
          <span v-if="isFriday" class="text-yellow-400 animate-pulse">
            📅 今天是周五，记得查COT！
          </span>
          <span class="text-gray-400">
            数据来源：
            <a href="https://silverdata.io" target="_blank" class="text-blue-400 hover:underline">
              silverdata.io
            </a>
          </span>
        </div>
      </div>

      <!-- 添加表单 -->
      <Transition name="slide">
        <div v-if="showForm" class="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 class="text-lg font-semibold mb-4">添加今日数据</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">日期</label>
              <input 
                v-model="form.date" 
                type="date" 
                class="w-full px-3 py-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">白银价格 ($)</label>
              <input 
                v-model="form.silverPrice" 
                type="text" 
                placeholder="98.50" 
                class="w-full px-3 py-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">黄金价格 ($)</label>
              <input 
                v-model="form.goldPrice" 
                type="text" 
                placeholder="5067" 
                class="w-full px-3 py-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">金银比</label>
              <input 
                v-model="form.goldSilverRatio" 
                type="text" 
                placeholder="46.6" 
                class="w-full px-3 py-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">动量分数</label>
              <input 
                v-model="form.momentum" 
                type="text" 
                placeholder="100" 
                class="w-full px-3 py-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">COMEX库存 (M)</label>
              <input 
                v-model="form.comexInventory" 
                type="text" 
                placeholder="105" 
                class="w-full px-3 py-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">COT商业</label>
              <input 
                v-model="form.cotCommercial" 
                type="text" 
                placeholder="-21213" 
                class="w-full px-3 py-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">COT投机</label>
              <input 
                v-model="form.cotSpeculator" 
                type="text" 
                placeholder="7699" 
                class="w-full px-3 py-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">SLV持仓 (M)</label>
              <input 
                v-model="form.slvHoldings" 
                type="text" 
                placeholder="499" 
                class="w-full px-3 py-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
            <div class="col-span-2 md:col-span-3">
              <label class="block text-sm text-gray-400 mb-1">备注</label>
              <input 
                v-model="form.note" 
                type="text" 
                placeholder="非农日/CPI/交割窗口等" 
                class="w-full px-3 py-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
          </div>
          <div class="mt-4">
            <button 
              @click="addRecord" 
              class="px-6 py-2 bg-green-600 rounded hover:bg-green-700 transition"
            >
              保存
            </button>
          </div>
        </div>
      </Transition>

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
              <th class="px-3 py-3"></th>
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
              <td class="px-3 py-3">
                <button 
                  @click="deleteRecord(record.id)" 
                  class="text-red-400 hover:text-red-300 transition"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 空状态 -->
      <div v-if="records.length === 0" class="text-center py-16 text-gray-500">
        <div class="text-6xl mb-4">📈</div>
        <p class="text-lg">还没有数据</p>
        <p class="text-sm mt-2">点击"添加数据"开始记录</p>
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

      <!-- 版权信息 -->
      <div class="mt-4 text-center text-gray-600 text-xs">
        金银数据追踪 v1.0 | 数据来源 silverdata.io
      </div>
    </div>
  </div>
</template>

<style>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
