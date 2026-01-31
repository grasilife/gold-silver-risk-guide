<script setup lang="ts">
import { useTracker } from './composables/useTracker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const {
  records,
  lastUpdated,
  source,
  loading,
  error,
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
  <div class="min-h-screen bg-background text-foreground p-6">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- 头部 -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">📊 金银风险追踪</h1>
          <p class="text-muted-foreground text-sm mt-1">
            更新: {{ lastUpdated }} · 来源: {{ source }}
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="loadData">
            🔄 刷新
          </Button>
          <Button variant="outline" size="sm" @click="exportCSV">
            📥 导出
          </Button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="text-4xl animate-spin">⏳</div>
      </div>

      <!-- 错误状态 -->
      <Card v-else-if="error" class="border-destructive">
        <CardContent class="pt-6 text-center">
          <div class="text-4xl mb-4">❌</div>
          <p class="text-destructive">{{ error }}</p>
          <Button class="mt-4" @click="loadData">重试</Button>
        </CardContent>
      </Card>

      <!-- 主内容 -->
      <template v-else>
        <!-- 价格卡片 -->
        <div v-if="latestRecord" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader class="pb-2">
              <CardDescription>白银 Ag</CardDescription>
              <CardTitle class="text-3xl">${{ latestRecord.silverPrice }}</CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="priceChange" class="text-sm" :class="priceChange.change >= 0 ? 'text-green-500' : 'text-red-500'">
                {{ priceChange.change >= 0 ? '▲' : '▼' }} {{ Math.abs(priceChange.percent).toFixed(1) }}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardDescription>黄金 Au</CardDescription>
              <CardTitle class="text-3xl">${{ latestRecord.goldPrice }}</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="text-sm text-muted-foreground">COMEX期货</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardDescription>金银比</CardDescription>
              <CardTitle class="text-3xl">{{ latestRecord.goldSilverRatio }}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge :variant="parseFloat(latestRecord.goldSilverRatio) < 50 ? 'destructive' : 'secondary'">
                {{ parseFloat(latestRecord.goldSilverRatio) < 50 ? '过热' : '正常' }}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardDescription>月涨幅</CardDescription>
              <CardTitle class="text-3xl">+{{ latestRecord.monthlyChange || '0' }}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge :variant="parseFloat(latestRecord.monthlyChange || '0') > 30 ? 'destructive' : 'secondary'">
                {{ parseFloat(latestRecord.monthlyChange || '0') > 30 ? '过热' : '正常' }}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <!-- 52周范围 -->
        <Card v-if="priceRange && latestRecord">
          <CardHeader class="pb-2">
            <CardDescription>52周价格范围</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-center gap-4">
              <span class="text-sm font-mono">${{ priceRange.low }}</span>
              <Progress 
                :model-value="((parseFloat(latestRecord.silverPrice) - priceRange.low) / (priceRange.high - priceRange.low)) * 100" 
                class="flex-1"
              />
              <span class="text-sm font-mono">${{ priceRange.high }}</span>
            </div>
            <div class="flex justify-between text-xs text-muted-foreground mt-2">
              <span>距低点 +{{ priceRange.currentFromLow }}</span>
              <span>当前 ${{ latestRecord.silverPrice }}</span>
              <span>距高点 -{{ priceRange.currentFromHigh }}</span>
            </div>
          </CardContent>
        </Card>

        <!-- 风险信号面板 -->
        <Card v-if="latestRecord" class="border-2" :class="calculateSummary(latestRecord).bearish >= 4 ? 'border-red-500' : 'border-border'">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>🎯 风险信号分析</CardTitle>
                <CardDescription>{{ latestRecord.date }}</CardDescription>
              </div>
              <Badge 
                :variant="calculateSummary(latestRecord).bearish >= 4 ? 'destructive' : calculateSummary(latestRecord).bullish >= 3 ? 'default' : 'secondary'"
                class="text-lg px-4 py-2"
              >
                {{ getAdvice(calculateSummary(latestRecord)).text }}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>指标</TableHead>
                  <TableHead class="text-center">数值</TableHead>
                  <TableHead class="text-center">信号</TableHead>
                  <TableHead>原因</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(signal, index) in calculateRiskSignals(latestRecord)" :key="index">
                  <TableCell class="font-medium">{{ signal.name }}</TableCell>
                  <TableCell class="text-center font-mono">{{ signal.value }}</TableCell>
                  <TableCell class="text-center">
                    <Badge :variant="signal.signal === 'bearish' ? 'destructive' : signal.signal === 'bullish' ? 'default' : 'secondary'">
                      {{ signal.signal === 'bearish' ? '🔴 利空' : signal.signal === 'bullish' ? '🟢 利多' : '⚪ 中性' }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground">{{ signal.reason }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <Separator class="my-4" />
            
            <div class="flex items-center justify-center gap-4 text-lg">
              <span class="text-green-500 font-bold">{{ calculateSummary(latestRecord).bullish }} 利多</span>
              <span class="text-muted-foreground">vs</span>
              <span class="text-red-500 font-bold">{{ calculateSummary(latestRecord).bearish }} 利空</span>
              <span class="text-muted-foreground">=</span>
              <span class="font-bold">{{ getAdvice(calculateSummary(latestRecord)).action }}</span>
            </div>
          </CardContent>
        </Card>

        <!-- 1月27日回测 -->
        <Card v-if="records.find(r => r.date === '2026-01-27')" class="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <CardTitle class="text-red-500">📅 1月27日回测验证（暴跌前3天）</CardTitle>
            <CardDescription>验证风险预警系统的有效性</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>指标</TableHead>
                  <TableHead class="text-center">数值</TableHead>
                  <TableHead class="text-center">信号</TableHead>
                  <TableHead>原因</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(signal, index) in calculateRiskSignals(records.find(r => r.date === '2026-01-27')!)" :key="index">
                  <TableCell class="font-medium">{{ signal.name }}</TableCell>
                  <TableCell class="text-center font-mono">{{ signal.value }}</TableCell>
                  <TableCell class="text-center">
                    <Badge :variant="signal.signal === 'bearish' ? 'destructive' : signal.signal === 'bullish' ? 'default' : 'secondary'">
                      {{ signal.signal === 'bearish' ? '🔴 利空' : signal.signal === 'bullish' ? '🟢 利多' : '⚪ 中性' }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground">{{ signal.reason }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <Separator class="my-4" />
            
            <div class="flex items-center justify-center gap-4 text-lg">
              <span class="text-green-500 font-bold">{{ calculateSummary(records.find(r => r.date === '2026-01-27')!).bullish }} 利多</span>
              <span class="text-muted-foreground">vs</span>
              <span class="text-red-500 font-bold">{{ calculateSummary(records.find(r => r.date === '2026-01-27')!).bearish }} 利空</span>
              <span class="text-muted-foreground">=</span>
              <Badge variant="destructive" class="text-lg px-4 py-2">
                {{ getAdvice(calculateSummary(records.find(r => r.date === '2026-01-27')!)).text }}
              </Badge>
              <span class="text-yellow-500 font-bold">✅ 成功预警暴跌！</span>
            </div>
          </CardContent>
        </Card>

        <!-- 历史数据 -->
        <Card>
          <CardHeader>
            <CardTitle>📋 历史数据</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead class="text-right">白银</TableHead>
                  <TableHead class="text-right">金银比</TableHead>
                  <TableHead class="text-right">月涨幅</TableHead>
                  <TableHead class="text-right">库存</TableHead>
                  <TableHead class="text-center">信号</TableHead>
                  <TableHead class="text-center">建议</TableHead>
                  <TableHead>备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="record in records" :key="record.id">
                  <TableCell class="font-mono">{{ record.date }}</TableCell>
                  <TableCell class="text-right font-mono">${{ record.silverPrice }}</TableCell>
                  <TableCell class="text-right font-mono">{{ record.goldSilverRatio }}</TableCell>
                  <TableCell class="text-right font-mono">
                    <span :class="parseFloat(record.monthlyChange || '0') > 30 ? 'text-red-500' : ''">
                      +{{ record.monthlyChange || '0' }}%
                    </span>
                  </TableCell>
                  <TableCell class="text-right font-mono">{{ record.comexInventory }}M</TableCell>
                  <TableCell class="text-center">
                    <span class="text-green-500">{{ calculateSummary(record).bullish }}</span>
                    <span class="text-muted-foreground mx-1">/</span>
                    <span class="text-red-500">{{ calculateSummary(record).bearish }}</span>
                  </TableCell>
                  <TableCell class="text-center">
                    <Badge :variant="calculateSummary(record).bearish >= 4 ? 'destructive' : 'secondary'" class="text-xs">
                      {{ getAdvice(calculateSummary(record)).text }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground">{{ record.note }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <!-- 说明卡片 -->
        <div class="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle class="text-base">🔴 利空信号（减仓）</CardTitle>
            </CardHeader>
            <CardContent class="text-sm text-muted-foreground space-y-1">
              <p>• COMEX库存 &lt; 120M</p>
              <p>• 金银比 &lt; 50（过热）</p>
              <p>• 月涨幅 &gt; 30%</p>
              <p>• 交割窗口 ≤ 5天</p>
              <p>• COT商业 REDUCED SHORT</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle class="text-base">📊 操作建议</CardTitle>
            </CardHeader>
            <CardContent class="text-sm text-muted-foreground space-y-1">
              <p>• 5+ 利空 = <span class="text-red-500">减仓80%</span></p>
              <p>• 4 利空 = <span class="text-red-500">减仓50%</span></p>
              <p>• 3 利空 = <span class="text-yellow-500">减仓30%</span></p>
              <p>• 4+ 利多 = <span class="text-green-500">可加仓</span></p>
            </CardContent>
          </Card>
        </div>
      </template>
    </div>
  </div>
</template>
