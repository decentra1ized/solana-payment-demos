import { useState } from 'react'
import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token'
import { X, Plus, Coins, Copy, Check, ExternalLink, Wallet, Loader2, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/useLanguage'
import { useLocalWallet, USDC_MINT, USDC_DECIMALS } from '@/lib/useLocalWallet'

const FAUCET_SOL_AMOUNT = 0.01 // SOL amount from faucet
const FAUCET_USDC_AMOUNT = 0.05 // USDC amount from faucet
const MAX_AIRDROP_COUNT = 10 // Maximum airdrops per user
const AIRDROP_COUNT_KEY = 'solana_demo_airdrop_count'
const AIRDROP_RESET_KEY = 'solana_demo_airdrop_reset_time'
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

// Helper functions for airdrop count with 24-hour reset
function checkAndResetIfNeeded(): void {
  if (typeof window === 'undefined') return
  const lastReset = localStorage.getItem(AIRDROP_RESET_KEY)
  const now = Date.now()

  if (!lastReset || now - parseInt(lastReset, 10) >= RESET_INTERVAL_MS) {
    // Reset count and update reset time
    localStorage.setItem(AIRDROP_COUNT_KEY, '0')
    localStorage.setItem(AIRDROP_RESET_KEY, String(now))
  }
}

function getAirdropCount(): number {
  if (typeof window === 'undefined') return 0
  checkAndResetIfNeeded()
  const count = localStorage.getItem(AIRDROP_COUNT_KEY)
  return count ? parseInt(count, 10) : 0
}

function incrementAirdropCount(): void {
  checkAndResetIfNeeded()
  const current = getAirdropCount()
  localStorage.setItem(AIRDROP_COUNT_KEY, String(current + 1))
}

function getRemainingAirdrops(): number {
  return Math.max(0, MAX_AIRDROP_COUNT - getAirdropCount())
}

function getTimeUntilReset(): string {
  if (typeof window === 'undefined') return ''
  const lastReset = localStorage.getItem(AIRDROP_RESET_KEY)
  if (!lastReset) return ''

  const resetTime = parseInt(lastReset, 10) + RESET_INTERVAL_MS
  const remaining = resetTime - Date.now()

  if (remaining <= 0) return ''

  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))

  return `${hours}h ${minutes}m`
}

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { language } = useLanguage()
  const {
    wallets,
    selectedWalletId,
    setSelectedWalletId,
    addWallet,
    updateBalance,
    updateUsdcBalance,
    canAddWallet,
    getSelectedWallet
  } = useLocalWallet()
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [isRequestingAirdrop, setIsRequestingAirdrop] = useState(false)
  const [isRequestingUsdc, setIsRequestingUsdc] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [airdropMessage, setAirdropMessage] = useState('')
  const [usdcMessage, setUsdcMessage] = useState('')
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null)
  const [lastUsdcTxSignature, setLastUsdcTxSignature] = useState<string | null>(null)

  const t = {
    en: {
      title: 'Test Wallets',
      createTestWallet: 'Create Test Wallet',
      getPracticeSOL: 'Get Practice SOL',
      yourWallets: 'Your Test Wallets',
      publicKey: 'Public Key',
      balance: 'Balance',
      creating: 'Creating...',
      requesting: 'Requesting...',
      airdropSuccess: `Received ${FAUCET_SOL_AMOUNT} SOL!`,
      airdropError: 'Request failed. Try again later.',
      faucetUnavailable: 'Faucet temporarily unavailable',
      getPracticeUSDC: 'Get Practice USDC',
      usdcSuccess: `Received ${FAUCET_USDC_AMOUNT} USDC!`,
      receivingUSDC: 'Receive USDC - Wallet',
      viewOnSolscan: 'View on Solscan',
      copy: 'Copy',
      copied: 'Copied!',
      devnetOnly: 'Devnet Only',
      close: 'Close',
      savedLocally: 'Saved in browser',
      noWallet: 'Create test wallets to get started. Up to 3 wallets can be saved in your browser.',
      walletName: 'Wallet',
      selected: 'Selected',
      select: 'Select',
      maxWallets: 'Maximum 3 wallets',
      receivingSOL: 'Receive SOL - Wallet',
      airdropLimitReached: 'Airdrop limit reached (max 10)',
      remaining: 'remaining',
      resetsIn: 'Resets in',
    },
    ko: {
      title: '테스트 지갑',
      createTestWallet: '테스트 지갑 만들기',
      getPracticeSOL: '연습용 SOL 받기',
      yourWallets: '내 테스트 지갑',
      publicKey: '공개 키',
      balance: '잔액',
      creating: '생성 중...',
      requesting: '요청 중...',
      airdropSuccess: `${FAUCET_SOL_AMOUNT} SOL 받았습니다!`,
      airdropError: '요청 실패. 나중에 다시 시도하세요.',
      faucetUnavailable: 'Faucet이 일시적으로 사용 불가합니다',
      getPracticeUSDC: '연습용 USDC 받기',
      usdcSuccess: `${FAUCET_USDC_AMOUNT} USDC 받았습니다!`,
      receivingUSDC: 'USDC 받기 - 지갑',
      viewOnSolscan: 'Solscan에서 조회하기',
      copy: '복사',
      copied: '복사됨!',
      devnetOnly: 'Devnet 전용',
      close: '닫기',
      savedLocally: '브라우저에 저장됨',
      noWallet: '테스트 지갑을 만들어 시작하세요. 최대 3개의 지갑을 브라우저에 저장할 수 있습니다.',
      walletName: '지갑',
      selected: '선택됨',
      select: '선택',
      maxWallets: '최대 3개 지갑',
      receivingSOL: 'SOL 받기 - 지갑',
      airdropLimitReached: '에어드랍 한도 초과 (최대 10회)',
      remaining: '남음',
      resetsIn: '초기화까지',
    },
  }

  const text = t[language]

  const createTestWallet = async () => {
    if (!canAddWallet) return

    setIsCreatingWallet(true)
    try {
      const keypair = Keypair.generate()
      // Convert Uint8Array to hex string without Buffer
      const secretKeyHex = Array.from(keypair.secretKey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      addWallet({
        publicKey: keypair.publicKey.toBase58(),
        secretKey: secretKeyHex,
        balance: 0,
      })
    } catch (error) {
      console.error('Failed to create wallet:', error)
    } finally {
      setIsCreatingWallet(false)
    }
  }

  const requestAirdrop = async () => {
    const selectedWallet = getSelectedWallet()
    if (!selectedWallet) return

    // Check airdrop limit
    if (getRemainingAirdrops() <= 0) {
      setAirdropMessage(text.airdropLimitReached)
      return
    }

    setIsRequestingAirdrop(true)
    setAirdropMessage('')
    setLastTxSignature(null)

    try {
      // Call our faucet API for SOL
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientPublicKey: selectedWallet.publicKey,
          tokenType: 'sol',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 503) {
          setAirdropMessage(text.faucetUnavailable)
        } else {
          setAirdropMessage(text.airdropError)
        }
        console.error('Faucet error:', data)
        return
      }

      // Increment airdrop count on success
      incrementAirdropCount()

      // Update balance from blockchain
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const balance = await connection.getBalance(
        new PublicKey(selectedWallet.publicKey)
      )

      updateBalance(selectedWallet.id, balance / LAMPORTS_PER_SOL)
      setAirdropMessage(text.airdropSuccess)
      setLastTxSignature(data.signature)
    } catch (error) {
      console.error('Faucet request failed:', error)
      setAirdropMessage(text.airdropError)
    } finally {
      setIsRequestingAirdrop(false)
    }
  }

  const requestUsdc = async () => {
    const selectedWallet = getSelectedWallet()
    if (!selectedWallet) return

    // Check airdrop limit
    if (getRemainingAirdrops() <= 0) {
      setUsdcMessage(text.airdropLimitReached)
      return
    }

    setIsRequestingUsdc(true)
    setUsdcMessage('')
    setLastUsdcTxSignature(null)

    try {
      // Call our faucet API for USDC
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientPublicKey: selectedWallet.publicKey,
          tokenType: 'usdc',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 503) {
          setUsdcMessage(text.faucetUnavailable)
        } else {
          setUsdcMessage(text.airdropError)
        }
        console.error('USDC Faucet error:', data)
        return
      }

      // Increment airdrop count on success
      incrementAirdropCount()

      // Update USDC balance from blockchain
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const walletPubkey = new PublicKey(selectedWallet.publicKey)
      try {
        const ata = await getAssociatedTokenAddress(USDC_MINT, walletPubkey)
        const account = await getAccount(connection, ata)
        const usdcBalance = Number(account.amount) / Math.pow(10, USDC_DECIMALS)
        updateUsdcBalance(selectedWallet.id, usdcBalance)
      } catch {
        // ATA might not exist yet
        updateUsdcBalance(selectedWallet.id, FAUCET_USDC_AMOUNT)
      }

      setUsdcMessage(text.usdcSuccess)
      setLastUsdcTxSignature(data.signature)
    } catch (error) {
      console.error('USDC Faucet request failed:', error)
      setUsdcMessage(text.airdropError)
    } finally {
      setIsRequestingUsdc(false)
    }
  }

  const copyToClipboard = async (textToCopy: string, walletId: number) => {
    await navigator.clipboard.writeText(textToCopy)
    setCopiedId(walletId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!isOpen) return null

  const selectedWallet = getSelectedWallet()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{text.title}</h2>
            <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
              {text.devnetOnly}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {wallets.length > 0 ? (
            <>
              {/* Wallet List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    {text.yourWallets}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {wallets.length}/3
                  </span>
                </div>

                <div className="space-y-2">
                  {wallets.map((wallet) => (
                    <Card
                      key={wallet.id}
                      className={`cursor-pointer transition-colors ${
                        selectedWalletId === wallet.id
                          ? 'ring-2 ring-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedWalletId(wallet.id)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {text.walletName} {wallet.name}
                          </span>
                          {selectedWalletId === wallet.id && (
                            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                              {text.selected}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{text.publicKey}</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-xs truncate flex-1">
                              {wallet.publicKey}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(wallet.publicKey, wallet.id)
                              }}
                            >
                              {copiedId === wallet.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">{text.balance}</p>
                            <div className="flex items-center gap-3">
                              <p className="font-bold text-sm">{wallet.balance.toFixed(4)} SOL</p>
                              <p className="font-bold text-sm text-blue-600">{(wallet.usdcBalance || 0).toFixed(4)} USDC</p>
                            </div>
                          </div>
                          <a
                            href={`https://solscan.io/account/${wallet.publicKey}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Solscan <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Create New Wallet Button */}
                {canAddWallet && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={createTestWallet}
                    disabled={isCreatingWallet}
                  >
                    {isCreatingWallet ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {text.creating}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        {text.createTestWallet}
                      </>
                    )}
                  </Button>
                )}
                {!canAddWallet && (
                  <p className="text-xs text-muted-foreground text-center">
                    {text.maxWallets}
                  </p>
                )}
              </div>

              {/* Get Practice SOL */}
              {selectedWallet && (
                <div className="border-t pt-4 space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    {text.getPracticeSOL}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {text.receivingSOL} {selectedWallet.name}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={requestAirdrop}
                    disabled={isRequestingAirdrop || getRemainingAirdrops() <= 0}
                  >
                    {isRequestingAirdrop ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {text.requesting}
                      </>
                    ) : getRemainingAirdrops() <= 0 ? (
                      <span className="flex flex-col items-center gap-0.5">
                        <span>{text.airdropLimitReached}</span>
                        {getTimeUntilReset() && (
                          <span className="text-[10px] text-muted-foreground">
                            {text.resetsIn} {getTimeUntilReset()}
                          </span>
                        )}
                      </span>
                    ) : (
                      <>
                        {text.getPracticeSOL} ({FAUCET_SOL_AMOUNT} SOL)
                        <span className="text-muted-foreground ml-1">
                          {getRemainingAirdrops()}/{MAX_AIRDROP_COUNT} {text.remaining}
                        </span>
                      </>
                    )}
                  </Button>
                  {airdropMessage && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm ${airdropMessage.includes('!') ? 'text-green-600' : 'text-red-600'}`}>
                        {airdropMessage}
                      </p>
                      {lastTxSignature && (
                        <a
                          href={`https://solscan.io/tx/${lastTxSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {text.viewOnSolscan} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Get Practice USDC */}
              {selectedWallet && (
                <div className="border-t pt-4 space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    {text.getPracticeUSDC}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {text.receivingUSDC} {selectedWallet.name}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={requestUsdc}
                    disabled={isRequestingUsdc || getRemainingAirdrops() <= 0}
                  >
                    {isRequestingUsdc ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {text.requesting}
                      </>
                    ) : getRemainingAirdrops() <= 0 ? (
                      <span className="flex flex-col items-center gap-0.5">
                        <span>{text.airdropLimitReached}</span>
                        {getTimeUntilReset() && (
                          <span className="text-[10px] text-muted-foreground">
                            {text.resetsIn} {getTimeUntilReset()}
                          </span>
                        )}
                      </span>
                    ) : (
                      <>
                        {text.getPracticeUSDC} ({FAUCET_USDC_AMOUNT} USDC)
                        <span className="text-muted-foreground ml-1">
                          {getRemainingAirdrops()}/{MAX_AIRDROP_COUNT} {text.remaining}
                        </span>
                      </>
                    )}
                  </Button>
                  {usdcMessage && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm ${usdcMessage.includes('!') ? 'text-blue-600' : 'text-red-600'}`}>
                        {usdcMessage}
                      </p>
                      {lastUsdcTxSignature && (
                        <a
                          href={`https://solscan.io/tx/${lastUsdcTxSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {text.viewOnSolscan} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* No Wallet - Create One */
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground text-center">
                {text.noWallet}
              </p>
              <Button
                variant="default"
                className="w-full"
                onClick={createTestWallet}
                disabled={isCreatingWallet}
              >
                {isCreatingWallet ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {text.creating}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {text.createTestWallet}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            {text.close}
          </Button>
        </div>
      </div>
    </div>
  )
}
