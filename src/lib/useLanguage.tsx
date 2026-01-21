import { useState, useEffect, createContext, useContext } from 'react'

export type Language = 'en' | 'ko'

// Translation strings
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.metrics': 'Performance Metrics',
    'nav.useCases': 'Use Cases',

    // Header
    'header.connectWallet': 'Connect Wallet',
    'header.connected': 'Connected',

    // Home
    'home.title': 'Solana Payment Solutions',
    'home.subtitle': 'Interactive demo showcasing Solana-based payment infrastructure. Explore performance metrics and real-world use cases.',
    'home.viewMetrics': 'View Metrics',
    'home.exploreUseCases': 'Explore Use Cases',
    'home.highPerformance': 'High Performance',
    'home.highPerformanceDesc': 'Sub-second finality with 65,000+ TPS theoretical throughput',
    'home.lowCost': 'Low Cost',
    'home.lowCostDesc': 'Average transaction fees under $0.001',
    'home.developerFriendly': 'Developer Friendly',
    'home.developerFriendlyDesc': 'Rich ecosystem with robust tooling and documentation',

    // Metrics
    'metrics.title': 'Solana Performance Metrics',
    'metrics.subtitle': 'Real-time network statistics (simulated for demo)',
    'metrics.live': 'Live',
    'metrics.lastUpdated': 'Last updated',
    'metrics.tps': 'TPS',
    'metrics.tpsDesc': 'Transactions per second',
    'metrics.slot': 'Slot',
    'metrics.slotDesc': 'Current slot height',
    'metrics.blockHeight': 'Block Height',
    'metrics.blockHeightDesc': 'Current block height',
    'metrics.epoch': 'Epoch',
    'metrics.epochDesc': 'Current epoch progress',
    'metrics.totalTx': 'Total Transactions',
    'metrics.totalTxDesc': 'All-time transactions',
    'metrics.validators': 'Active Validators',
    'metrics.validatorsDesc': 'Current validators',
    'metrics.throughput': 'Transaction Throughput',
    'metrics.comparison': 'Network Comparison',
    'metrics.costEstimator': 'Cost Estimator',
    'metrics.dailyVolume': 'Daily Transaction Volume',
    'metrics.priorityFee': 'Priority Fee Level',
    'metrics.estimatedCost': 'Estimated Daily Cost',

    // Use Cases
    'useCases.title': 'Use Case Demos',
    'useCases.subtitle': 'Explore real-world payment scenarios built on Solana.',
    'useCases.noUseCases': 'No Use Cases Yet',
    'useCases.noUseCasesDesc': 'Use cases will be added dynamically. Each demo will showcase specific payment scenarios with integration guides.',
  },
  ko: {
    // Navigation
    'nav.home': '홈',
    'nav.metrics': '성능 지표',
    'nav.useCases': '사용 사례',

    // Header
    'header.connectWallet': '지갑 연결',
    'header.connected': '연결됨',

    // Home
    'home.title': '솔라나 결제 솔루션',
    'home.subtitle': '솔라나 기반 결제 인프라를 보여주는 인터랙티브 데모입니다. 성능 지표와 실제 사용 사례를 살펴보세요.',
    'home.viewMetrics': '지표 보기',
    'home.exploreUseCases': '사용 사례 탐색',
    'home.highPerformance': '고성능',
    'home.highPerformanceDesc': '65,000+ TPS 이론적 처리량과 1초 미만의 완결성',
    'home.lowCost': '저비용',
    'home.lowCostDesc': '평균 거래 수수료 $0.001 미만',
    'home.developerFriendly': '개발자 친화적',
    'home.developerFriendlyDesc': '풍부한 생태계와 강력한 도구 및 문서',

    // Metrics
    'metrics.title': '솔라나 성능 지표',
    'metrics.subtitle': '실시간 네트워크 통계 (데모용 시뮬레이션)',
    'metrics.live': '실시간',
    'metrics.lastUpdated': '마지막 업데이트',
    'metrics.tps': 'TPS',
    'metrics.tpsDesc': '초당 트랜잭션',
    'metrics.slot': '슬롯',
    'metrics.slotDesc': '현재 슬롯 높이',
    'metrics.blockHeight': '블록 높이',
    'metrics.blockHeightDesc': '현재 블록 높이',
    'metrics.epoch': '에포크',
    'metrics.epochDesc': '현재 에포크 진행률',
    'metrics.totalTx': '총 트랜잭션',
    'metrics.totalTxDesc': '전체 트랜잭션',
    'metrics.validators': '활성 검증인',
    'metrics.validatorsDesc': '현재 검증인 수',
    'metrics.throughput': '트랜잭션 처리량',
    'metrics.comparison': '네트워크 비교',
    'metrics.costEstimator': '비용 계산기',
    'metrics.dailyVolume': '일일 거래량',
    'metrics.priorityFee': '우선 수수료 수준',
    'metrics.estimatedCost': '예상 일일 비용',

    // Use Cases
    'useCases.title': '사용 사례 데모',
    'useCases.subtitle': '솔라나 기반 실제 결제 시나리오를 살펴보세요.',
    'useCases.noUseCases': '사용 사례 없음',
    'useCases.noUseCasesDesc': '사용 사례가 동적으로 추가될 예정입니다. 각 데모는 통합 가이드와 함께 특정 결제 시나리오를 보여줍니다.',
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('language') as Language
      if (stored) return stored
      const browserLang = navigator.language.toLowerCase()
      return browserLang.startsWith('ko') ? 'ko' : 'en'
    }
    return 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
