import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import { Wallet, Globe, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/useLanguage'
import { useLocalWallet } from '@/lib/useLocalWallet'
import { WalletModal } from '@/components/WalletModal'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation()
  const { language, setLanguage, t } = useLanguage()
  const { getSelectedWallet } = useLocalWallet()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [testWalletModalOpen, setTestWalletModalOpen] = useState(false)

  const selectedWallet = getSelectedWallet()

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/metrics', label: t('nav.metrics') },
    { path: '/use-cases', label: t('nav.useCases') },
  ]

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ko' : 'en')
  }

  const handleWalletClick = () => {
    setTestWalletModalOpen(true)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const getWalletButtonText = () => {
    if (selectedWallet) {
      const address = selectedWallet.publicKey
      return `${address.slice(0, 4)}...${address.slice(-4)}`
    }
    return t('header.connectWallet')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/solana.png" alt="Solana" className="h-6 sm:h-7 w-auto" />
            <span className="text-lg sm:text-xl font-bold">Solana Payment Demos</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  location === item.path
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant={selectedWallet ? 'secondary' : 'default'}
              size="sm"
              onClick={handleWalletClick}
              className="h-9 px-3 mr-2 inline-flex items-center"
            >
              <Wallet className="h-4 w-4 mr-1.5 shrink-0 translate-y-[-0.5px]" />
              <span className="translate-y-[0.5px]">{getWalletButtonText()}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="h-9 px-3 inline-flex items-center"
            >
              <Globe className="h-4 w-4 mr-1.5 shrink-0 translate-y-[-0.5px]" />
              <span className="translate-y-[0.5px]">{language === 'en' ? 'EN' : '한국어'}</span>
            </Button>

          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-9 w-9 p-0"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* Mobile Navigation */}
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={closeMobileMenu}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      location === item.path
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Button
                  variant={selectedWallet ? 'secondary' : 'default'}
                  size="sm"
                  onClick={() => {
                    handleWalletClick()
                    closeMobileMenu()
                  }}
                  className="w-full justify-center"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {getWalletButtonText()}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLanguage}
                  className="w-full justify-center"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'EN' : '한국어'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="container mx-auto px-4 py-6 sm:py-8 flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 space-y-1">
          <p className="text-center text-xs text-muted-foreground">
            <a
              href="https://x.com/decentra1ized_"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Chaerin Kim
            </a>
            {' '}@ Solana Foundation
          </p>
          <p className="text-center text-[10px] text-muted-foreground/70">
            {language === 'ko'
              ? '오류 발생 시: '
              : 'Report issues: '}
            <a
              href="mailto:chaerin.kim@solana.org"
              className="hover:text-foreground transition-colors underline"
            >
              chaerin.kim@solana.org
            </a>
          </p>
        </div>
      </footer>

      <WalletModal isOpen={testWalletModalOpen} onClose={() => setTestWalletModalOpen(false)} />
    </div>
  )
}
