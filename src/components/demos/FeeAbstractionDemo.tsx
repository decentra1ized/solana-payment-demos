import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  Loader2,
  Send,
  Wallet,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Shield,
  ArrowRight,
  Sparkles,
  Building2,
  Coins,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

type PaymentStep = 'input' | 'confirm' | 'sponsor-sign' | 'processing' | 'completed'
type TokenType = 'sol' | 'usdc'

// USDC on Devnet
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
const USDC_DECIMALS = 6

// Minimum balance to keep for rent-exemption (~0.00089 SOL) + fee buffer
const MIN_BALANCE_FOR_RENT = 0.001

export function FeeAbstractionDemo() {
  const { language } = useLanguage()
  const { wallets, updateBalance, updateUsdcBalance } = useLocalWallet()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [amount, setAmount] = useState('0.001')
  const [step, setStep] = useState<PaymentStep>('input')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tokenType, setTokenType] = useState<TokenType>('sol')

  // Three wallets: Sponsor (pays fees), Sender (has tokens), Recipient
  const [sponsorWalletId, setSponsorWalletId] = useState<number | null>(null)
  const [senderWalletId, setSenderWalletId] = useState<number | null>(null)
  const [recipientWalletId, setRecipientWalletId] = useState<number | null>(null)

  const [showSponsorDropdown, setShowSponsorDropdown] = useState(false)
  const [showSenderDropdown, setShowSenderDropdown] = useState(false)
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false)

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
      title: 'Fee Abstraction',
      subtitle: 'Institution/3rd Party pays transaction fees on behalf of sender',
      sponsor: 'Fee Sponsor',
      sponsorLabel: 'Institution / 3rd Party',
      sponsorDesc: 'Pays network fee',
      sender: 'Sender',
      senderDesc: 'Sends payment',
      recipient: 'Recipient',
      recipientDesc: 'Receives payment',
      amount: 'Amount',
      amountSol: 'Amount (SOL)',
      amountUsdc: 'Amount (USDC)',
      review: 'Review',
      insufficientSol: 'Need SOL for fees',
      confirm: 'Send with Sponsored Fee',
      processing: 'Processing...',
      completed: 'Transfer Complete!',
      viewOnSolscan: 'View on Solscan',
      tryAgain: 'New Transfer',
      noWallet: 'Create wallets first',
      insufficientBalance: 'Insufficient balance (keep more than transfer amount)',
      selectWallet: 'Select',
      wallet: 'Wallet',
      balance: 'Balance',
      back: 'Back',
      resetDemo: 'Reset',
      fee: 'Fee',
      paidBy: 'Paid by',
      senderPays: 'Sender pays',
      sponsorPays: 'Sponsor pays',
      feeFlow: 'Fee Flow',
      benefit: 'Sender needs no SOL for fees!',
      newBalance: 'New Balance',
      ready: 'Ready',
      confirming: 'Confirming',
      complete: 'Complete',
      sponsorSign: 'Approve Fee',
      waitingSponsor: 'Waiting for sponsor...',
      sponsorSigned: 'Fee Approved',
      senderSign: 'Confirm Send',
      steps: {
        input: 'Amount',
        confirm: 'Sponsor',
        'sponsor-sign': 'Sender',
        processing: 'Process',
        completed: 'Done'
      }
    },
    ko: {
      title: '수수료 대납',
      subtitle: '기관/제3자가 송신자 대신 트랜잭션 수수료 지불',
      sponsor: '수수료 스폰서',
      sponsorLabel: '기관 / 제3자',
      sponsorDesc: '네트워크 수수료 지불',
      sender: '송신자',
      senderDesc: '결제 전송',
      recipient: '수신자',
      recipientDesc: '결제 수신',
      amount: '금액',
      amountSol: '금액 (SOL)',
      amountUsdc: '금액 (USDC)',
      review: '검토',
      insufficientSol: 'SOL 수수료 필요',
      confirm: '스폰서 수수료로 전송',
      processing: '처리 중...',
      completed: '전송 완료!',
      viewOnSolscan: 'Solscan에서 보기',
      tryAgain: '새 전송',
      noWallet: '지갑을 먼저 생성하세요',
      insufficientBalance: '잔액 부족 (송금액보다 여유있게 유지 필요)',
      selectWallet: '선택',
      wallet: '지갑',
      balance: '잔액',
      back: '뒤로',
      resetDemo: '초기화',
      fee: '수수료',
      paidBy: '지불자',
      senderPays: '송신자 지불',
      sponsorPays: '스폰서 지불',
      feeFlow: '수수료 흐름',
      benefit: '송신자는 수수료용 SOL이 필요 없습니다!',
      newBalance: '새 잔액',
      ready: '대기',
      confirming: '확인 중',
      complete: '완료',
      sponsorSign: '수수료 승인',
      waitingSponsor: '스폰서 대기 중...',
      sponsorSigned: '수수료 승인됨',
      senderSign: '전송 확인',
      steps: {
        input: '금액',
        confirm: '스폰서',
        'sponsor-sign': '송신자',
        processing: '처리',
        completed: '완료'
      }
    }
  }

  const text = t[language]
  const estimatedFee = 0.000005

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

  // Auto-select wallets
  useEffect(() => {
    if (wallets.length >= 1 && !sponsorWalletId) {
      setSponsorWalletId(wallets[0].id)
    }
    if (wallets.length >= 2 && !senderWalletId) {
      setSenderWalletId(wallets[1].id)
    }
    if (wallets.length >= 3 && !recipientWalletId) {
      setRecipientWalletId(wallets[2].id)
    } else if (wallets.length >= 2 && !recipientWalletId) {
      setRecipientWalletId(wallets[0].id)
    }
  }, [wallets])

  useEffect(() => {
    if (wallets.length > 0) {
      refreshBalances()
    }
  }, [wallets.length])

  const sponsorWallet = wallets.find(w => w.id === sponsorWalletId)
  const senderWallet = wallets.find(w => w.id === senderWalletId)
  const recipientWallet = wallets.find(w => w.id === recipientWalletId)

  // Early validation for insufficient balance
  const amountValue = parseFloat(amount) || 0
  const hasSufficientBalance = senderWallet ? (
    tokenType === 'sol'
      ? senderWallet.balance >= amountValue + MIN_BALANCE_FOR_RENT
      : (senderWallet.usdcBalance || 0) >= amountValue
  ) : true
  const hasSponsorBalance = sponsorWallet ? sponsorWallet.balance >= estimatedFee : true

  const processPayment = async () => {
    if (!sponsorWallet || !senderWallet || !recipientWallet) {
      setError(text.noWallet)
      return
    }

    const amountValue = parseFloat(amount)

    // Check balance based on token type
    if (tokenType === 'sol') {
      if (senderWallet.balance < amountValue + MIN_BALANCE_FOR_RENT) {
        setError(text.insufficientBalance)
        return
      }
    } else {
      // For USDC, check USDC balance
      if ((senderWallet.usdcBalance || 0) < amountValue) {
        setError(text.insufficientBalance)
        return
      }
    }

    if (sponsorWallet.balance < estimatedFee) {
      setError(language === 'ko' ? '스폰서 잔액 부족' : 'Sponsor insufficient balance')
      return
    }

    setStep('processing')
    setError(null)

    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

      // Create keypairs for both sponsor and sender
      const sponsorSecretKey = new Uint8Array(
        sponsorWallet.secretKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      )
      const sponsorKeypair = Keypair.fromSecretKey(sponsorSecretKey)

      const senderSecretKey = new Uint8Array(
        senderWallet.secretKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      )
      const senderKeypair = Keypair.fromSecretKey(senderSecretKey)
      const recipientPubkey = new PublicKey(recipientWallet.publicKey)

      const transaction = new Transaction()

      if (tokenType === 'usdc') {
        // USDC transfer via SPL Token
        const senderAta = await getAssociatedTokenAddress(USDC_MINT, senderKeypair.publicKey)
        const recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey)

        // Check if recipient ATA exists, create if not
        try {
          await getAccount(connection, recipientAta)
        } catch {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              sponsorKeypair.publicKey, // Sponsor pays for ATA creation
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
            senderKeypair.publicKey,
            BigInt(Math.floor(amountValue * Math.pow(10, USDC_DECIMALS)))
          )
        )
      } else {
        // SOL transfer
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: recipientPubkey,
            lamports: Math.floor(amountValue * LAMPORTS_PER_SOL),
          })
        )
      }

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash

      // KEY: Sponsor is the fee payer, not the sender!
      transaction.feePayer = sponsorKeypair.publicKey

      // Both must sign: sponsor (for fee) and sender (for transfer authority)
      transaction.sign(sponsorKeypair, senderKeypair)

      const signature = await connection.sendRawTransaction(transaction.serialize())
      await connection.confirmTransaction(signature)

      // Update all balances
      const sponsorBalance = await connection.getBalance(sponsorKeypair.publicKey)
      const senderBalance = await connection.getBalance(senderKeypair.publicKey)
      const recipientBalance = await connection.getBalance(recipientPubkey)

      updateBalance(sponsorWallet.id, sponsorBalance / LAMPORTS_PER_SOL)
      updateBalance(senderWallet.id, senderBalance / LAMPORTS_PER_SOL)
      updateBalance(recipientWallet.id, recipientBalance / LAMPORTS_PER_SOL)

      // Also update USDC balances
      const sponsorUsdcBalance = await getUsdcBalanceFromChain(connection, sponsorKeypair.publicKey)
      const senderUsdcBalance = await getUsdcBalanceFromChain(connection, senderKeypair.publicKey)
      const recipientUsdcBalance = await getUsdcBalanceFromChain(connection, recipientPubkey)

      updateUsdcBalance(sponsorWallet.id, sponsorUsdcBalance)
      updateUsdcBalance(senderWallet.id, senderUsdcBalance)
      updateUsdcBalance(recipientWallet.id, recipientUsdcBalance)

      setTxSignature(signature)
      setStep('completed')
    } catch (err) {
      console.error('Payment failed:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
      setStep('sponsor-sign')
    }
  }

  const reset = () => {
    setStep('input')
    setAmount(tokenType === 'sol' ? '0.001' : '0.01')
    setTxSignature(null)
    setError(null)
  }

  const resetDemo = async () => {
    reset()
    await refreshBalances()
  }

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
        <ChevronDown className="h-2 w-2" />
      </button>
      {showDropdown && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-background border rounded-lg shadow-lg z-50 min-w-[80px]">
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
  const PhoneFrame = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      {subtitle && <span className="text-[10px] text-muted-foreground">{subtitle}</span>}
      <div className="relative bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-gray-900 rounded-b-xl z-10" />
        <div className="w-36 h-64 sm:w-40 sm:h-72 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-[1.5rem] overflow-hidden">
          <div className="h-full flex flex-col pt-6">
            {children}
          </div>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-600 rounded-full" />
      </div>
    </div>
  )

  // Desktop Frame Component for Sponsor (Institution)
  const DesktopFrame = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      {subtitle && <span className="text-[10px] text-amber-600 font-medium">{subtitle}</span>}
      <div className="relative">
        <div className="bg-gray-900 rounded-lg p-2 shadow-2xl">
          <div className="w-44 h-48 sm:w-52 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded overflow-hidden relative">
            {children}
            {/* Institution Logo Badge */}
            <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 rounded-lg p-1.5 shadow-lg border border-amber-200 dark:border-amber-800">
              <Building2 className="h-4 w-4 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-4 h-6 bg-gray-700" />
          <div className="w-16 h-2 bg-gray-700 rounded-b-lg" />
        </div>
      </div>
    </div>
  )

  // Sponsor Device Content
  const SponsorContent = () => (
    <div className="h-full flex flex-col">
      <div className="bg-amber-500/20 px-2 py-1 border-b flex items-center justify-center gap-1">
        <Building2 className="h-3 w-3 text-amber-600" />
        <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-400">{text.sponsorLabel}</span>
      </div>

      <div className="flex-1 p-2 flex flex-col items-center justify-center">
        <WalletSelector
          selectedWallet={sponsorWallet}
          onSelect={setSponsorWalletId}
          showDropdown={showSponsorDropdown}
          setShowDropdown={setShowSponsorDropdown}
        />

        <div className="mt-2 text-center">
          <p className="text-[9px] text-muted-foreground">{text.balance}</p>
          <p className="text-sm font-bold">{sponsorWallet?.balance.toFixed(4) || '0'} SOL</p>
        </div>

        {step === 'input' && (
          <div className="mt-2 px-2 py-1 bg-amber-100/50 dark:bg-amber-900/20 rounded-full">
            <p className="text-[9px] text-amber-600 dark:text-amber-500">
              {text.sponsorPays}: ~{estimatedFee.toFixed(6)} SOL
            </p>
          </div>
        )}

        {step === 'confirm' && (
          <div className="mt-2 space-y-2">
            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2 text-center">
              <p className="text-[9px] text-amber-700 dark:text-amber-400">{text.fee}: ~{estimatedFee.toFixed(6)} SOL</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Button
                onClick={() => setStep('sponsor-sign')}
                size="sm"
                className="w-full text-[9px] h-6 bg-amber-500 hover:bg-amber-600 ring-2 ring-amber-400/50 ring-offset-1"
              >
                <Shield className="h-3 w-3 mr-1" />
                {text.sponsorSign}
              </Button>
            </motion.div>
          </div>
        )}

        {step === 'sponsor-sign' && (
          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1">
              <Check className="h-3 w-3 text-amber-600" />
            </div>
            <p className="text-[9px] font-medium text-amber-600">{text.sponsorSigned}</p>
          </div>
        )}

        {step === 'processing' && (
          <div className="mt-2">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          </div>
        )}

        {step === 'completed' && (
          <div className="mt-2 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <p className="text-[9px] font-medium text-amber-700 dark:text-amber-400">
              -{estimatedFee.toFixed(6)} SOL ({text.fee})
            </p>
          </div>
        )}
      </div>
    </div>
  )

  // Sender Device Content
  const SenderContent = () => (
    <div className="h-full flex flex-col">
      <div className="bg-primary/10 px-2 py-1 border-b flex items-center justify-center">
        <span className="text-[9px] font-semibold">{text.sender}</span>
      </div>

      <div className="flex-1 p-2 flex flex-col items-center justify-center">
        <WalletSelector
          selectedWallet={senderWallet}
          onSelect={setSenderWalletId}
          showDropdown={showSenderDropdown}
          setShowDropdown={setShowSenderDropdown}
        />

        <div className="mt-2 text-center">
          <p className="text-[9px] text-muted-foreground">{text.balance}</p>
          <p className={`text-sm font-bold ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
            {tokenType === 'usdc'
              ? `${(senderWallet?.usdcBalance || 0).toFixed(4)} USDC`
              : `${senderWallet?.balance.toFixed(4) || '0'} SOL`
            }
          </p>
        </div>

        {step === 'input' && (
          <div className="mt-2 space-y-1 w-full">
            {/* Token Type Toggle */}
            <div className="flex justify-center gap-1 mb-1">
              <button
                onClick={() => { setTokenType('sol'); setAmount('0.001'); }}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] transition-colors ${
                  tokenType === 'sol' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Coins className="h-2.5 w-2.5" />
                SOL
              </button>
              <button
                onClick={() => { setTokenType('usdc'); setAmount('0.01'); }}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] transition-colors ${
                  tokenType === 'usdc' ? 'bg-blue-600 text-white' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <DollarSign className="h-2.5 w-2.5" />
                USDC
              </button>
            </div>

            <Label className="text-[9px]">{tokenType === 'sol' ? text.amountSol : text.amountUsdc}</Label>
            <Input
              type="number"
              key={`amount-${tokenType}-${amount}`}
              defaultValue={amount}
              onBlur={(e) => setAmount(e.target.value)}
              step="0.00001"
              min="0.00001"
              className="text-center text-xs font-bold h-6"
            />
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Button
                onClick={() => setStep('confirm')}
                size="sm"
                className={`w-full text-[9px] h-6 ring-2 ring-offset-1 ${
                  tokenType === 'usdc' ? 'bg-blue-600 hover:bg-blue-700 ring-blue-500/50' : 'ring-primary/50'
                }`}
                disabled={!sponsorWallet || !senderWallet || !recipientWallet || !hasSufficientBalance || !hasSponsorBalance}
              >
                <Send className="h-3 w-3 mr-1" />
                {text.review}
              </Button>
            </motion.div>
            {senderWallet && !hasSufficientBalance && (
              <p className="text-[10px] text-red-500 text-center break-words">{text.insufficientBalance}</p>
            )}
            {sponsorWallet && !hasSponsorBalance && (
              <p className="text-[10px] text-red-500 text-center break-words">{language === 'ko' ? '스폰서 잔액 부족' : 'Sponsor insufficient balance'}</p>
            )}
          </div>
        )}

        {step === 'confirm' && (
          <div className="mt-2 space-y-1">
            <div className="bg-muted/50 rounded-lg p-1.5 space-y-0.5 text-[9px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{text.amount}</span>
                <span className={`font-bold ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
                  {amount} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{text.fee}</span>
                <span className="text-amber-600">{text.sponsorPays}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 py-1">
              <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
              <p className="text-[9px] text-amber-600">{text.waitingSponsor}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep('input')} className="w-full text-[9px] h-6">
              {text.back}
            </Button>
          </div>
        )}

        {step === 'sponsor-sign' && (
          <div className="mt-2 space-y-1">
            <div className="bg-muted/50 rounded-lg p-1.5 space-y-0.5 text-[9px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{text.amount}</span>
                <span className={`font-bold ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
                  {amount} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{text.fee}</span>
                <span className="text-amber-600 flex items-center gap-1">
                  <Check className="h-2 w-2" />
                  {text.sponsorSigned}
                </span>
              </div>
            </div>
            {error && <p className="text-[9px] text-red-500 text-center">{error}</p>}
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Button
                size="sm"
                onClick={processPayment}
                className={`w-full text-[9px] h-6 ring-2 ring-offset-1 ${
                  tokenType === 'usdc' ? 'bg-blue-600 hover:bg-blue-700 ring-blue-500/50' : 'ring-primary/50'
                }`}
              >
                <Send className="h-3 w-3 mr-1" />
                {text.senderSign}
              </Button>
            </motion.div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <Loader2 className={`h-6 w-6 animate-spin ${tokenType === 'usdc' ? 'text-blue-600' : 'text-primary'}`} />
            <p className="text-[10px]">{text.processing}</p>
          </div>
        )}

        {step === 'completed' && (
          <div className="flex flex-col items-center gap-1 mt-2">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <p className={`text-[10px] font-medium ${tokenType === 'usdc' ? 'text-blue-600' : 'text-green-600'}`}>
              -{amount} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
            </p>
            <p className="text-[9px] text-muted-foreground">
              {text.newBalance}: {tokenType === 'usdc'
                ? `${(senderWallet?.usdcBalance || 0).toFixed(4)} USDC`
                : `${senderWallet?.balance.toFixed(4)} SOL`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )

  // Recipient Device Content
  const RecipientContent = () => (
    <div className="h-full flex flex-col">
      <div className="bg-green-500/10 px-2 py-1 border-b flex items-center justify-center">
        <span className="text-[9px] font-semibold text-green-700 dark:text-green-400">{text.recipient}</span>
      </div>

      <div className="flex-1 p-2 flex flex-col items-center justify-center">
        <WalletSelector
          selectedWallet={recipientWallet}
          onSelect={setRecipientWalletId}
          showDropdown={showRecipientDropdown}
          setShowDropdown={setShowRecipientDropdown}
        />

        <div className="mt-2 text-center">
          <p className="text-[9px] text-muted-foreground">{text.balance}</p>
          <p className={`text-sm font-bold ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
            {tokenType === 'usdc'
              ? `${(recipientWallet?.usdcBalance || 0).toFixed(4)} USDC`
              : `${recipientWallet?.balance.toFixed(4) || '0'} SOL`
            }
          </p>
        </div>

        {step === 'processing' && (
          <div className="mt-2">
            <Loader2 className={`h-5 w-5 animate-spin ${tokenType === 'usdc' ? 'text-blue-500' : 'text-green-500'}`} />
          </div>
        )}

        {step === 'completed' && (
          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <p className={`text-[10px] font-medium ${tokenType === 'usdc' ? 'text-blue-600' : 'text-green-600'}`}>
              +{amount} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
            </p>
            {txSignature && (
              <div className="relative mt-1">
                <SolscanBubble show={true} />
                <a
                  href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[9px] text-primary hover:underline"
                >
                  Solscan <ExternalLink className="h-2 w-2" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (wallets.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">{text.noWallet}</p>
        <p className="text-xs text-muted-foreground">
          {language === 'ko' ? '최소 2개의 지갑이 필요합니다' : 'Need at least 2 wallets'}
        </p>
      </div>
    )
  }

  const codeTabs = [
    {
      id: 'sponsor',
      label: 'Sponsor (TS)',
      labelKo: '스폰서 (TS)',
      code: `// TypeScript - @solana/web3.js
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js'

// Sponsor (Institution/3rd Party) pays transaction fees
// This enables gasless transactions for end users

async function sponsorTransaction(
  connection: Connection,
  sponsorKeypair: Keypair,
  unsignedTransaction: Transaction
) {
  // Set the sponsor as the fee payer
  unsignedTransaction.feePayer = sponsorKeypair.publicKey

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash()
  unsignedTransaction.recentBlockhash = blockhash

  // Sponsor partially signs (for fee payment)
  unsignedTransaction.partialSign(sponsorKeypair)

  // Return partially signed transaction
  // Sender will add their signature for transfer authorization
  return unsignedTransaction
}

// For production: Use a backend service to sign transactions
// Frontend sends unsigned tx → Backend (sponsor) signs → Returns to frontend
// This keeps sponsor private key secure on server`,
      codeKo: `// TypeScript - @solana/web3.js
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js'

// 스폰서(기관/제3자)가 트랜잭션 수수료를 대납합니다
// 이를 통해 최종 사용자에게 가스리스 트랜잭션을 제공합니다

async function sponsorTransaction(
  connection: Connection,
  sponsorKeypair: Keypair,
  unsignedTransaction: Transaction
) {
  // 스폰서를 수수료 지불자로 설정
  unsignedTransaction.feePayer = sponsorKeypair.publicKey

  // 최신 블록해시 조회
  const { blockhash } = await connection.getLatestBlockhash()
  unsignedTransaction.recentBlockhash = blockhash

  // 스폰서가 부분 서명 (수수료 지불 승인)
  unsignedTransaction.partialSign(sponsorKeypair)

  // 부분 서명된 트랜잭션 반환
  // 송신자가 전송 승인을 위한 서명을 추가합니다
  return unsignedTransaction
}

// 프로덕션 환경: 백엔드 서비스를 사용하여 트랜잭션 서명
// 프론트엔드가 미서명 tx 전송 → 백엔드(스폰서)가 서명 → 프론트엔드로 반환
// 이렇게 하면 스폰서 개인키가 서버에 안전하게 보관됩니다`,
      packages: [
        { name: '@solana/web3.js', url: 'https://www.npmjs.com/package/@solana/web3.js' }
      ]
    },
    {
      id: 'sender',
      label: 'Sender (TS)',
      labelKo: '송신자 (TS)',
      code: `// TypeScript - @solana/web3.js
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js'

// Sender creates and signs transaction with sponsor paying fees
async function createSponsoredTransfer(
  connection: Connection,
  senderKeypair: Keypair,
  sponsorKeypair: Keypair,  // In production: comes from backend
  recipientPubkey: PublicKey,
  amountInSol: number
) {
  // Create transfer instruction (sender → recipient)
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: senderKeypair.publicKey,
    toPubkey: recipientPubkey,
    lamports: Math.floor(amountInSol * LAMPORTS_PER_SOL),
  })

  const transaction = new Transaction().add(transferInstruction)

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash

  // KEY: Sponsor is the fee payer, NOT the sender!
  transaction.feePayer = sponsorKeypair.publicKey

  // Both must sign:
  // - Sponsor signs to authorize fee payment
  // - Sender signs to authorize the transfer
  transaction.sign(sponsorKeypair, senderKeypair)

  const signature = await connection.sendRawTransaction(
    transaction.serialize()
  )
  await connection.confirmTransaction(signature)

  return signature
}

// Benefits:
// - Senders don't need SOL for fees (gasless UX)
// - Institution covers operational costs
// - Better onboarding experience for new users`,
      codeKo: `// TypeScript - @solana/web3.js
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js'

// 송신자가 스폰서의 수수료 대납으로 트랜잭션을 생성하고 서명합니다
async function createSponsoredTransfer(
  connection: Connection,
  senderKeypair: Keypair,
  sponsorKeypair: Keypair,  // 프로덕션 환경: 백엔드에서 제공
  recipientPubkey: PublicKey,
  amountInSol: number
) {
  // 전송 명령어 생성 (송신자 → 수신자)
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: senderKeypair.publicKey,
    toPubkey: recipientPubkey,
    lamports: Math.floor(amountInSol * LAMPORTS_PER_SOL),
  })

  const transaction = new Transaction().add(transferInstruction)

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash

  // 핵심: 스폰서가 수수료 지불자이며, 송신자가 아닙니다!
  transaction.feePayer = sponsorKeypair.publicKey

  // 양측 모두 서명해야 합니다:
  // - 스폰서: 수수료 지불 승인
  // - 송신자: 전송 승인
  transaction.sign(sponsorKeypair, senderKeypair)

  const signature = await connection.sendRawTransaction(
    transaction.serialize()
  )
  await connection.confirmTransaction(signature)

  return signature
}

// 장점:
// - 송신자는 수수료용 SOL이 필요 없음 (가스리스 UX)
// - 기관이 운영 비용 부담
// - 신규 사용자에게 더 나은 온보딩 경험`,
      packages: [
        { name: '@solana/web3.js', url: 'https://www.npmjs.com/package/@solana/web3.js' }
      ]
    },
    {
      id: 'recipient',
      label: 'Recipient (TS)',
      labelKo: '수신자 (TS)',
      code: `// TypeScript - @solana/web3.js
// Note: Recipients can check balance changes directly in their wallet.
// Use this code if you want to verify programmatically.

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

async function checkBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  const balance = await connection.getBalance(publicKey)
  return balance / LAMPORTS_PER_SOL
}

// Subscribe to balance changes in real-time
function subscribeToBalance(
  connection: Connection,
  publicKey: PublicKey,
  onBalanceChange: (balance: number) => void
) {
  return connection.onAccountChange(
    publicKey,
    (accountInfo) => {
      const balance = accountInfo.lamports / LAMPORTS_PER_SOL
      onBalanceChange(balance)
    },
    'confirmed'
  )
}

// Example usage:
const connection = new Connection('https://api.devnet.solana.com')
const recipientPubkey = new PublicKey('YOUR_PUBLIC_KEY')

// One-time check
const balance = await checkBalance(connection, recipientPubkey)
console.log(\`Balance: \${balance} SOL\`)

// Real-time subscription
const subscriptionId = subscribeToBalance(
  connection,
  recipientPubkey,
  (newBalance) => console.log(\`New balance: \${newBalance} SOL\`)
)`,
      codeKo: `// TypeScript - @solana/web3.js
// 참고: 수신자는 지갑에서 직접 잔액 변동을 확인할 수 있습니다.
// 프로그래밍 방식으로 확인하려면 이 코드를 사용하세요.

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

async function checkBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  const balance = await connection.getBalance(publicKey)
  return balance / LAMPORTS_PER_SOL
}

// 실시간 잔액 변동 구독
function subscribeToBalance(
  connection: Connection,
  publicKey: PublicKey,
  onBalanceChange: (balance: number) => void
) {
  return connection.onAccountChange(
    publicKey,
    (accountInfo) => {
      const balance = accountInfo.lamports / LAMPORTS_PER_SOL
      onBalanceChange(balance)
    },
    'confirmed'
  )
}

// 사용 예시:
const connection = new Connection('https://api.devnet.solana.com')
const recipientPubkey = new PublicKey('YOUR_PUBLIC_KEY')

// 일회성 잔액 조회
const balance = await checkBalance(connection, recipientPubkey)
console.log(\`잔액: \${balance} SOL\`)

// 실시간 구독
const subscriptionId = subscribeToBalance(
  connection,
  recipientPubkey,
  (newBalance) => console.log(\`새 잔액: \${newBalance} SOL\`)
)`,
      packages: [
        { name: '@solana/web3.js', url: 'https://www.npmjs.com/package/@solana/web3.js' }
      ]
    }
  ]

  const stepOrder: PaymentStep[] = ['input', 'confirm', 'sponsor-sign', 'processing', 'completed']
  const currentStepIndex = stepOrder.indexOf(step)

  return (
    <div className="space-y-4">
      {/* Header with Progress Steps */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Spacer for balance */}
        <div className="shrink-0 w-8 sm:w-24" />

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

        {/* Right: Code Preview & Refresh */}
        <div className="flex items-center gap-2 shrink-0">
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

      {/* Three Devices Visualization */}
      <div className="relative flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 py-4">
        <SuccessAnimation show={step === 'completed'} />
        {/* Sender Phone */}
        <PhoneFrame title={text.sender}>
          <SenderContent />
        </PhoneFrame>

        {/* Flow Line: Sender to Sponsor */}
        <div className="hidden lg:flex flex-col items-center gap-1">
          <span className="text-[9px] text-amber-600">{text.fee}</span>
          <motion.div
            className={`h-0.5 w-12 rounded-full transition-colors ${
              step === 'completed' ? 'bg-amber-500' :
              step === 'processing' ? 'bg-amber-400' : 'bg-muted'
            }`}
            animate={step === 'processing' ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <ArrowRight className={`h-3 w-3 ${
            step === 'completed' ? 'text-amber-500' :
            step === 'processing' ? 'text-amber-400' : 'text-muted-foreground'
          }`} />
        </div>

        {/* Mobile flow indicator */}
        <div className="lg:hidden flex items-center gap-2">
          <ArrowRight className={`h-5 w-5 rotate-90 transition-colors ${
            step === 'completed' ? 'text-amber-500' :
            step === 'processing' ? 'text-amber-400' : 'text-muted-foreground'
          }`} />
        </div>

        {/* Sponsor Desktop (Institution/3rd Party) */}
        <DesktopFrame title={text.sponsor} subtitle={text.sponsorLabel}>
          <SponsorContent />
        </DesktopFrame>

        {/* Flow Line: Transfer to Recipient */}
        <div className="hidden lg:flex flex-col items-center gap-1">
          <span className={`text-[9px] ${tokenType === 'usdc' ? 'text-blue-600' : 'text-green-600'}`}>
            {amount} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
          </span>
          <motion.div
            className={`h-0.5 w-12 rounded-full transition-colors ${
              step === 'completed' ? 'bg-green-500' :
              step === 'processing' ? 'bg-primary' : 'bg-muted'
            }`}
            animate={step === 'processing' ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <ArrowRight className={`h-3 w-3 ${
            step === 'completed' ? 'text-green-500' :
            step === 'processing' ? 'text-primary' : 'text-muted-foreground'
          }`} />
        </div>

        {/* Mobile flow indicator */}
        <div className="lg:hidden flex items-center gap-2">
          <ArrowRight className={`h-5 w-5 rotate-90 transition-colors ${
            step === 'completed' ? 'text-green-500' :
            step === 'processing' ? 'text-primary' : 'text-muted-foreground'
          }`} />
        </div>

        {/* Recipient Phone */}
        <PhoneFrame title={text.recipient}>
          <RecipientContent />
        </PhoneFrame>
      </div>

      {/* Benefit Badge & Try Again */}
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-green-50 dark:from-amber-900/20 dark:to-green-900/20 rounded-full border border-amber-200/50 dark:border-amber-800/50">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            {text.benefit}
          </p>
          <Check className="h-4 w-4 text-green-500" />
        </div>

        {step === 'completed' && (
          <Button variant="outline" size="sm" onClick={reset} className="text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            {text.tryAgain}
          </Button>
        )}
      </div>
    </div>
  )
}
