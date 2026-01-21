import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { DollarSign, Users, Zap, Clock, TrendingUp, Activity, ExternalLink } from 'lucide-react'
import { metricsData } from '@/data/metrics'
import { useLanguage } from '@/lib/useLanguage'

export function Metrics() {
  const { language } = useLanguage()

  const t = {
    en: {
      title: 'Stablecoin & Payment Metrics',
      subtitle: 'Real-world stablecoin volume and performance data across chains',
      globalStatsTitle: 'Global Stablecoin Market (All-Time)',
      totalVolume: 'Total Volume',
      adjustedVolume: 'Adjusted Volume',
      totalTx: 'Total Transactions',
      activeAddresses: 'Active Addresses',
      txCountTitle: 'Stablecoin Transaction Count by Chain',
      txCountDesc: 'Total transactions in billions, by transaction size',
      duneChartTitle: 'Solana Median Transaction Fee',
      duneChartDesc: 'Median fee shows what typical users actually pay, unaffected by outliers',
      solanaAdvantage: 'Solana Advantage',
      solanaAdvantageDesc: 'Why Solana leads in stablecoin payments',
      lowestCost: 'Base Transaction Fee',
      fastestBlockTime: 'Fast Block Time',
      highThroughput: 'High Throughput',
      solana: 'Solana',
      ethereum: 'Ethereum',
      source: 'Source',
      sources: 'Sources',
    },
    ko: {
      title: '스테이블코인 & 결제 지표',
      subtitle: '체인별 실제 스테이블코인 거래량 및 성능 데이터',
      globalStatsTitle: '글로벌 스테이블코인 시장 (전체 기간)',
      totalVolume: '총 거래량',
      adjustedVolume: '조정 거래량',
      totalTx: '총 트랜잭션',
      activeAddresses: '활성 주소',
      txCountTitle: '체인별 스테이블코인 트랜잭션 수',
      txCountDesc: '거래 규모별 총 트랜잭션 수 (10억 단위)',
      duneChartTitle: 'Solana 중앙값 트랜잭션 수수료',
      duneChartDesc: '중앙값 수수료는 이상치에 영향받지 않아 실제 사용자가 지불하는 비용을 보여줍니다',
      solanaAdvantage: 'Solana의 강점',
      solanaAdvantageDesc: 'Solana가 스테이블코인 결제에서 앞서는 이유',
      lowestCost: '기본 트랜잭션 수수료',
      fastestBlockTime: '빠른 블록 시간',
      highThroughput: '높은 처리량',
      solana: 'Solana',
      ethereum: 'Ethereum',
      source: '출처',
      sources: '출처',
    }
  }

  const text = t[language]
  const globalStats = metricsData.globalStats

  const globalStatCards = [
    {
      label: text.totalVolume,
      value: language === 'ko' ? globalStats.totalVolumeKo : globalStats.totalVolume,
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      label: text.adjustedVolume,
      value: language === 'ko' ? globalStats.adjustedVolumeKo : globalStats.adjustedVolume,
      icon: TrendingUp,
      color: 'text-blue-500',
    },
    {
      label: text.totalTx,
      value: language === 'ko' ? globalStats.totalTransactionsKo : globalStats.totalTransactions,
      icon: Zap,
      color: 'text-purple-500',
    },
    {
      label: text.activeAddresses,
      value: language === 'ko' ? globalStats.activeAddressesKo : globalStats.activeAddresses,
      icon: Users,
      color: 'text-orange-500',
    },
  ]

  const solanaAdvantages = [
    {
      title: text.lowestCost,
      value: '5,000 lamports',
      description: language === 'ko'
        ? '서명당 기본 수수료 (USD는 SOL 가격에 따라 변동), 평균 ~$0.00025'
        : 'Base fee per signature (USD varies with SOL price), avg ~$0.00025',
      icon: DollarSign,
    },
    {
      title: text.fastestBlockTime,
      value: '~400ms',
      description: language === 'ko'
        ? '슬롯 시간 (Alpenglow 업데이트로 ~120ms 예정)'
        : 'Slot time (Alpenglow upgrade: ~120ms)',
      icon: Clock,
    },
    {
      title: text.highThroughput,
      value: '1,000+ TPS',
      description: language === 'ko'
        ? '실사용 기준 (이론적 최대 65,000+ TPS)'
        : 'In practice (theoretical max 65,000+ TPS)',
      icon: Activity,
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold"
        >
          {text.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm sm:text-base text-muted-foreground"
        >
          {text.subtitle}
        </motion.p>
      </div>

      {/* Global Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{text.globalStatsTitle}</h2>
          <a
            href="https://visaonchainanalytics.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            {text.source}: Visa Onchain Analytics
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {globalStatCards.map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.color}`} />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold tabular-nums">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Solana Advantages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-purple-500/10 via-transparent to-green-500/10 border-purple-500/20">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#9945FF]" />
              {text.solanaAdvantage}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {text.solanaAdvantageDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {solanaAdvantages.map((advantage) => (
                <div key={advantage.title} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <advantage.icon className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{advantage.title}</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {advantage.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{advantage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Stablecoin Transaction Count by Chain */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">{text.txCountTitle}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {text.txCountDesc}
                  </CardDescription>
                </div>
                <a
                  href="https://visaonchainanalytics.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  Visa Onchain Analytics
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className="h-[300px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData.txCountByChain}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="chain" className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                    <YAxis
                      className="text-[10px] sm:text-xs"
                      tick={{ fontSize: 10 }}
                      width={35}
                      tickFormatter={(value) => `${value}B`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3, style: { transition: 'all 0.2s ease-in-out' } }}
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = {
                          under100: '< $100',
                          to1k: '$100 - $1k',
                          to10k: '$1k - $10k',
                          to100k: '$10k - $100k',
                          to1m: '$100k - $1M',
                          to10m: '$1M - $10M',
                          over10m: '> $10M',
                        }
                        return [`${value}B`, labels[name] || name]
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '10px' }}
                      formatter={(value) => {
                        const labels: Record<string, string> = {
                          under100: '< $100',
                          to1k: '$100-$1k',
                          to10k: '$1k-$10k',
                          to100k: '$10k-$100k',
                          to1m: '$100k-$1M',
                          to10m: '$1M-$10M',
                          over10m: '> $10M',
                        }
                        return labels[value] || value
                      }}
                    />
                    <Bar dataKey="under100" stackId="a" fill="#7C3AED" name="under100" />
                    <Bar dataKey="to1k" stackId="a" fill="#8B5CF6" name="to1k" />
                    <Bar dataKey="to10k" stackId="a" fill="#A78BFA" name="to10k" />
                    <Bar dataKey="to100k" stackId="a" fill="#C4B5FD" name="to100k" />
                    <Bar dataKey="to1m" stackId="a" fill="#DDD6FE" name="to1m" />
                    <Bar dataKey="to10m" stackId="a" fill="#EDE9FE" name="to10m" />
                    <Bar dataKey="over10m" stackId="a" fill="#F5F3FF" name="over10m" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dune Analytics TPS Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">{text.duneChartTitle}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {text.duneChartDesc}
                  </CardDescription>
                </div>
                <a
                  href="https://dune.com/queries/5943670/9593199"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  Dune Analytics
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className="h-[350px] sm:h-[400px]">
                <iframe
                  src="https://dune.com/embeds/5943670/9593199"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  title="Solana Median Transaction Fee"
                  className="rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  )
}
