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
  <div class="min-h-screen">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 max-w-screen-2xl items-center px-4 md:px-8">
        <div class="flex flex-1 items-center gap-2">
          <span class="text-xl">📊</span>
          <span class="font-semibold">金银风险追踪</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground hidden sm:inline">
            {{ lastUpdated }} · {{ source }}
          </span>
          <Button variant="ghost" size="icon" @click="loadData">
            <span class="text-sm">🔄</span>
          </Button>
          <Button variant="ghost" size="icon" @click="exportCSV">
            <span class="text-sm">📥</span>
          </Button>
        </div>
      </div>
    </header>

    <main class="container max-w-screen-2xl px-4 md:px-8 py-6 space-y-6">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center py-32">
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
        <!-- 价格概览 -->
        <div v-if="latestRecord" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription class="text-sm font-medium">白银 Ag</CardDescription>
              <span class="text-muted-foreground">🥈</span>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">${{ latestRecord.silverPrice }}</div>
              <p v-if="priceChange" class="text-xs mt-1" :class="priceChange.change >= 0 ? 'text-emerald-500' : 'text-red-500'">
                {{ priceChange.change >= 0 ? '+' : '' }}{{ priceChange.percent.toFixed(2) }}% 较上日
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription class="text-sm font-medium">黄金 Au</CardDescription>
              <span class="text-muted-foreground">🥇</span>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">${{ latestRecord.goldPrice }}</div>
              <p class="text-xs text-muted-foreground mt-1">COMEX 期货</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription class="text-sm font-medium">金银比</CardDescription>
              <span class="text-muted-foreground">⚖️</span>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ latestRecord.goldSilverRatio }}</div>
              <p class="text-xs mt-1" :class="parseFloat(latestRecord.goldSilverRatio) < 50 ? 'text-red-500' : 'text-muted-foreground'">
                {{ parseFloat(latestRecord.goldSilverRatio) < 50 ? '⚠️ 过热区间' : '正常范围' }}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription class="text-sm font-medium">月涨幅</CardDescription>
              <span class="text-muted-foreground">📈</span>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">+{{ latestRecord.monthlyChange || '0' }}%</div>
              <p class="text-xs mt-1" :class="parseFloat(latestRecord.monthlyChange || '0') > 30 ? 'text-red-500' : 'text-muted-foreground'">
                {{ parseFloat(latestRecord.monthlyChange || '0') > 30 ? '⚠️ 过热信号' : '涨幅正常' }}
              </p>
            </CardContent>
          </Card>
        </div>

        <!-- 52周范围 -->
        <Card v-if="priceRange && latestRecord">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">52周价格范围</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex items-center gap-4">
              <span class="text-sm font-mono text-muted-foreground w-16">${{ priceRange.low }}</span>
              <Progress 
                :model-value="((parseFloat(latestRecord.silverPrice) - priceRange.low) / (priceRange.high - priceRange.low)) * 100" 
                class="flex-1 h-2"
              />
              <span class="text-sm font-mono text-muted-foreground w-16 text-right">${{ priceRange.high }}</span>
            </div>
            <div class="flex justify-between text-xs text-muted-foreground mt-3">
              <span>距低点 <span class="text-emerald-500">+{{ priceRange.currentFromLow }}</span></span>
              <span class="font-medium text-foreground">当前 ${{ latestRecord.silverPrice }}</span>
              <span>距高点 <span class="text-red-500">-{{ priceRange.currentFromHigh }}</span></span>
            </div>
          </CardContent>
        </Card>

        <!-- 风险信号面板 -->
        <Card v-if="latestRecord" :class="calculateSummary(latestRecord).bearish >= 4 ? 'border-red-500/50' : ''">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <span>🎯</span>
                  风险信号分析
                </CardTitle>
                <CardDescription>{{ latestRecord.date }} 数据</CardDescription>
              </div>
              <Badge 
                :variant="calculateSummary(latestRecord).bearish >= 4 ? 'destructive' : calculateSummary(latestRecord).bullish >= 3 ? 'default' : 'secondary'"
                class="text-sm px-3 py-1"
              >
                {{ getAdvice(calculateSummary(latestRecord)).text }}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div class="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-[120px]">指标</TableHead>
                    <TableHead class="text-center w-[100px]">数值</TableHead>
                    <TableHead class="text-center w-[100px]">信号</TableHead>
                    <TableHead>原因</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="(signal, index) in calculateRiskSignals(latestRecord)" :key="index">
                    <TableCell class="font-medium">{{ signal.name }}</TableCell>
                    <TableCell class="text-center font-mono text-sm">{{ signal.value }}</TableCell>
                    <TableCell class="text-center">
                      <Badge 
                        :variant="signal.signal === 'bearish' ? 'destructive' : signal.signal === 'bullish' ? 'default' : 'outline'"
                        class="text-xs"
                      >
                        {{ signal.signal === 'bearish' ? '利空' : signal.signal === 'bullish' ? '利多' : '中性' }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-muted-foreground text-sm">{{ signal.reason }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div class="flex items-center justify-center gap-6 mt-4 py-3 rounded-lg bg-muted/50">
              <div class="text-center">
                <span class="text-2xl font-bold text-emerald-500">{{ calculateSummary(latestRecord).bullish }}</span>
                <span class="text-sm text-muted-foreground ml-1">利多</span>
              </div>
              <Separator orientation="vertical" class="h-8" />
              <div class="text-center">
                <span class="text-2xl font-bold text-red-500">{{ calculateSummary(latestRecord).bearish }}</span>
                <span class="text-sm text-muted-foreground ml-1">利空</span>
              </div>
              <Separator orientation="vertical" class="h-8" />
              <div class="text-center">
                <span class="text-sm text-muted-foreground">建议：</span>
                <span class="font-medium">{{ getAdvice(calculateSummary(latestRecord)).action }}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 1月27日回测 -->
        <Card v-if="records.find(r => r.date === '2026-01-27')" class="border-red-500/30 bg-red-500/5">
          <CardHeader>
            <div class="flex items-center gap-2">
              <span class="text-red-500">📅</span>
              <div>
                <CardTitle>1月27日回测验证</CardTitle>
                <CardDescription>暴跌前3天的风险信号</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="rounded-md border border-red-500/20">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-[120px]">指标</TableHead>
                    <TableHead class="text-center w-[100px]">数值</TableHead>
                    <TableHead class="text-center w-[100px]">信号</TableHead>
                    <TableHead>原因</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="(signal, index) in calculateRiskSignals(records.find(r => r.date === '2026-01-27')!)" :key="index">
                    <TableCell class="font-medium">{{ signal.name }}</TableCell>
                    <TableCell class="text-center font-mono text-sm">{{ signal.value }}</TableCell>
                    <TableCell class="text-center">
                      <Badge 
                        :variant="signal.signal === 'bearish' ? 'destructive' : signal.signal === 'bullish' ? 'default' : 'outline'"
                        class="text-xs"
                      >
                        {{ signal.signal === 'bearish' ? '利空' : signal.signal === 'bullish' ? '利多' : '中性' }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-muted-foreground text-sm">{{ signal.reason }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div class="flex items-center justify-center gap-4 mt-4 py-3 rounded-lg bg-red-500/10">
              <span class="text-emerald-500 font-bold">{{ calculateSummary(records.find(r => r.date === '2026-01-27')!).bullish }} 利多</span>
              <span class="text-muted-foreground">vs</span>
              <span class="text-red-500 font-bold">{{ calculateSummary(records.find(r => r.date === '2026-01-27')!).bearish }} 利空</span>
              <span class="text-muted-foreground">=</span>
              <Badge variant="destructive">
                {{ getAdvice(calculateSummary(records.find(r => r.date === '2026-01-27')!)).text }}
              </Badge>
              <Badge variant="outline" class="text-yellow-500 border-yellow-500/50">
                ✅ 成功预警
              </Badge>
            </div>
          </CardContent>
        </Card>

        <!-- 历史数据 -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <span>📋</span>
              历史数据
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="rounded-md border">
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
                  <TableRow v-for="record in records" :key="record.id" class="group">
                    <TableCell class="font-mono text-sm">{{ record.date }}</TableCell>
                    <TableCell class="text-right font-mono text-sm">${{ record.silverPrice }}</TableCell>
                    <TableCell class="text-right font-mono text-sm">{{ record.goldSilverRatio }}</TableCell>
                    <TableCell class="text-right font-mono text-sm">
                      <span :class="parseFloat(record.monthlyChange || '0') > 30 ? 'text-red-500' : ''">
                        +{{ record.monthlyChange || '0' }}%
                      </span>
                    </TableCell>
                    <TableCell class="text-right font-mono text-sm">{{ record.comexInventory }}M</TableCell>
                    <TableCell class="text-center">
                      <span class="text-emerald-500 font-medium">{{ calculateSummary(record).bullish }}</span>
                      <span class="text-muted-foreground mx-1">/</span>
                      <span class="text-red-500 font-medium">{{ calculateSummary(record).bearish }}</span>
                    </TableCell>
                    <TableCell class="text-center">
                      <Badge 
                        :variant="calculateSummary(record).bearish >= 4 ? 'destructive' : 'secondary'" 
                        class="text-xs"
                      >
                        {{ getAdvice(calculateSummary(record)).text }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-muted-foreground text-sm">{{ record.note }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <!-- 说明 -->
        <div class="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-base flex items-center gap-2">
                <span class="text-red-500">🔴</span>
                利空信号（减仓）
              </CardTitle>
            </CardHeader>
            <CardContent class="text-sm text-muted-foreground space-y-2">
              <div class="flex justify-between">
                <span>COMEX库存</span>
                <span class="font-mono">&lt; 120M</span>
              </div>
              <div class="flex justify-between">
                <span>金银比</span>
                <span class="font-mono">&lt; 50（过热）</span>
              </div>
              <div class="flex justify-between">
                <span>月涨幅</span>
                <span class="font-mono">&gt; 30%</span>
              </div>
              <div class="flex justify-between">
                <span>交割窗口</span>
                <span class="font-mono">≤ 5天</span>
              </div>
              <div class="flex justify-between">
                <span>COT商业</span>
                <span class="font-mono">REDUCED SHORT</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-base flex items-center gap-2">
                <span>📊</span>
                操作建议
              </CardTitle>
            </CardHeader>
            <CardContent class="text-sm space-y-2">
              <div class="flex justify-between">
                <span class="text-muted-foreground">5+ 利空</span>
                <Badge variant="destructive" class="text-xs">减仓80%</Badge>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">4 利空</span>
                <Badge variant="destructive" class="text-xs">减仓50%</Badge>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">3 利空</span>
                <Badge variant="secondary" class="text-xs">减仓30%</Badge>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">4+ 利多</span>
                <Badge class="text-xs">可加仓</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </template>
    </main>

    <!-- 底部 -->
    <footer class="border-t border-border/40 py-6 mt-8">
      <div class="container max-w-screen-2xl px-4 md:px-8 text-center text-sm text-muted-foreground">
        金银风险追踪 v2.0 · 数据来源 
        <a href="https://silverdata.io" target="_blank" class="text-foreground hover:underline">silverdata.io</a>
      </div>
    </footer>
  </div>
</template>
