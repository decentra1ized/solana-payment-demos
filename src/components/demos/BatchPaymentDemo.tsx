import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  Loader2,
  Send,
  Wallet,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Users,
  Plus,
  Minus,
  Zap,
  ArrowRight,
  Coins,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/lib/useLanguage'
import { useLocalWallet, LocalWallet } from '@/lib/useLocalWallet'
import { CodePreview } from './CodePreview'
import { SuccessAnimation } from '@/components/SuccessAnimation'
import { SolscanBubble } from '@/components/SolscanBubble'
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount
} from '@solana/spl-token'

type PaymentStep = 'input' | 'confirm' | 'processing' | 'completed'
type TokenType = 'sol' | 'usdc'

// USDC on Devnet
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
const USDC_DECIMALS = 6

// Minimum balance to keep for rent-exemption (~0.00089 SOL) + fee buffer
const MIN_BALANCE_FOR_RENT = 0.001

interface Recipient {
  walletId: number | null
  amount: string
}

export function BatchPaymentDemo() {
  const { language } = useLanguage()
  const { wallets, updateBalance, updateUsdcBalance } = useLocalWallet()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [step, setStep] = useState<PaymentStep>('input')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processingIndex, setProcessingIndex] = useState(-1)
  const [tokenType, setTokenType] = useState<TokenType>('sol')

  // Sender wallet
  const [senderWalletId, setSenderWalletId] = useState<number | null>(null)
  const [showSenderDropdown, setShowSenderDropdown] = useState(false)

  // Multiple recipients
  const [recipients, setRecipients] = useState<Recipient[]>([
    { walletId: null, amount: '0.001' },
    { walletId: null, amount: '0.001' }
  ])

  // Track if initial setup is done
  const initialSetupDone = useRef(false)

  // Helper function to get USDC balance from chain
  const getUsdcBalanceFromChain = async (connection: Connection, walletPubkey: PublicKey): Promise<number> => {
    try {
      const ata = await getAssociatedTokenAddress(USDC_MINT, walletPubkey)
      const account = await getAccount(connection, ata)
      return Number(account.amount) / Math.pow(10, USDC_DECIMALS)
    } catch {
      return 0
    }
  }

  const t = {
    en: {
      title: 'Batch Payment',
      subtitle: 'Send to multiple recipients in one transaction',
      sender: 'Sender',
      recipients: 'Recipients',
      addRecipient: 'Add',
      amount: 'Amount',
      review: 'Review Batch',
      confirm: 'Send All',
      processing: 'Processing...',
      completed: 'Batch Complete!',
      viewOnSolscan: 'View on Solscan',
      tryAgain: 'New Batch',
      noWallet: 'Create wallets first',
      insufficientBalance: 'Insufficient balance (keep more than transfer amount)',
      insufficientSol: 'Need SOL for fees',
      selectWallet: 'Select',
      wallet: 'Wallet',
      balance: 'Balance',
      back: 'Back',
      resetDemo: 'Reset',
      total: 'Total',
      fee: 'Fee',
      savings: 'Savings',
      vs: 'vs',
      singleTx: '1 tx',
      multipleTx: 'txs',
      costComparison: 'Cost Comparison',
      atomicity: 'All or nothing',
      recipient: 'Recipient',
      ready: 'Ready',
      confirming: 'Confirming',
      complete: 'Complete',
      steps: {
        input: 'Recipients',
        confirm: 'Confirm',
        processing: 'Process',
        completed: 'Done'
      }
    },
    ko: {
      title: '일괄 결제',
      subtitle: '하나의 트랜잭션으로 여러 수신자에게 전송',
      sender: '송신자',
      recipients: '수신자',
      addRecipient: '추가',
      amount: '금액',
      review: '일괄 검토',
      confirm: '전체 전송',
      processing: '처리 중...',
      completed: '일괄 전송 완료!',
      viewOnSolscan: 'Solscan에서 보기',
      tryAgain: '새 일괄 전송',
      noWallet: '지갑을 먼저 생성하세요',
      insufficientBalance: '잔액 부족 (송금액보다 여유있게 유지 필요)',
      insufficientSol: 'SOL 수수료 필요',
      selectWallet: '선택',
      wallet: '지갑',
      balance: '잔액',
      back: '뒤로',
      resetDemo: '초기화',
      total: '총액',
      fee: '수수료',
      savings: '절감',
      vs: 'vs',
      singleTx: '1개 tx',
      multipleTx: '개 tx',
      costComparison: '비용 비교',
      atomicity: '전체 성공 또는 전체 실패',
      recipient: '수신자',
      ready: '대기',
      confirming: '확인 중',
      complete: '완료',
      steps: {
        input: '수신자',
        confirm: '확인',
        processing: '처리',
        completed: '완료'
      }
    }
  }

  const text = t[language]

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (wallets.length === 0) return
    setIsRefreshing(true)
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      for (const wallet of wallets) {
        try {
          const balance = await connection.getBalance(new PublicKey(wallet.publicKey))
          updateBalance(wallet.id, balance / LAMPORTS_PER_SOL)
          // Also fetch USDC balance
          const usdcBalance = await getUsdcBalanceFromChain(connection, new PublicKey(wallet.publicKey))
          updateUsdcBalance(wallet.id, usdcBalance)
        } catch (e) {
          console.error(`Failed to fetch balance for wallet ${wallet.id}:`, e)
        }
      }
    } catch (e) {
      console.error('Failed to refresh balances:', e)
    } finally {
      setIsRefreshing(false)
    }
  }, [wallets, updateBalance, updateUsdcBalance])

  // Auto-select wallets (only on initial load)
  useEffect(() => {
    if (initialSetupDone.current || wallets.length < 2) return

    setSenderWalletId(wallets[0].id)
    setRecipients(prev => prev.map((r, i) => ({
      ...r,
      walletId: wallets[Math.min(i + 1, wallets.length - 1)]?.id || null
    })))
    initialSetupDone.current = true
  }, [wallets.length])

  // Refresh balances once on mount (separate from wallet setup)
  const balanceRefreshDone = useRef(false)
  useEffect(() => {
    if (balanceRefreshDone.current || wallets.length === 0) return
    balanceRefreshDone.current = true
    // Small delay to prevent initial flickering
    const timer = setTimeout(() => {
      refreshBalances()
    }, 100)
    return () => clearTimeout(timer)
  }, [wallets.length])

  const senderWallet = wallets.find(w => w.id === senderWalletId)

  const totalAmount = recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0)
  const estimatedFee = 0.000005
  const savingsAmount = (recipients.length - 1) * estimatedFee

  const addRecipient = () => {
    if (recipients.length < 4) {
      const nextWalletId = wallets[Math.min(recipients.length + 1, wallets.length - 1)]?.id || null
      setRecipients([...recipients, { walletId: nextWalletId, amount: tokenType === 'sol' ? '0.001' : '0.01' }])
    }
  }

  const removeRecipient = (index: number) => {
    if (recipients.length > 2) {
      setRecipients(recipients.filter((_, i) => i !== index))
    }
  }

  const updateRecipient = (index: number, field: 'walletId' | 'amount', value: number | string | null) => {
    setRecipients(recipients.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    ))
  }

  const processPayment = async () => {
    if (!senderWallet) {
      setError(text.noWallet)
      return
    }

    // Check balance based on token type
    if (tokenType === 'sol') {
      if (senderWallet.balance < totalAmount + estimatedFee + MIN_BALANCE_FOR_RENT) {
        setError(text.insufficientBalance)
        return
      }
    } else {
      // For USDC, check USDC balance and SOL for fees
      if ((senderWallet.usdcBalance || 0) < totalAmount) {
        setError(text.insufficientBalance)
        return
      }
      if (senderWallet.balance < MIN_BALANCE_FOR_RENT) {
        setError(text.insufficientSol)
        return
      }
    }

    setStep('processing')
    setError(null)

    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const secretKeyArray = new Uint8Array(
        senderWallet.secretKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      )
      const payerKeypair = Keypair.fromSecretKey(secretKeyArray)

      // Create a single transaction with multiple transfer instructions
      const transaction = new Transaction()

      if (tokenType === 'usdc') {
        // USDC batch transfer
        const senderAta = await getAssociatedTokenAddress(USDC_MINT, payerKeypair.publicKey)

        for (let i = 0; i < recipients.length; i++) {
          const recipient = recipients[i]
          const recipientWallet = wallets.find(w => w.id === recipient.walletId)
          if (!recipientWallet) continue

          setProcessingIndex(i)
          const recipientPubkey = new PublicKey(recipientWallet.publicKey)
          const recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey)

          // Check if recipient ATA exists, create if not
          try {
            await getAccount(connection, recipientAta)
          } catch {
            transaction.add(
              createAssociatedTokenAccountInstruction(
                payerKeypair.publicKey,
                recipientAta,
                recipientPubkey,
                USDC_MINT
              )
            )
          }

          // Add USDC transfer instruction
          transaction.add(
            createTransferInstruction(
              senderAta,
              recipientAta,
              payerKeypair.publicKey,
              BigInt(Math.floor(parseFloat(recipient.amount) * Math.pow(10, USDC_DECIMALS)))
            )
          )
        }
      } else {
        // SOL batch transfer
        for (let i = 0; i < recipients.length; i++) {
          const recipient = recipients[i]
          const recipientWallet = wallets.find(w => w.id === recipient.walletId)
          if (!recipientWallet) continue

          setProcessingIndex(i)

          transaction.add(
            SystemProgram.transfer({
              fromPubkey: payerKeypair.publicKey,
              toPubkey: new PublicKey(recipientWallet.publicKey),
              lamports: Math.floor(parseFloat(recipient.amount) * LAMPORTS_PER_SOL),
            })
          )
        }
      }

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = payerKeypair.publicKey
      transaction.sign(payerKeypair)

      const signature = await connection.sendRawTransaction(transaction.serialize())
      await connection.confirmTransaction(signature)

      // Update all balances
      const senderBalance = await connection.getBalance(payerKeypair.publicKey)
      updateBalance(senderWallet.id, senderBalance / LAMPORTS_PER_SOL)
      const senderUsdcBalance = await getUsdcBalanceFromChain(connection, payerKeypair.publicKey)
      updateUsdcBalance(senderWallet.id, senderUsdcBalance)

      for (const recipient of recipients) {
        const recipientWallet = wallets.find(w => w.id === recipient.walletId)
        if (recipientWallet) {
          const recipientPubkey = new PublicKey(recipientWallet.publicKey)
          const balance = await connection.getBalance(recipientPubkey)
          updateBalance(recipientWallet.id, balance / LAMPORTS_PER_SOL)
          const usdcBalance = await getUsdcBalanceFromChain(connection, recipientPubkey)
          updateUsdcBalance(recipientWallet.id, usdcBalance)
        }
      }

      setTxSignature(signature)
      setStep('completed')
      setProcessingIndex(-1)
    } catch (err) {
      console.error('Batch payment failed:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
      setStep('confirm')
      setProcessingIndex(-1)
    }
  }

  const reset = () => {
    setStep('input')
    const defaultAmount = tokenType === 'sol' ? '0.001' : '0.01'
    setRecipients([
      { walletId: wallets[1]?.id || null, amount: defaultAmount },
      { walletId: wallets[2]?.id || wallets[1]?.id || null, amount: defaultAmount }
    ])
    setTxSignature(null)
    setError(null)
    setProcessingIndex(-1)
  }

  const resetDemo = async () => {
    reset()
    await refreshBalances()
  }

  const WalletSelector = ({
    selectedWallet,
    onSelect,
    showDropdown,
    setShowDropdown,
    compact = false
  }: {
    selectedWallet: LocalWallet | undefined
    onSelect: (id: number) => void
    showDropdown: boolean
    setShowDropdown: (show: boolean) => void
    compact?: boolean
  }) => (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-background/50 hover:bg-background/80 transition-colors ${compact ? 'text-[9px]' : 'text-[10px]'}`}
      >
        <Wallet className="h-3 w-3" />
        <span>{selectedWallet ? `${text.wallet} ${selectedWallet.name}` : text.selectWallet}</span>
        <ChevronDown className="h-2 w-2" />
      </button>
      {showDropdown && (
        <div className="absolute top-full right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 min-w-[80px]">
          {wallets.map(w => (
            <button
              key={w.id}
              onClick={() => {
                onSelect(w.id)
                setShowDropdown(false)
              }}
              className={`w-full text-center px-3 py-1.5 text-[10px] hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                w.id === selectedWallet?.id ? 'bg-primary/10' : ''
              }`}
            >
              {text.wallet} {w.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // Phone Frame Component
  const PhoneFrame = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <div className="relative bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-gray-900 rounded-b-xl z-10" />
        <div className="w-44 h-80 sm:w-48 sm:h-[22rem] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-[1.5rem] overflow-hidden">
          <div className="h-full flex flex-col pt-6">
            {children}
          </div>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-600 rounded-full" />
      </div>
    </div>
  )

  // Mini Phone Frame for Recipients
  const MiniPhoneFrame = ({
    children,
    index,
    isProcessing,
    isCompleted
  }: {
    children: React.ReactNode
    index: number
    isProcessing: boolean
    isCompleted: boolean
  }) => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex flex-col items-center gap-1"
    >
      <div className={`relative bg-gray-900 rounded-xl p-1 shadow-lg transition-all ${
        isCompleted ? 'ring-2 ring-green-500' :
        isProcessing ? 'ring-2 ring-primary animate-pulse' : ''
      }`}>
        <div className="w-20 h-32 sm:w-24 sm:h-36 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden">
          {children}
        </div>
      </div>
    </motion.div>
  )

  // Sender Content
  const SenderContent = () => (
    <div className="h-full flex flex-col">
      <div className="bg-primary/10 px-2 py-1.5 border-b flex items-center justify-between">
        <span className="text-[10px] font-semibold">Solana Wallet</span>
        <WalletSelector
          selectedWallet={senderWallet}
          onSelect={setSenderWalletId}
          showDropdown={showSenderDropdown}
          setShowDropdown={setShowSenderDropdown}
        />
      </div>

      <div className="flex-1 p-2 flex flex-col justify-center overflow-y-auto">
        {step === 'input' && (
          <div className="space-y-2">
            {/* Token Type Toggle */}
            <div className="flex justify-center gap-1">
              <button
                onClick={() => { setTokenType('sol'); setRecipients(prev => prev.map(r => ({ ...r, amount: '0.001' }))); }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors ${
                  tokenType === 'sol' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Coins className="h-3 w-3" />
                SOL
              </button>
              <button
                onClick={() => { setTokenType('usdc'); setRecipients(prev => prev.map(r => ({ ...r, amount: '0.01' }))); }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors ${
                  tokenType === 'usdc' ? 'bg-blue-600 text-white' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <DollarSign className="h-3 w-3" />
                USDC
              </button>
            </div>

            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">{text.balance}</p>
              <p className={`text-lg font-bold ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
                {tokenType === 'usdc'
                  ? `${(senderWallet?.usdcBalance || 0).toFixed(4)} USDC`
                  : `${senderWallet?.balance.toFixed(4) || '0'} SOL`
                }
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">{text.recipients}</span>
                <span className="text-[9px] font-medium">{recipients.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">{text.total}</span>
                <span className={`text-[10px] font-bold ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
                  {totalAmount.toFixed(4)} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">{text.fee}</span>
                <span className="text-[9px] text-green-600">~{estimatedFee.toFixed(6)} SOL</span>
              </div>
            </div>

            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Button
                onClick={() => setStep('confirm')}
                size="sm"
                className={`w-full text-xs h-7 ring-2 ring-offset-1 ${
                  tokenType === 'usdc' ? 'bg-blue-600 hover:bg-blue-700 ring-blue-500/50' : 'ring-primary/50'
                }`}
                disabled={recipients.some(r => !r.walletId)}
              >
                <Send className="h-3 w-3 mr-1" />
                {text.review}
              </Button>
            </motion.div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-2">
            <div className="bg-muted/50 rounded-lg p-2 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{text.recipients}</span>
                <span className="font-medium">{recipients.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{text.total}</span>
                <span className={`font-bold ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
                  {totalAmount.toFixed(4)} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{text.fee}</span>
                <span className="text-green-600">~{estimatedFee.toFixed(6)} SOL</span>
              </div>
            </div>
            {error && <p className="text-[10px] text-red-500 text-center">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep('input')} className="flex-1 text-[10px] h-7">
                {text.back}
              </Button>
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex-1"
              >
                <Button
                  size="sm"
                  onClick={processPayment}
                  className={`w-full text-[10px] h-7 ring-2 ring-offset-1 ${
                    tokenType === 'usdc' ? 'bg-blue-600 hover:bg-blue-700 ring-blue-500/50' : 'ring-primary/50'
                  }`}
                >
                  {text.confirm}
                </Button>
              </motion.div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className={`h-8 w-8 animate-spin ${tokenType === 'usdc' ? 'text-blue-600' : 'text-primary'}`} />
            <p className="text-xs">{text.processing}</p>
            <p className="text-[10px] text-muted-foreground">
              {language === 'ko'
                ? `${recipients.length}명에게 ${tokenType === 'usdc' ? 'USDC' : 'SOL'} 전송 중...`
                : `Sending ${tokenType === 'usdc' ? 'USDC' : 'SOL'} to ${recipients.length} recipients...`}
            </p>
          </div>
        )}

        {step === 'completed' && (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <p className={`text-xs font-medium ${tokenType === 'usdc' ? 'text-blue-600' : 'text-green-600'}`}>
              -{totalAmount.toFixed(4)} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {language === 'ko'
                ? `${recipients.length}명에게 ${tokenType === 'usdc' ? 'USDC' : 'SOL'} 전송 완료`
                : `Sent ${tokenType === 'usdc' ? 'USDC' : 'SOL'} to ${recipients.length} recipients`}
            </p>
            {txSignature && (
              <div className="relative mt-1">
                <SolscanBubble show={true} />
                <a
                  href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                >
                  {text.viewOnSolscan} <ExternalLink className="h-2 w-2" />
                </a>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={reset} className="text-[10px] h-6 mt-1">
              <RefreshCw className="h-3 w-3 mr-1" />
              {text.tryAgain}
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  // Recipient Mini Content
  const RecipientMiniContent = ({ recipient, index }: { recipient: Recipient; index: number }) => {
    const recipientWallet = wallets.find(w => w.id === recipient.walletId)
    const isProcessing = step === 'processing' && processingIndex >= index
    const isCompleted = step === 'completed'

    return (
      <div className="h-full flex flex-col p-1">
        <div className={`px-1 py-0.5 rounded text-center mb-1 ${tokenType === 'usdc' ? 'bg-blue-600/10' : 'bg-primary/10'}`}>
          <span className="text-[8px] font-medium">{recipientWallet?.name || `#${index + 1}`}</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          {isCompleted ? (
            <>
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1">
                <Check className="h-3 w-3 text-green-600" />
              </div>
              <p className={`text-[8px] font-medium ${tokenType === 'usdc' ? 'text-blue-600' : 'text-green-600'}`}>
                +{recipient.amount} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
              </p>
            </>
          ) : isProcessing ? (
            <Loader2 className={`h-4 w-4 animate-spin ${tokenType === 'usdc' ? 'text-blue-600' : 'text-primary'}`} />
          ) : (
            <>
              <Wallet className={`h-4 w-4 ${tokenType === 'usdc' ? 'text-blue-500' : 'text-muted-foreground'}`} />
              <p className={`text-[8px] font-medium ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
                {recipient.amount} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
              </p>
            </>
          )}
        </div>

        {step === 'input' && (
          <div className="space-y-1">
            <select
              value={recipient.walletId || ''}
              onChange={(e) => updateRecipient(index, 'walletId', parseInt(e.target.value))}
              className="w-full text-[8px] bg-muted/50 border-0 rounded p-0.5"
            >
              <option value="">{text.selectWallet}</option>
              {wallets.filter(w => w.id !== senderWalletId).map(w => (
                <option key={w.id} value={w.id}>{text.wallet} {w.name}</option>
              ))}
            </select>
            <div className="relative">
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[6px] text-muted-foreground">
                {language === 'ko' ? '수신량' : 'Amt'}
              </span>
              <Input
                type="number"
                key={`amount-${index}-${tokenType}-${recipient.amount}`}
                defaultValue={recipient.amount}
                onBlur={(e) => updateRecipient(index, 'amount', e.target.value)}
                className="w-full h-5 text-[8px] text-center p-1 pl-6"
                step="0.00001"
                min="0.00001"
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (wallets.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Users className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">{text.noWallet}</p>
        <p className="text-xs text-muted-foreground">
          {language === 'ko' ? '최소 2개의 지갑이 필요합니다' : 'Need at least 2 wallets'}
        </p>
      </div>
    )
  }

  const codeTabs = [
    {
      id: 'sender',
      label: 'Sender (TS)',
      labelKo: '송신자 (TS)',
      code: `// TypeScript - @solana/web3.js
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js'

interface Recipient {
  address: string
  amount: number  // in SOL
}

// Batch transfer to multiple recipients in a single transaction
async function batchTransfer(
  connection: Connection,
  senderKeypair: Keypair,
  recipients: Recipient[]
) {
  // Create a single transaction with multiple transfer instructions
  const transaction = new Transaction()

  // Add transfer instruction for each recipient
  for (const recipient of recipients) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: new PublicKey(recipient.address),
        lamports: Math.floor(recipient.amount * LAMPORTS_PER_SOL),
      })
    )
  }

  // Get recent blockhash and sign
  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = senderKeypair.publicKey
  transaction.sign(senderKeypair)

  // Send and confirm - ALL or NOTHING (atomic)
  const signature = await connection.sendRawTransaction(
    transaction.serialize()
  )
  await connection.confirmTransaction(signature)

  return signature
}

// Example usage:
// const recipients = [
//   { address: 'Recipient1PubKey...', amount: 0.1 },
//   { address: 'Recipient2PubKey...', amount: 0.05 },
//   { address: 'Recipient3PubKey...', amount: 0.02 },
// ]
//
// Benefits:
// - Single transaction fee (vs N separate fees)
// - Atomic: All transfers succeed or all fail
// - Faster: One confirmation instead of N`,
      codeKo: `// TypeScript - @solana/web3.js
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js'

interface Recipient {
  address: string
  amount: number  // SOL 단위
}

// 단일 트랜잭션으로 여러 수신자에게 일괄 전송
async function batchTransfer(
  connection: Connection,
  senderKeypair: Keypair,
  recipients: Recipient[]
) {
  // 여러 전송 명령어를 포함한 단일 트랜잭션 생성
  const transaction = new Transaction()

  // 각 수신자에 대해 전송 명령어 추가
  for (const recipient of recipients) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: new PublicKey(recipient.address),
        lamports: Math.floor(recipient.amount * LAMPORTS_PER_SOL),
      })
    )
  }

  // 최신 블록해시 조회 및 서명
  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = senderKeypair.publicKey
  transaction.sign(senderKeypair)

  // 전송 및 확인 - 전체 성공 또는 전체 실패 (원자성)
  const signature = await connection.sendRawTransaction(
    transaction.serialize()
  )
  await connection.confirmTransaction(signature)

  return signature
}

// 사용 예시:
// const recipients = [
//   { address: 'Recipient1PubKey...', amount: 0.1 },
//   { address: 'Recipient2PubKey...', amount: 0.05 },
//   { address: 'Recipient3PubKey...', amount: 0.02 },
// ]
//
// 장점:
// - 단일 트랜잭션 수수료 (N개의 개별 수수료 대신)
// - 원자성: 모든 전송이 성공하거나 모두 실패
// - 더 빠름: N개가 아닌 1번의 확인만 필요`,
      packages: [
        { name: '@solana/web3.js', url: 'https://www.npmjs.com/package/@solana/web3.js' }
      ]
    }
  ]

  const stepOrder: PaymentStep[] = ['input', 'confirm', 'processing', 'completed']
  const currentStepIndex = stepOrder.indexOf(step)

  return (
    <div className="space-y-4">
      {/* Header with Progress Steps */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Subtitle */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">{text.subtitle}</span>
        </div>
        <div className="sm:hidden shrink-0 w-8" /> {/* Spacer for mobile */}

        {/* Center: Progress Steps */}
        <div className="flex items-center gap-1 text-xs overflow-x-auto justify-center">
          {stepOrder.map((s, index) => (
            <div key={s} className="flex items-center shrink-0">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                index <= currentStepIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <span className="font-medium">{index + 1}</span>
                <span className="hidden sm:inline">{text.steps[s]}</span>
              </div>
              {index < stepOrder.length - 1 && (
                <ArrowRight className="h-3 w-3 mx-0.5 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {step === 'input' && recipients.length < 4 && (
            <Button variant="outline" size="sm" onClick={addRecipient} className="h-6 text-[10px]">
              <Plus className="h-3 w-3 mr-1" />
              {text.addRecipient}
            </Button>
          )}
          <CodePreview tabs={codeTabs} />
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDemo}
            disabled={isRefreshing}
            className="text-xs h-6"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {text.resetDemo}
          </Button>
        </div>
      </div>

      {/* Devices Visualization */}
      <div className="relative flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 py-4">
        <SuccessAnimation show={step === 'completed'} />
        {/* Sender Phone */}
        <PhoneFrame title={text.sender}>
          <SenderContent />
        </PhoneFrame>

        {/* Flow Lines */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-2 min-w-[80px]">
          {recipients.map((_, index) => {
            const isActive = step === 'processing' && processingIndex >= index
            const isCompleted = step === 'completed'

            return (
              <motion.div
                key={index}
                className="flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  className={`h-0.5 w-8 rounded-full transition-colors ${
                    isCompleted ? 'bg-green-500' :
                    isActive ? 'bg-primary' : 'bg-muted'
                  }`}
                  animate={isActive && !isCompleted ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                <ArrowRight className={`h-3 w-3 ${
                  isCompleted ? 'text-green-500' :
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </motion.div>
            )
          })}
        </div>

        {/* Mobile flow indicator */}
        <div className="lg:hidden flex items-center gap-2">
          <ArrowRight className={`h-5 w-5 rotate-90 transition-colors ${
            step === 'completed' ? 'text-green-500' :
            step === 'processing' ? 'text-primary' : 'text-muted-foreground'
          }`} />
        </div>

        {/* Recipients Mini Phones */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-muted-foreground text-center">
            {text.recipients} ({recipients.length})
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {recipients.map((recipient, index) => {
              const isProcessing = step === 'processing' && processingIndex >= index
              const isCompleted = step === 'completed'

              return (
                <div key={index} className="relative">
                  <MiniPhoneFrame
                    index={index}
                    isProcessing={isProcessing}
                    isCompleted={isCompleted}
                  >
                    <RecipientMiniContent recipient={recipient} index={index} />
                  </MiniPhoneFrame>

                  {step === 'input' && recipients.length > 2 && (
                    <button
                      onClick={() => removeRecipient(index)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors"
                    >
                      <Minus className="h-2 w-2" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Cost Comparison */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
        <h4 className="text-xs font-medium mb-3 flex items-center gap-2">
          <Zap className="h-3 w-3 text-primary" />
          {text.costComparison}
        </h4>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">{text.singleTx}</p>
            <p className="text-sm font-bold text-green-600">~{estimatedFee.toFixed(6)}</p>
            <p className="text-[10px] text-muted-foreground">SOL</p>
          </div>

          <div className="flex items-center justify-center">
            <span className="text-xs text-muted-foreground">{text.vs}</span>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">{recipients.length} {text.multipleTx}</p>
            <p className="text-sm font-bold text-muted-foreground line-through">
              ~{(estimatedFee * recipients.length).toFixed(6)}
            </p>
            <p className="text-[10px] text-muted-foreground">SOL</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4">
          <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
            <p className="text-[10px] font-medium text-green-700 dark:text-green-400">
              {text.savings}: -{savingsAmount.toFixed(6)} SOL
            </p>
          </div>
          <div className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <p className="text-[10px] text-amber-700 dark:text-amber-400">
              {text.atomicity}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
