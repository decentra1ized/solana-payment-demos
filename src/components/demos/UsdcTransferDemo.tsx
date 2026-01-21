import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  Loader2,
  Send,
  Wallet,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  RefreshCw,
  Smartphone,
  Monitor,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/useLanguage'
import { CodePreview } from './CodePreview'
import { SuccessAnimation } from '@/components/SuccessAnimation'
import { SolscanBubble } from '@/components/SolscanBubble'
import { useLocalWallet, LocalWallet, USDC_MINT, USDC_DECIMALS } from '@/lib/useLocalWallet'
import {
  Connection,
  PublicKey,
  Transaction,
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
type DeviceType = 'phone' | 'desktop'

// Minimum SOL balance for transaction fee
const MIN_SOL_FOR_FEE = 0.001

export function UsdcTransferDemo() {
  const { language } = useLanguage()
  const { wallets, updateBalance, updateUsdcBalance } = useLocalWallet()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [amount, setAmount] = useState('0.01')
  const [step, setStep] = useState<PaymentStep>('input')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Device type selection
  const [senderDevice, setSenderDevice] = useState<DeviceType>('phone')
  const [recipientDevice, setRecipientDevice] = useState<DeviceType>('desktop')

  // Sender and recipient wallet selection
  const [senderWalletId, setSenderWalletId] = useState<number | null>(null)
  const [recipientWalletId, setRecipientWalletId] = useState<number | null>(null)
  const [showSenderDropdown, setShowSenderDropdown] = useState(false)
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false)

  // Helper function to get USDC balance
  const getUsdcBalanceFromChain = async (connection: Connection, walletPubkey: PublicKey): Promise<number> => {
    try {
      const ata = await getAssociatedTokenAddress(USDC_MINT, walletPubkey)
      const account = await getAccount(connection, ata)
      return Number(account.amount) / Math.pow(10, USDC_DECIMALS)
    } catch {
      return 0
    }
  }

  // Refresh balances from blockchain
  const refreshBalances = useCallback(async () => {
    if (wallets.length === 0) return
    setIsRefreshing(true)
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      for (const wallet of wallets) {
        try {
          const pubkey = new PublicKey(wallet.publicKey)
          const [balance, usdcBal] = await Promise.all([
            connection.getBalance(pubkey),
            getUsdcBalanceFromChain(connection, pubkey)
          ])
          updateBalance(wallet.id, balance / LAMPORTS_PER_SOL)
          updateUsdcBalance(wallet.id, usdcBal)
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

  // Auto-select wallets if available
  useEffect(() => {
    if (wallets.length >= 1 && !senderWalletId) {
      setSenderWalletId(wallets[0].id)
    }
    if (wallets.length >= 2 && !recipientWalletId) {
      setRecipientWalletId(wallets[1].id)
    } else if (wallets.length === 1 && !recipientWalletId) {
      setRecipientWalletId(wallets[0].id)
    }
  }, [wallets])

  // Refresh balances on mount
  useEffect(() => {
    if (wallets.length > 0) {
      refreshBalances()
    }
  }, [wallets.length])

  const senderWallet = wallets.find(w => w.id === senderWalletId)
  const recipientWallet = wallets.find(w => w.id === recipientWalletId)

  const t = {
    en: {
      title: 'USDC Transfer',
      from: 'From',
      to: 'To',
      amount: 'Amount (USDC)',
      review: 'Send',
      confirm: 'Confirm & Send',
      processing: 'Processing...',
      completed: 'Transfer Complete!',
      txHash: 'Transaction',
      viewOnSolscan: 'View on Solscan',
      tryAgain: 'New Transfer',
      noWallet: 'Create wallet first',
      insufficientBalance: 'Insufficient USDC (keep more than transfer amount)',
      insufficientSol: 'Need SOL for fees',
      selectWallet: 'Select Wallet',
      wallet: 'Wallet',
      balance: 'Balance',
      sending: 'Sending',
      receiving: 'Receiving',
      transferDetails: 'Transfer Details',
      back: 'Back',
      resetDemo: 'Reset',
      resetting: 'Resetting...',
      fee: 'Network Fee',
      newBalance: 'New Balance',
      phone: 'Phone',
      desktop: 'Desktop',
      deviceSetup: 'Device Setup',
      sender: 'Sender',
      recipient: 'Recipient',
      ready: 'Ready',
      confirming: 'Confirming',
      complete: 'Complete',
      steps: {
        input: 'Amount',
        confirm: 'Confirm',
        processing: 'Process',
        completed: 'Done'
      }
    },
    ko: {
      title: 'USDC 전송',
      from: '보내는 곳',
      to: '받는 곳',
      amount: '금액 (USDC)',
      review: '전송',
      confirm: '확인 및 전송',
      processing: '처리 중...',
      completed: '전송 완료!',
      txHash: '트랜잭션',
      viewOnSolscan: 'Solscan에서 보기',
      tryAgain: '새 전송',
      noWallet: '지갑을 먼저 생성하세요',
      insufficientBalance: 'USDC 잔액 부족 (송금액보다 여유있게 유지 필요)',
      insufficientSol: '수수료를 위한 SOL 필요',
      selectWallet: '지갑 선택',
      wallet: '지갑',
      balance: '잔액',
      sending: '송금',
      receiving: '수신',
      transferDetails: '전송 상세',
      back: '뒤로',
      resetDemo: '초기화',
      resetting: '초기화 중...',
      fee: '네트워크 수수료',
      newBalance: '새 잔액',
      phone: '휴대폰',
      desktop: '데스크탑',
      deviceSetup: '기기 설정',
      sender: '송신자',
      recipient: '수신자',
      ready: '대기',
      confirming: '확인 중',
      complete: '완료',
      steps: {
        input: '금액',
        confirm: '확인',
        processing: '처리',
        completed: '완료'
      }
    }
  }

  const text = t[language]

  const processPayment = async () => {
    if (!senderWallet || !recipientWallet) {
      setError(text.noWallet)
      return
    }

    const amountInUsdc = parseFloat(amount)
    if ((senderWallet.usdcBalance || 0) < amountInUsdc) {
      setError(text.insufficientBalance)
      return
    }

    if (senderWallet.balance < MIN_SOL_FOR_FEE) {
      setError(text.insufficientSol)
      return
    }

    setStep('processing')
    setError(null)

    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const secretKeyArray = new Uint8Array(
        senderWallet.secretKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      )
      const payerKeypair = Keypair.fromSecretKey(secretKeyArray)
      const recipientPubkey = new PublicKey(recipientWallet.publicKey)

      // Get associated token addresses
      const senderAta = await getAssociatedTokenAddress(USDC_MINT, payerKeypair.publicKey)
      const recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey)

      const transaction = new Transaction()

      // Check if recipient has ATA, if not create it
      try {
        await getAccount(connection, recipientAta)
      } catch {
        // ATA doesn't exist, create it
        transaction.add(
          createAssociatedTokenAccountInstruction(
            payerKeypair.publicKey, // payer
            recipientAta,           // ata
            recipientPubkey,        // owner
            USDC_MINT               // mint
          )
        )
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          senderAta,                                              // source
          recipientAta,                                           // destination
          payerKeypair.publicKey,                                 // owner
          Math.floor(amountInUsdc * Math.pow(10, USDC_DECIMALS))  // amount
        )
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = payerKeypair.publicKey
      transaction.sign(payerKeypair)

      const signature = await connection.sendRawTransaction(transaction.serialize())
      await connection.confirmTransaction(signature)

      // Update both wallets' balances
      const senderBalance = await connection.getBalance(payerKeypair.publicKey)
      const recipientBalance = await connection.getBalance(recipientPubkey)
      const senderUsdcBal = await getUsdcBalanceFromChain(connection, payerKeypair.publicKey)
      const recipientUsdcBal = await getUsdcBalanceFromChain(connection, recipientPubkey)

      updateBalance(senderWallet.id, senderBalance / LAMPORTS_PER_SOL)
      updateBalance(recipientWallet.id, recipientBalance / LAMPORTS_PER_SOL)
      updateUsdcBalance(senderWallet.id, senderUsdcBal)
      updateUsdcBalance(recipientWallet.id, recipientUsdcBal)

      setTxSignature(signature)
      setStep('completed')
    } catch (err) {
      console.error('Payment failed:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
      setStep('confirm')
    }
  }

  const reset = () => {
    setStep('input')
    setAmount('0.01')
    setTxSignature(null)
    setError(null)
  }

  const resetDemo = async () => {
    reset()
    await refreshBalances()
  }

  // Wallet Selector Component
  const WalletSelector = ({
    selectedWallet,
    onSelect,
    showDropdown,
    setShowDropdown
  }: {
    selectedWallet: LocalWallet | undefined
    onSelect: (id: number) => void
    showDropdown: boolean
    setShowDropdown: (show: boolean) => void
  }) => (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-background/50 hover:bg-background/80 transition-colors text-[10px]"
      >
        <Wallet className="h-3 w-3" />
        <span>{selectedWallet ? `${text.wallet} ${selectedWallet.name}` : text.selectWallet}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-background border rounded-lg shadow-lg z-20 min-w-[140px]">
          {wallets.map(w => (
            <button
              key={w.id}
              onClick={() => {
                onSelect(w.id)
                setShowDropdown(false)
              }}
              className={`w-full text-left px-2 py-1.5 text-[10px] hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                w.id === selectedWallet?.id ? 'bg-primary/10' : ''
              }`}
            >
              <div className="font-medium">{text.wallet} {w.name}</div>
              <div className="text-muted-foreground">{(w.usdcBalance || 0).toFixed(4)} USDC</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // Device Type Selector
  const DeviceSelector = ({
    device,
    onSelect,
    label
  }: {
    device: DeviceType
    onSelect: (d: DeviceType) => void
    label: string
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground">{label}:</span>
      <div className="flex gap-1">
        <button
          onClick={() => onSelect('phone')}
          className={`p-1.5 rounded transition-colors ${
            device === 'phone' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
          }`}
        >
          <Smartphone className="h-3 w-3" />
        </button>
        <button
          onClick={() => onSelect('desktop')}
          className={`p-1.5 rounded transition-colors ${
            device === 'desktop' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
          }`}
        >
          <Monitor className="h-3 w-3" />
        </button>
      </div>
    </div>
  )

  // Phone Frame Component
  const PhoneFrame = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <div className="relative bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-gray-900 rounded-b-xl z-10" />
        {/* Screen */}
        <div className="w-44 h-80 sm:w-48 sm:h-[22rem] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-[1.5rem] overflow-hidden">
          <div className="h-full flex flex-col pt-6">
            {children}
          </div>
        </div>
        {/* Home Indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-600 rounded-full" />
      </div>
    </div>
  )

  // Desktop Frame Component
  const DesktopFrame = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <div className="relative">
        {/* Monitor */}
        <div className="bg-gray-900 rounded-lg p-2 shadow-2xl">
          {/* Screen */}
          <div className="w-56 h-48 sm:w-64 sm:h-52 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded overflow-hidden">
            {children}
          </div>
        </div>
        {/* Stand */}
        <div className="flex flex-col items-center">
          <div className="w-4 h-6 bg-gray-700" />
          <div className="w-16 h-2 bg-gray-700 rounded-b-lg" />
        </div>
      </div>
    </div>
  )

  // Device Content for Sender
  const SenderContent = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-violet-500/10 px-2 py-1.5 border-b flex items-center justify-between">
        <span className="text-[10px] font-semibold">Solana Wallet</span>
        <WalletSelector
          selectedWallet={senderWallet}
          onSelect={setSenderWalletId}
          showDropdown={showSenderDropdown}
          setShowDropdown={setShowSenderDropdown}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-center">
        {step === 'input' && (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">{text.balance}</p>
              <p className="text-lg font-bold text-blue-600">{(senderWallet?.usdcBalance || 0).toFixed(4)} USDC</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">{text.amount}</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.00001"
                min="0.00001"
                className="text-center text-sm font-bold h-8"
              />
            </div>
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Button
                onClick={() => setStep('confirm')}
                size="sm"
                className="w-full text-xs ring-2 ring-blue-500/50 ring-offset-1 bg-blue-600 hover:bg-blue-700"
                disabled={!senderWallet || !recipientWallet || parseFloat(amount) <= 0}
              >
                <Send className="h-3 w-3 mr-1" />
                {text.review}
              </Button>
            </motion.div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-2 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{text.to}</span>
                <span>{text.wallet} {recipientWallet?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{text.amount}</span>
                <span className="font-bold text-blue-600">{amount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{text.fee}</span>
                <span>~0.000005 SOL</span>
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
                <Button size="sm" onClick={processPayment} className="w-full text-[10px] h-7 ring-2 ring-blue-500/50 ring-offset-1 bg-blue-600 hover:bg-blue-700">
                  {text.confirm}
                </Button>
              </motion.div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-xs">{text.processing}</p>
          </div>
        )}

        {step === 'completed' && (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
              <Check className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-blue-600">-{amount} USDC</p>
            <p className="text-[10px] text-muted-foreground">
              {text.newBalance}: {(senderWallet?.usdcBalance || 0).toFixed(4)} USDC
            </p>
            <Button variant="outline" size="sm" onClick={reset} className="text-[10px] h-6 mt-2">
              <RefreshCw className="h-3 w-3 mr-1" />
              {text.tryAgain}
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  // Device Content for Recipient
  const RecipientContent = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-violet-500/10 px-2 py-1.5 border-b flex items-center justify-between">
        <span className="text-[10px] font-semibold">Solana Wallet</span>
        <WalletSelector
          selectedWallet={recipientWallet}
          onSelect={setRecipientWalletId}
          showDropdown={showRecipientDropdown}
          setShowDropdown={setShowRecipientDropdown}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-center">
        {(step === 'input' || step === 'confirm') && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">{text.balance}</p>
              <p className="text-lg font-bold text-blue-600">{(recipientWallet?.usdcBalance || 0).toFixed(4)} USDC</p>
            </div>
            {step === 'confirm' && (
              <div className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
                <p className="text-[10px] text-amber-700 dark:text-amber-400">
                  {language === 'ko' ? '입금 대기 중...' : 'Pending incoming...'}
                </p>
              </div>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-xs">{language === 'ko' ? '수신 중...' : 'Receiving...'}</p>
          </div>
        )}

        {step === 'completed' && (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
              <Check className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-blue-600">+{amount} USDC</p>
            <p className="text-[10px] text-muted-foreground">
              {text.newBalance}: {(recipientWallet?.usdcBalance || 0).toFixed(4)} USDC
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
          </div>
        )}
      </div>
    </div>
  )

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">{text.noWallet}</p>
      </div>
    )
  }

  const stepOrder: PaymentStep[] = ['input', 'confirm', 'processing', 'completed']
  const currentStepIndex = stepOrder.indexOf(step)

  return (
    <div className="space-y-4">
      {/* Header with Progress Steps */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Device Selectors */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <DeviceSelector device={senderDevice} onSelect={setSenderDevice} label={text.sender} />
          <DeviceSelector device={recipientDevice} onSelect={setRecipientDevice} label={text.recipient} />
        </div>
        <div className="sm:hidden shrink-0 w-8" /> {/* Spacer for mobile */}

        {/* Center: Progress Steps */}
        <div className="flex items-center gap-1 text-xs overflow-x-auto justify-center">
          {stepOrder.map((s, index) => (
            <div key={s} className="flex items-center shrink-0">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                index <= currentStepIndex
                  ? 'bg-blue-600 text-white'
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

        {/* Right: Code Preview & Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <CodePreview
            tabs={[
              {
                id: 'sender',
                label: 'Sender (TS)',
                labelKo: '송신자 (TS)',
                code: `// TypeScript - @solana/web3.js + @solana/spl-token
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount
} from '@solana/spl-token';

// 1. Connect to Solana network
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// 2. Get token accounts
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const senderAta = await getAssociatedTokenAddress(USDC_MINT, senderKeypair.publicKey);
const recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey);

const transaction = new Transaction();

// 3. Create recipient ATA if needed
try {
  await getAccount(connection, recipientAta);
} catch {
  transaction.add(
    createAssociatedTokenAccountInstruction(
      senderKeypair.publicKey, // payer
      recipientAta,            // ata
      recipientPubkey,         // owner
      USDC_MINT                // mint
    )
  );
}

// 4. Add transfer instruction
const USDC_DECIMALS = 6;
transaction.add(
  createTransferInstruction(
    senderAta,                           // source
    recipientAta,                        // destination
    senderKeypair.publicKey,             // owner
    amount * Math.pow(10, USDC_DECIMALS) // amount in smallest unit
  )
);

// 5. Sign and send
const { blockhash } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;
transaction.feePayer = senderKeypair.publicKey;
transaction.sign(senderKeypair);

const signature = await connection.sendRawTransaction(transaction.serialize());
await connection.confirmTransaction(signature);`,
                codeKo: `// TypeScript - @solana/web3.js + @solana/spl-token
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount
} from '@solana/spl-token';

// 1. 솔라나 네트워크 연결
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// 2. 토큰 계정 조회
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const senderAta = await getAssociatedTokenAddress(USDC_MINT, senderKeypair.publicKey);
const recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey);

const transaction = new Transaction();

// 3. 수신자 ATA가 없으면 생성
try {
  await getAccount(connection, recipientAta);
} catch {
  transaction.add(
    createAssociatedTokenAccountInstruction(
      senderKeypair.publicKey, // 지불자
      recipientAta,            // ata
      recipientPubkey,         // 소유자
      USDC_MINT                // 민트
    )
  );
}

// 4. 전송 명령어 추가
const USDC_DECIMALS = 6;
transaction.add(
  createTransferInstruction(
    senderAta,                           // 출발지
    recipientAta,                        // 목적지
    senderKeypair.publicKey,             // 소유자
    amount * Math.pow(10, USDC_DECIMALS) // 최소 단위 금액
  )
);

// 5. 서명 및 전송
const { blockhash } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;
transaction.feePayer = senderKeypair.publicKey;
transaction.sign(senderKeypair);

const signature = await connection.sendRawTransaction(transaction.serialize());
await connection.confirmTransaction(signature);`,
                packages: [
                  { name: '@solana/web3.js', url: 'https://www.npmjs.com/package/@solana/web3.js' },
                  { name: '@solana/spl-token', url: 'https://www.npmjs.com/package/@solana/spl-token' }
                ]
              }
            ]}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDemo}
            disabled={isRefreshing}
            className="text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? text.resetting : text.resetDemo}
          </Button>
        </div>
      </div>

      {/* Devices Container */}
      <div className="relative flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 py-4">
        <SuccessAnimation show={step === 'completed'} />
        {/* Sender Device */}
        {senderDevice === 'phone' ? (
          <PhoneFrame title={text.sender}>
            <SenderContent />
          </PhoneFrame>
        ) : (
          <DesktopFrame title={text.sender}>
            <SenderContent />
          </DesktopFrame>
        )}

        {/* Transaction Flow Line */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-2 min-w-[80px]">
          <div className="relative flex items-center">
            <motion.div
              className={`h-1 w-16 rounded-full transition-colors duration-300 ${
                step === 'input' ? 'bg-muted' :
                step === 'confirm' ? 'bg-amber-500' :
                step === 'processing' ? 'bg-blue-500' :
                step === 'completed' ? 'bg-blue-500' : 'bg-muted'
              }`}
              animate={
                step === 'processing' ? { opacity: [0.5, 1, 0.5] } : {}
              }
              transition={{ duration: 1, repeat: Infinity }}
            />
            {step === 'processing' && (
              <motion.div
                className="absolute inset-0 rounded-full bg-blue-400"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0, 0.5], scaleX: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-[10px] font-medium ${
              step === 'input' ? 'text-muted-foreground' :
              step === 'confirm' ? 'text-amber-500' :
              step === 'processing' ? 'text-blue-500' :
              step === 'completed' ? 'text-blue-500' : 'text-muted-foreground'
            }`}
          >
            {step === 'input' ? text.ready :
             step === 'confirm' ? text.confirming :
             step === 'processing' ? text.processing :
             step === 'completed' ? text.complete : ''}
          </motion.p>
        </div>

        {/* Mobile flow indicator */}
        <div className="lg:hidden flex items-center gap-2">
          <ArrowRight className={`h-5 w-5 rotate-90 transition-colors ${
            step === 'completed' ? 'text-blue-500' :
            step === 'processing' ? 'text-blue-500' : 'text-muted-foreground'
          }`} />
        </div>

        {/* Recipient Device */}
        {recipientDevice === 'phone' ? (
          <PhoneFrame title={text.recipient}>
            <RecipientContent />
          </PhoneFrame>
        ) : (
          <DesktopFrame title={text.recipient}>
            <RecipientContent />
          </DesktopFrame>
        )}
      </div>
    </div>
  )
}
