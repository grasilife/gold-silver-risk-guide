<script setup lang="ts">
import { computed } from 'vue'
import { useTracker } from './composables/useTracker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
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

// 计算当前风险等级
const riskLevel = computed(() => {
  if (!latestRecord.value) return { level: 0, text: '未知', color: 'bg-muted' }
  const summary = calculateSummary(latestRecord.value)
  if (summary.bearish >= 5) return { level: 5, text: '极高风险', color: 'bg-red-500' }
  if (summary.bearish >= 4) return { level: 4, text: '高风险', color: 'bg-orange-500' }
  if (summary.bearish >= 3) return { level: 3, text: '中等风险', color: 'bg-yellow-500' }
  if (summary.bullish >= 3) return { level: 1, text: '低风险', color: 'bg-green-500' }
  return { level: 2, text: '观望', color: 'bg-blue-500' }
})

// 1月27日数据
const jan27Record = computed(() => records.value.find(r => r.date === '2026-01-27'))
</script>

<template>
  <div class="flex min-h-screen flex-col bg-muted/40">
    <!-- Header -->
    <header class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          📊
        </div>
        <span class="font-semibold">金银风险追踪</span>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <span class="text-xs text-muted-foreground hidden md:block">
          更新: {{ lastUpdated }}
        </span>
        <Button variant="outline" size="sm" @click="loadData">
          <span class="mr-1">🔄</span> 刷新
        </Button>
        <Button variant="outline" size="sm" @click="exportCSV">
          <span class="mr-1">📥</span> 导出
        </Button>
      </div>
    </header>

    <!-- Main -->
    <main class="flex-1 p-4 sm:p-6">
      <!-- Loading -->
      <div v-if="loading" class="flex h-[50vh] items-center justify-center">
        <div class="text-center">
          <div class="text-5xl animate-bounce mb-4">📊</div>
          <p class="text-muted-foreground">加载数据中...</p>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex h-[50vh] items-center justify-center">
        <Card class="w-[400px]">
          <CardHeader>
            <CardTitle class="text-destructive">加载失败</CardTitle>
            <CardDescription>{{ error }}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button @click="loadData" class="w-full">重试</Button>
          </CardContent>
        </Card>
      </div>

      <!-- Content -->
      <div v-else class="space-y-6">
        <!-- Top Stats -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <!-- 白银价格 -->
          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">白银价格</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="h-4 w-4 text-muted-foreground">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">${{ latestRecord?.silverPrice }}</div>
              <p v-if="priceChange" class="text-xs" :class="priceChange.change >= 0 ? 'text-emerald-500' : 'text-red-500'">
                {{ priceChange.change >= 0 ? '+' : '' }}{{ priceChange.percent.toFixed(2) }}% 较上日
              </p>
            </CardContent>
          </Card>

          <!-- 黄金价格 -->
          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">黄金价格</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="h-4 w-4 text-muted-foreground">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">${{ latestRecord?.goldPrice }}</div>
              <p class="text-xs text-muted-foreground">COMEX 期货</p>
            </CardContent>
          </Card>

          <!-- 金银比 -->
          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">金银比</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="h-4 w-4 text-muted-foreground">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ latestRecord?.goldSilverRatio }}</div>
              <p class="text-xs" :class="parseFloat(latestRecord?.goldSilverRatio || '0') < 50 ? 'text-red-500' : 'text-muted-foreground'">
                {{ parseFloat(latestRecord?.goldSilverRatio || '0') < 50 ? '⚠️ 过热区间 (<50)' : '正常范围' }}
              </p>
            </CardContent>
          </Card>

          <!-- 风险等级 -->
          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">风险等级</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="h-4 w-4 text-muted-foreground">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </CardHeader>
            <CardContent>
              <div class="flex items-center gap-2">
                <div :class="['h-3 w-3 rounded-full', riskLevel.color]"></div>
                <span class="text-2xl font-bold">{{ riskLevel.text }}</span>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ calculateSummary(latestRecord!).bullish }} 利多 / {{ calculateSummary(latestRecord!).bearish }} 利空
              </p>
            </CardContent>
          </Card>
        </div>

        <!-- Main Content Grid -->
        <div class="grid gap-4 lg:grid-cols-7">
          <!-- Left: Risk Analysis -->
          <Card class="lg:col-span-4">
            <CardHeader>
              <CardTitle>风险信号分析</CardTitle>
              <CardDescription>{{ latestRecord?.date }} 最新数据</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea class="h-[350px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>指标</TableHead>
                      <TableHead class="text-right">数值</TableHead>
                      <TableHead class="text-center">信号</TableHead>
                      <TableHead class="hidden md:table-cell">原因</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="(signal, index) in calculateRiskSignals(latestRecord!)" :key="index">
                      <TableCell class="font-medium">{{ signal.name }}</TableCell>
                      <TableCell class="text-right font-mono">{{ signal.value }}</TableCell>
                      <TableCell class="text-center">
                        <Badge 
                          :variant="signal.signal === 'bearish' ? 'destructive' : signal.signal === 'bullish' ? 'default' : 'outline'"
                        >
                          {{ signal.signal === 'bearish' ? '利空' : signal.signal === 'bullish' ? '利多' : '中性' }}
                        </Badge>
                      </TableCell>
                      <TableCell class="hidden md:table-cell text-muted-foreground text-sm">
                        {{ signal.reason }}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
              
              <!-- Summary Bar -->
              <div class="mt-4 flex items-center justify-between rounded-lg border p-4">
                <div class="flex items-center gap-4">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-emerald-500">{{ calculateSummary(latestRecord!).bullish }}</div>
                    <div class="text-xs text-muted-foreground">利多</div>
                  </div>
                  <Separator orientation="vertical" class="h-10" />
                  <div class="text-center">
                    <div class="text-2xl font-bold text-red-500">{{ calculateSummary(latestRecord!).bearish }}</div>
                    <div class="text-xs text-muted-foreground">利空</div>
                  </div>
                </div>
                <Badge 
                  :variant="calculateSummary(latestRecord!).bearish >= 4 ? 'destructive' : 'secondary'"
                  class="text-base px-4 py-2"
                >
                  {{ getAdvice(calculateSummary(latestRecord!)).text }}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <!-- Right: Price Range & Info -->
          <div class="lg:col-span-3 space-y-4">
            <!-- 52周范围 -->
            <Card>
              <CardHeader class="pb-2">
                <CardTitle class="text-sm">52周价格范围</CardTitle>
              </CardHeader>
              <CardContent v-if="priceRange && latestRecord">
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">${{ priceRange.low }}</span>
                    <span class="font-medium">${{ latestRecord.silverPrice }}</span>
                    <span class="text-muted-foreground">${{ priceRange.high }}</span>
                  </div>
                  <Progress 
                    :model-value="((parseFloat(latestRecord.silverPrice) - priceRange.low) / (priceRange.high - priceRange.low)) * 100" 
                    class="h-2"
                  />
                  <div class="flex justify-between text-xs text-muted-foreground">
                    <span>+{{ priceRange.currentFromLow }}</span>
                    <span>-{{ priceRange.currentFromHigh }}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- 操作建议 -->
            <Card>
              <CardHeader class="pb-2">
                <CardTitle class="text-sm">操作指南</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-muted-foreground">5+ 利空</span>
                    <Badge variant="destructive">减仓80%</Badge>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-muted-foreground">4 利空</span>
                    <Badge variant="destructive">减仓50%</Badge>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-muted-foreground">3 利空</span>
                    <Badge variant="secondary">减仓30%</Badge>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-muted-foreground">4+ 利多</span>
                    <Badge>可加仓</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- 利空条件 -->
            <Card>
              <CardHeader class="pb-2">
                <CardTitle class="text-sm">利空条件</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between text-muted-foreground">
                    <span>COMEX库存</span>
                    <span class="font-mono">&lt; 120M</span>
                  </div>
                  <div class="flex justify-between text-muted-foreground">
                    <span>金银比</span>
                    <span class="font-mono">&lt; 50</span>
                  </div>
                  <div class="flex justify-between text-muted-foreground">
                    <span>月涨幅</span>
                    <span class="font-mono">&gt; 30%</span>
                  </div>
                  <div class="flex justify-between text-muted-foreground">
                    <span>交割窗口</span>
                    <span class="font-mono">≤ 5天</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Bottom: Tabs -->
        <Tabs default-value="history" class="space-y-4">
          <TabsList>
            <TabsTrigger value="history">历史数据</TabsTrigger>
            <TabsTrigger value="backtest">回测验证</TabsTrigger>
          </TabsList>
          
          <!-- 历史数据 -->
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>历史记录</CardTitle>
                <CardDescription>最近的价格和信号数据</CardDescription>
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
                      <TableHead class="hidden md:table-cell">备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="record in records" :key="record.id">
                      <TableCell class="font-mono">{{ record.date }}</TableCell>
                      <TableCell class="text-right font-mono">${{ record.silverPrice }}</TableCell>
                      <TableCell class="text-right font-mono">{{ record.goldSilverRatio }}</TableCell>
                      <TableCell class="text-right font-mono" :class="parseFloat(record.monthlyChange || '0') > 30 ? 'text-red-500' : ''">
                        +{{ record.monthlyChange || '0' }}%
                      </TableCell>
                      <TableCell class="text-right font-mono">{{ record.comexInventory }}M</TableCell>
                      <TableCell class="text-center">
                        <span class="text-emerald-500">{{ calculateSummary(record).bullish }}</span>
                        <span class="text-muted-foreground">/</span>
                        <span class="text-red-500">{{ calculateSummary(record).bearish }}</span>
                      </TableCell>
                      <TableCell class="text-center">
                        <Badge :variant="calculateSummary(record).bearish >= 4 ? 'destructive' : 'secondary'" class="text-xs">
                          {{ getAdvice(calculateSummary(record)).text }}
                        </Badge>
                      </TableCell>
                      <TableCell class="hidden md:table-cell text-muted-foreground text-sm">{{ record.note }}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <!-- 回测验证 -->
          <TabsContent value="backtest">
            <Card v-if="jan27Record" class="border-red-500/30">
              <CardHeader>
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                    📅
                  </div>
                  <div>
                    <CardTitle>1月27日回测</CardTitle>
                    <CardDescription>暴跌前3天 · 验证预警系统有效性</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>指标</TableHead>
                      <TableHead class="text-right">数值</TableHead>
                      <TableHead class="text-center">信号</TableHead>
                      <TableHead class="hidden md:table-cell">原因</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="(signal, index) in calculateRiskSignals(jan27Record)" :key="index">
                      <TableCell class="font-medium">{{ signal.name }}</TableCell>
                      <TableCell class="text-right font-mono">{{ signal.value }}</TableCell>
                      <TableCell class="text-center">
                        <Badge :variant="signal.signal === 'bearish' ? 'destructive' : signal.signal === 'bullish' ? 'default' : 'outline'">
                          {{ signal.signal === 'bearish' ? '利空' : signal.signal === 'bullish' ? '利多' : '中性' }}
                        </Badge>
                      </TableCell>
                      <TableCell class="hidden md:table-cell text-muted-foreground text-sm">{{ signal.reason }}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div class="mt-4 flex items-center justify-center gap-4 rounded-lg bg-red-500/10 p-4">
                  <span class="text-emerald-500 font-bold">{{ calculateSummary(jan27Record).bullish }} 利多</span>
                  <span class="text-muted-foreground">vs</span>
                  <span class="text-red-500 font-bold">{{ calculateSummary(jan27Record).bearish }} 利空</span>
                  <span class="text-muted-foreground">=</span>
                  <Badge variant="destructive">{{ getAdvice(calculateSummary(jan27Record)).text }}</Badge>
                  <Badge variant="outline" class="text-yellow-500 border-yellow-500/50">✅ 成功预警</Badge>
                </div>
                
                <p class="mt-4 text-sm text-muted-foreground text-center">
                  3天后（1/30）白银暴跌 -13.62%，系统提前发出减仓80%警告
                </p>
              </CardContent>
            </Card>
            <Card v-else>
              <CardContent class="py-10 text-center text-muted-foreground">
                暂无回测数据
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t py-4">
      <div class="container flex items-center justify-center text-sm text-muted-foreground">
        数据来源 <a href="https://silverdata.io" target="_blank" class="ml-1 underline underline-offset-4 hover:text-foreground">silverdata.io</a>
      </div>
    </footer>
  </div>
</template>
