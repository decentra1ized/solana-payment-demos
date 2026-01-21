import { Link } from 'wouter'
import { motion } from 'framer-motion'
import { ArrowRight, ExternalLink, Globe, CreditCard, Wallet, Users, Code, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { adoptersData } from '@/data/adopters'
import { useLanguage } from '@/lib/useLanguage'

export function Home() {
  const { language } = useLanguage()

  const t = {
    en: {
      heroTitle: 'Solana Payment Solutions',
      heroSubtitle: 'Interactive demo showcasing Solana-based payment infrastructure. Explore performance metrics and real-world use cases.',
      viewMetrics: 'View Metrics',
      exploreUseCases: 'Explore Use Cases',
      whySolana: 'Why Solana for Payments?',
      whySolanaDesc: 'Fast, low-cost, and globally accessible payment infrastructure',
      trustedBy: 'Trusted by Industry Leaders',
      trustedByDesc: 'Global financial institutions building on Solana',
      live: 'Live',
      launching: '2026',
      crossBorder: 'Cross-Border Payments',
      crossBorderDesc: '24/7 fast cheap rails to power remittances and previously complex B2B global payments.',
      cardSettlement: 'Card Settlement',
      cardSettlementDesc: "The world's largest merchant acquirers and card rails increasingly use Solana to settle card payments.",
      treasury: 'Efficient Treasury',
      treasuryDesc: "Avoid prefunding in banks around the world and send money exactly where it's needed as fast as the internet.",
      payouts: 'Global Payouts',
      payoutsDesc: 'Pay contractors and gig workers anywhere in the world with minimal fees. They get paid fast.',
      devTools: 'Developer Tools',
      devToolsDesc: 'Build on Solana with official SDKs and libraries',
      viewDocs: 'View Docs',
    },
    ko: {
      heroTitle: 'Solana 결제 솔루션',
      heroSubtitle: 'Solana 기반 결제 인프라를 보여주는 인터랙티브 데모입니다. 성능 지표와 실제 사용 사례를 살펴보세요.',
      viewMetrics: '지표 보기',
      exploreUseCases: '사용 사례 탐색',
      whySolana: '왜 Solana로 결제해야 할까요?',
      whySolanaDesc: '빠르고 저렴하며 전 세계에서 접근 가능한 결제 인프라',
      trustedBy: '업계 리더들의 신뢰',
      trustedByDesc: 'Solana 위에서 구축하는 글로벌 금융 기관들',
      live: '운영 중',
      launching: '2026',
      crossBorder: '해외 송금',
      crossBorderDesc: '24시간 빠르고 저렴한 인프라로 송금 및 복잡한 B2B 글로벌 결제를 지원합니다.',
      cardSettlement: '카드 정산',
      cardSettlementDesc: '세계 최대의 가맹점 인수사와 카드 네트워크가 점점 더 Solana를 카드 결제 정산에 사용하고 있습니다.',
      treasury: '효율적인 자금 관리',
      treasuryDesc: '전 세계 은행에 사전 자금을 예치할 필요 없이 인터넷 속도로 필요한 곳에 정확히 송금합니다.',
      payouts: '글로벌 지급',
      payoutsDesc: '최소한의 수수료로 전 세계 계약자와 긱 워커에게 빠르게 지급합니다.',
      devTools: '개발자 도구',
      devToolsDesc: '공식 SDK와 라이브러리로 Solana 위에서 개발하세요',
      viewDocs: '문서 보기',
    }
  }

  const text = t[language]

  const paymentAdvantages = [
    {
      icon: Globe,
      title: text.crossBorder,
      description: text.crossBorderDesc,
    },
    {
      icon: CreditCard,
      title: text.cardSettlement,
      description: text.cardSettlementDesc,
    },
    {
      icon: Wallet,
      title: text.treasury,
      description: text.treasuryDesc,
    },
    {
      icon: Users,
      title: text.payouts,
      description: text.payoutsDesc,
    },
  ]

  const devTools = [
    {
      name: '@solana/web3.js',
      description: language === 'ko'
        ? '트랜잭션 생성, 지갑 관리, RPC 통신을 위한 핵심 Solana JavaScript SDK'
        : 'Core Solana JavaScript SDK for transactions, wallet management, and RPC communication',
      npmUrl: 'https://www.npmjs.com/package/@solana/web3.js',
      docsUrl: 'https://solana.com/docs/clients/javascript',
    },
    {
      name: '@solana/pay',
      description: language === 'ko'
        ? 'QR 코드 결제, 결제 요청 URL, 트랜잭션 추적을 위한 Solana Pay 프로토콜 SDK'
        : 'Solana Pay protocol SDK for QR code payments, payment request URLs, and transaction tracking',
      npmUrl: 'https://www.npmjs.com/package/@solana/pay',
      docsUrl: 'https://docs.solanapay.com/',
    },
    {
      name: '@solana/spl-token',
      description: language === 'ko'
        ? '토큰 생성, 전송, 계정 관리를 위한 SPL 토큰 프로그램 SDK'
        : 'SPL Token program SDK for token creation, transfers, and account management',
      npmUrl: 'https://www.npmjs.com/package/@solana/spl-token',
      docsUrl: 'https://spl.solana.com/token',
    },
    {
      name: 'commerce-kit',
      description: language === 'ko'
        ? '즉시 결제 확인, 체크아웃 통합, 판매자 도구를 위한 Solana Commerce SDK'
        : 'Solana Commerce SDK for instant payment verification, checkout integration, and merchant tools',
      npmUrl: 'https://www.npmjs.com/package/@solana/commerce-kit',
      docsUrl: 'https://github.com/solana-foundation/commerce-kit',
    },
  ]

  return (
    <div className="space-y-12 sm:space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-4 sm:space-y-6 py-8 sm:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight"
        >
          {text.heroTitle}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2"
        >
          {text.heroSubtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0"
        >
          <Link href="/metrics">
            <Button size="lg" className="w-full sm:w-auto">
              {text.viewMetrics}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/use-cases">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              {text.exploreUseCases}
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Payment Advantages Section */}
      <section className="space-y-6 sm:space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-center space-y-2"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
            {text.whySolana}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {text.whySolanaDesc}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {paymentAdvantages.map((advantage, index) => (
            <motion.div
              key={advantage.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader className="p-4 sm:p-6">
                  <advantage.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-2" />
                  <CardTitle className="text-base sm:text-lg">{advantage.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {advantage.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Developer Tools Section */}
      <section className="space-y-6 sm:space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-center space-y-2"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
            <Code className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            {text.devTools}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {text.devToolsDesc}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {devTools.map((tool, index) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card className="h-full flex flex-col">
                <CardHeader className="p-4 sm:p-6 pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm sm:text-base font-mono">{tool.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto p-4 pt-2 flex gap-2">
                  <a
                    href={tool.npmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded flex items-center gap-1 transition-colors"
                  >
                    npm
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href={tool.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded flex items-center gap-1 transition-colors"
                  >
                    {text.viewDocs}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Adopters Section */}
      <section className="space-y-6 sm:space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center space-y-2"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
            {text.trustedBy}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {text.trustedByDesc}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {adoptersData.map((adopter, index) => (
            <motion.a
              key={adopter.id}
              href={adopter.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="block group"
            >
              <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-center justify-between">
                    <img
                      src={adopter.logo}
                      alt={adopter.name}
                      className="h-6 sm:h-8 w-auto object-contain"
                    />
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          adopter.status === 'live'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {adopter.status === 'live' ? text.live : text.launching}
                      </span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {language === 'ko' ? adopter.descriptionKo : adopter.description}
                  </p>
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {language === 'ko' ? adopter.highlightKo : adopter.highlight}
                      </p>
                      <p className="text-base sm:text-lg font-bold text-primary">
                        {adopter.highlightValue}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.a>
          ))}
        </div>
      </section>
    </div>
  )
}
