import { useState, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, ChevronUp, Play, Code, ExternalLink, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCasesData } from '@/data/useCases'
import { useLanguage } from '@/lib/useLanguage'

// Lazy load demo components for better performance
const SolanaPayQRDemo = lazy(() => import('@/components/demos/SolanaPayQRDemo').then(m => ({ default: m.SolanaPayQRDemo })))
const BasicPaymentDemo = lazy(() => import('@/components/demos/BasicPaymentDemo').then(m => ({ default: m.BasicPaymentDemo })))
const UsdcTransferDemo = lazy(() => import('@/components/demos/UsdcTransferDemo').then(m => ({ default: m.UsdcTransferDemo })))
const PaymentWithMemoDemo = lazy(() => import('@/components/demos/PaymentWithMemoDemo').then(m => ({ default: m.PaymentWithMemoDemo })))
const BatchPaymentDemo = lazy(() => import('@/components/demos/BatchPaymentDemo').then(m => ({ default: m.BatchPaymentDemo })))
const FeeAbstractionDemo = lazy(() => import('@/components/demos/FeeAbstractionDemo').then(m => ({ default: m.FeeAbstractionDemo })))
const PrepaidCardDemo = lazy(() => import('@/components/demos/PrepaidCardDemo').then(m => ({ default: m.PrepaidCardDemo })))

// Demo loading fallback
function DemoLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

export function UseCases() {
  const { language } = useLanguage()
  const [expandedId, setExpandedId] = useState<string | null>('solana-pay-qr')
  const [showDemo, setShowDemo] = useState<string | null>('solana-pay-qr')
  const [demoKeys, setDemoKeys] = useState<Record<string, number>>({})

  const t = {
    en: {
      title: 'Use Case Demos',
      subtitle: 'Explore real-world Solana payment scenarios. These demos run on Devnet, a test environment similar to Mainnet but using test SOL with no real value.\nAll transactions are real and verifiable on Explorer. Create a wallet using the button in the top right to get started.',
      integrationSteps: 'Integration Steps',
      integrationPoints: 'Integration Points',
      assumptions: 'Assumptions',
      tryDemo: 'Try Demo',
      hideDemo: 'Hide Demo',
      noUseCases: 'No Use Cases Yet',
      noUseCasesDesc: 'Use cases will be added dynamically. Each demo will showcase specific payment scenarios with integration guides.',
      interactive: 'Interactive'
    },
    ko: {
      title: '사용 사례 데모',
      subtitle: 'Solana 기반의 실제 결제 시나리오를 체험해보세요. 이 데모는 메인넷과 유사하지만 실제 가치가 없는 테스트 SOL을 사용하는 Devnet에서 동작합니다.\n모든 트랜잭션은 실제로 발생하며 Explorer에서 확인하실 수 있습니다. 오른쪽 상단의 버튼을 눌러 지갑을 개설하고 시작하세요.',
      integrationSteps: '통합 단계',
      integrationPoints: '통합 포인트',
      assumptions: '전제 조건',
      tryDemo: '데모 체험',
      hideDemo: '데모 숨기기',
      noUseCases: '아직 사용 사례가 없습니다',
      noUseCasesDesc: '사용 사례가 동적으로 추가됩니다. 각 데모는 통합 가이드와 함께 특정 결제 시나리오를 보여줍니다.',
      interactive: '인터랙티브'
    }
  }

  const text = t[language]

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const toggleDemo = (id: string) => {
    if (showDemo === id) {
      setShowDemo(null)
    } else {
      // Increment key to force remount (reset demo state)
      setDemoKeys(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
      setShowDemo(id)
    }
  }

  const getDemoComponent = (id: string) => {
    const key = `${id}-${demoKeys[id] || 0}`
    switch (id) {
      case 'solana-pay-qr':
        return <SolanaPayQRDemo key={key} />
      case 'basic-payment':
        return <BasicPaymentDemo key={key} />
      case 'usdc-transfer':
        return <UsdcTransferDemo key={key} />
      case 'payment-with-memo':
        return <PaymentWithMemoDemo key={key} />
      case 'batch-payment':
        return <BatchPaymentDemo key={key} />
      case 'fee-abstraction':
        return <FeeAbstractionDemo key={key} />
      case 'prepaid-card':
        return <PrepaidCardDemo key={key} />
      default:
        return null
    }
  }

  // Card style - soft lavender with left purple accent (like Solana Advantages card)
  const getCardStyle = (): React.CSSProperties => {
    return {
      background: 'linear-gradient(135deg, #FAFAFF 0%, #F5F3FF 50%, #F0EBFF 100%)',
      borderLeft: '4px solid transparent',
      borderImage: 'linear-gradient(180deg, #A78BFA 0%, #8B5CF6 50%, #7C3AED 100%) 1',
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          {text.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground whitespace-pre-line"
        >
          {text.subtitle}
        </motion.p>
      </div>

      {useCasesData.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-secondary p-4 mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{text.noUseCases}</h3>
              <p className="text-muted-foreground max-w-sm">
                {text.noUseCasesDesc}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {useCasesData.map((useCase, index) => {
            const title = language === 'ko' ? useCase.titleKo : useCase.title
            const description = language === 'ko' ? useCase.descriptionKo : useCase.description
            const steps = language === 'ko' ? useCase.stepsKo : useCase.steps
            const integrationPoints = useCase.integrationPoints
            const assumptions = language === 'ko' ? useCase.assumptionsKo : useCase.assumptions
            const isExpanded = expandedId === useCase.id
            const isDemoVisible = showDemo === useCase.id

            return (
              <motion.div
                key={useCase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card
                  className="overflow-hidden shadow-sm border-0 rounded-xl"
                  style={getCardStyle()}
                >
                  {/* Clean Header */}
                  <div
                    className="p-5 sm:p-6 cursor-pointer"
                    onClick={() => toggleExpand(useCase.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-violet-500" />
                        <h3 className="text-lg sm:text-xl font-bold text-foreground">
                          {title}
                        </h3>
                        {useCase.hasDemo && (
                          <span className="text-[10px] px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full font-medium">
                            {text.interactive}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-violet-50"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm mt-2 ml-5">
                      {description}
                    </p>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="border-t border-violet-100" />
                        <CardContent className="space-y-6 p-6 bg-white/60 dark:bg-background/60">
                          {/* Demo Section */}
                          {useCase.hasDemo && (
                            <div className="space-y-4">
                              <Button
                                variant={isDemoVisible ? 'secondary' : 'default'}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleDemo(useCase.id)
                                }}
                                className="gap-2"
                              >
                                <Play className="h-4 w-4" />
                                {isDemoVisible ? text.hideDemo : text.tryDemo}
                              </Button>

                              <AnimatePresence>
                                {isDemoVisible && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="bg-muted/30 rounded-lg p-4 border">
                                      <Suspense fallback={<DemoLoader />}>
                                        {getDemoComponent(useCase.id)}
                                      </Suspense>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* Integration Steps */}
                          <div>
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <Code className="h-4 w-4" />
                              {text.integrationSteps}
                            </h4>
                            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1.5 ml-1">
                              {steps.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          </div>

                          {/* Integration Points */}
                          {integrationPoints && integrationPoints.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-3">{text.integrationPoints}</h4>
                              <div className="flex flex-wrap gap-2">
                                {integrationPoints.map((point, i) => (
                                  <a
                                    key={i}
                                    href={point.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-full font-mono transition-colors group"
                                  >
                                    {language === 'ko' ? point.nameKo : point.name}
                                    <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Assumptions */}
                          {assumptions && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">{text.assumptions}</h4>
                              <p className="text-sm text-muted-foreground">
                                {assumptions}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
