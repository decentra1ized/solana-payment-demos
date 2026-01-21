import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code, X, Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/useLanguage'

interface PackageLink {
  name: string
  url: string
}

interface CodeTab {
  id: string
  label: string
  labelKo: string
  code: string
  codeKo?: string
  packages?: PackageLink[]
}

interface CodePreviewProps {
  tabs: CodeTab[]
}

export function CodePreview({ tabs }: CodePreviewProps) {
  const { language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '')
  const [copied, setCopied] = useState(false)

  const t = {
    en: {
      viewCode: 'Code',
      close: 'Close',
      copied: 'Copied!',
    },
    ko: {
      viewCode: '코드',
      close: '닫기',
      copied: '복사됨!',
    }
  }

  const text = t[language]

  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const activeCode = (language === 'ko' && activeTabData?.codeKo) ? activeTabData.codeKo : (activeTabData?.code || '')

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(activeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (tabs.length === 0) return null

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`gap-1.5 text-xs h-7 ${isOpen ? 'bg-violet-50 border-violet-200 text-violet-700' : ''}`}
      >
        <Code className="h-3.5 w-3.5" />
        {text.viewCode}
      </Button>

      {/* Code Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-[90vw] max-w-2xl"
          >
            <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex gap-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-violet-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {language === 'ko' ? tab.labelKo : tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-6 px-2 text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-green-400" />
                        <span className="text-xs text-green-400">{text.copied}</span>
                      </>
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Code Content */}
              <div className="max-h-80 overflow-auto">
                <pre className="p-4 text-xs leading-relaxed">
                  <code className="text-gray-300 font-mono whitespace-pre">
                    {activeCode}
                  </code>
                </pre>
              </div>

              {/* Package Links */}
              {activeTabData?.packages && activeTabData.packages.length > 0 && (
                <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700 flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] text-gray-500">Packages:</span>
                  {activeTabData.packages.map((pkg) => (
                    <a
                      key={pkg.name}
                      href={pkg.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      {pkg.name}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
