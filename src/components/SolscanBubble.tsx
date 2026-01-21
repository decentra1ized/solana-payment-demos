import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/useLanguage'

interface SolscanBubbleProps {
  show: boolean
  customMessage?: { ko: string; en: string }
  centered?: boolean
}

export function SolscanBubble({ show, customMessage, centered = false }: SolscanBubbleProps) {
  const { language } = useLanguage()

  if (!show) return null

  const bubbleText = customMessage
    ? (language === 'ko' ? customMessage.ko : customMessage.en)
    : (language === 'ko' ? '실제 트랜잭션 확인 가능!' : 'View real transaction!')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3, type: 'spring' }}
      className={`absolute -top-8 z-50 ${centered ? 'left-1/2 -translate-x-1/2' : 'left-0'}`}
    >
      <div className="relative bg-violet-600 text-white text-[9px] font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
        {bubbleText}
        {/* Speech bubble tail */}
        <div className={`absolute -bottom-1 w-2 h-2 bg-violet-600 rotate-45 ${centered ? 'left-1/2 -translate-x-1/2' : 'left-4'}`} />
      </div>
    </motion.div>
  )
}
