import { useState, useEffect, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import {
  Check,
  Loader2,
  RefreshCw,
  ArrowRight,
  Wallet,
  ExternalLink,
  Scan as ScanIcon,
  ChevronDown,
  Tablet,
  Monitor,
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

type PaymentStep = 'input' | 'qr-generated' | 'scanning' | 'confirming' | 'processing' | 'completed'
type POSType = 'tablet' | 'traditional'
type TokenType = 'sol' | 'usdc'

// USDC on Devnet
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
const USDC_DECIMALS = 6

// Minimum balance to keep for rent-exemption (~0.00089 SOL) + fee buffer
const MIN_BALANCE_FOR_RENT = 0.001

export function SolanaPayQRDemo() {
  const { language } = useLanguage()
  const { wallets, updateBalance, updateUsdcBalance } = useLocalWallet()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [amount, setAmount] = useState('0.001')
  const [step, setStep] = useState<PaymentStep>('input')
  const [solanaPayUrl, setSolanaPayUrl] = useState('')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [posType, setPosType] = useState<POSType>('tablet')
  const [tokenType, setTokenType] = useState<TokenType>('sol')

  // Separate wallet selection for merchant and customer
  const [merchantWalletId, setMerchantWalletId] = useState<number | null>(null)
  const [customerWalletId, setCustomerWalletId] = useState<number | null>(null)
  const [showMerchantDropdown, setShowMerchantDropdown] = useState(false)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

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

  // Refresh balances from blockchain
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

  // Auto-select wallets if available
  useEffect(() => {
    if (wallets.length >= 1 && !merchantWalletId) {
      setMerchantWalletId(wallets[0].id)
    }
    if (wallets.length >= 2 && !customerWalletId) {
      setCustomerWalletId(wallets[1].id)
    } else if (wallets.length === 1 && !customerWalletId) {
      setCustomerWalletId(wallets[0].id)
    }
  }, [wallets])

  // Refresh balances on mount
  useEffect(() => {
    if (wallets.length > 0) {
      refreshBalances()
    }
  }, [wallets.length])

  const merchantWallet = wallets.find(w => w.id === merchantWalletId)
  const customerWallet = wallets.find(w => w.id === customerWalletId)

  const t = {
    en: {
      title: 'Solana Pay QR Demo',
      merchantSide: 'Merchant POS',
      customerSide: 'Customer Wallet',
      enterAmount: 'Payment Amount',
      enterAmountSol: 'Payment Amount (SOL)',
      enterAmountUsdc: 'Payment Amount (USDC)',
      generateQR: 'Generate QR',
      qrGenerated: 'Ready to Scan',
      waitingForScan: 'Present QR to customer',
      simulateScan: 'Scan QR Code',
      paymentDetails: 'Payment Details',
      to: 'To',
      confirmPayment: 'Pay Now',
      processing: 'Processing...',
      completed: 'Payment Complete!',
      txHash: 'Transaction',
      viewOnSolscan: 'View on Solscan',
      tryAgain: 'New Payment',
      noWallet: 'Create wallet first',
      insufficientBalance: 'Insufficient balance (keep more than transfer amount)',
      insufficientSol: 'Need SOL for fees',
      step: 'Step',
      scanning: 'Scanning...',
      selectWallet: 'Select Wallet',
      wallet: 'Wallet',
      receiving: 'Receiving',
      paying: 'Paying',
      balance: 'Balance',
      newBalance: 'New Balance',
      paymentRequest: 'Payment Request',
      waitingConfirmation: 'Waiting for confirmation...',
      resetDemo: 'Reset',
      resetting: 'Resetting...',
      fee: 'Network Fee',
      posTablet: 'Tablet',
      posTraditional: 'POS',
      posType: 'Device',
      steps: {
        input: 'Amount',
        'qr-generated': 'QR Ready',
        scanning: 'Scanning',
        confirming: 'Confirm',
        processing: 'Processing',
        completed: 'Done'
      }
    },
    ko: {
      title: 'Solana Pay QR 데모',
      merchantSide: '판매자 POS',
      customerSide: '고객 지갑',
      enterAmount: '결제 금액',
      enterAmountSol: '결제 금액 (SOL)',
      enterAmountUsdc: '결제 금액 (USDC)',
      generateQR: 'QR 생성',
      qrGenerated: '스캔 대기 중',
      waitingForScan: '고객에게 QR을 보여주세요',
      simulateScan: 'QR 스캔하기',
      paymentDetails: '결제 정보',
      to: '받는 곳',
      confirmPayment: '결제하기',
      processing: '처리 중...',
      completed: '결제 완료!',
      txHash: '트랜잭션',
      viewOnSolscan: 'Solscan에서 보기',
      tryAgain: '새 결제',
      noWallet: '지갑을 먼저 생성하세요',
      insufficientBalance: '잔액 부족 (송금액보다 여유있게 유지 필요)',
      insufficientSol: 'SOL 수수료 필요',
      step: '단계',
      scanning: '스캔 중...',
      selectWallet: '지갑 선택',
      wallet: '지갑',
      receiving: '수신',
      paying: '결제',
      balance: '잔액',
      newBalance: '새 잔액',
      paymentRequest: '결제 요청',
      waitingConfirmation: '확인 대기 중...',
      resetDemo: '초기화',
      resetting: '초기화 중...',
      fee: '네트워크 수수료',
      posTablet: '태블릿',
      posTraditional: 'POS',
      posType: '기기',
      steps: {
        input: '금액',
        'qr-generated': 'QR 생성',
        scanning: '스캔',
        confirming: '확인',
        processing: '처리',
        completed: '완료'
      }
    }
  }

  const text = t[language]

  const generateSolanaPayUrl = () => {
    if (!amount || parseFloat(amount) <= 0 || !merchantWallet) return

    let url: string
    if (tokenType === 'usdc') {
      // For USDC, include SPL token parameter
      url = `solana:${merchantWallet.publicKey}?amount=${amount}&spl-token=${USDC_MINT.toBase58()}&label=Demo%20Store&message=USDC%20Payment`
    } else {
      url = `solana:${merchantWallet.publicKey}?amount=${amount}&label=Demo%20Store&message=Payment%20Demo`
    }

    setSolanaPayUrl(url)
    setStep('qr-generated')
    setError(null)
  }

  const simulateScan = () => {
    setStep('scanning')
    setTimeout(() => {
      setStep('confirming')
    }, 2000)
  }

  const processPayment = async () => {
    if (!customerWallet) {
      setError(text.noWallet)
      return
    }

    if (!merchantWallet) {
      setError(text.noWallet)
      return
    }

    // Allow same wallet for both merchant and customer (self-transfer for demo purposes)

    const amountValue = parseFloat(amount)

    // Check balance based on token type
    if (tokenType === 'sol') {
      if (customerWallet.balance < amountValue + MIN_BALANCE_FOR_RENT) {
        setError(text.insufficientBalance)
        return
      }
    } else {
      // For USDC, check USDC balance and SOL for fees
      if ((customerWallet.usdcBalance || 0) < amountValue) {
        setError(text.insufficientBalance)
        return
      }
      if (customerWallet.balance < MIN_BALANCE_FOR_RENT) {
        setError(text.insufficientSol)
        return
      }
    }

    setStep('processing')
    setError(null)

    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const secretKeyArray = new Uint8Array(
        customerWallet.secretKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      )
      const payerKeypair = Keypair.fromSecretKey(secretKeyArray)
      const merchantPubkey = new PublicKey(merchantWallet.publicKey)

      const transaction = new Transaction()

      if (tokenType === 'usdc') {
        // USDC transfer via SPL Token
        const senderAta = await getAssociatedTokenAddress(USDC_MINT, payerKeypair.publicKey)
        const recipientAta = await getAssociatedTokenAddress(USDC_MINT, merchantPubkey)

        // Check if recipient ATA exists, create if not
        try {
          await getAccount(connection, recipientAta)
        } catch {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              payerKeypair.publicKey,
              recipientAta,
              merchantPubkey,
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
            BigInt(Math.floor(amountValue * Math.pow(10, USDC_DECIMALS)))
          )
        )
      } else {
        // SOL transfer
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: payerKeypair.publicKey,
            toPubkey: merchantPubkey,
            lamports: Math.floor(amountValue * LAMPORTS_PER_SOL),
          })
        )
      }

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = payerKeypair.publicKey
      transaction.sign(payerKeypair)

      const signature = await connection.sendRawTransaction(transaction.serialize())
      await connection.confirmTransaction(signature)

      // Update both wallets' balances
      const customerBalance = await connection.getBalance(payerKeypair.publicKey)
      const merchantBalance = await connection.getBalance(merchantPubkey)
      updateBalance(customerWallet.id, customerBalance / LAMPORTS_PER_SOL)
      updateBalance(merchantWallet.id, merchantBalance / LAMPORTS_PER_SOL)

      // Also update USDC balances
      const customerUsdcBalance = await getUsdcBalanceFromChain(connection, payerKeypair.publicKey)
      const merchantUsdcBalance = await getUsdcBalanceFromChain(connection, merchantPubkey)
      updateUsdcBalance(customerWallet.id, customerUsdcBalance)
      updateUsdcBalance(merchantWallet.id, merchantUsdcBalance)

      setTxSignature(signature)
      setStep('completed')
    } catch (err) {
      console.error('Payment failed:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
      setStep('confirming')
    }
  }

  const reset = () => {
    setStep('input')
    setAmount(tokenType === 'sol' ? '0.001' : '0.01')
    setSolanaPayUrl('')
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
        className="flex items-center gap-2 px-2 py-1 rounded-lg bg-background/50 hover:bg-background/80 transition-colors text-xs"
      >
        <Wallet className="h-3 w-3" />
        <span>{selectedWallet ? `${text.wallet} ${selectedWallet.name}` : text.selectWallet}</span>
        <ChevronDown className="h-3 w-3" />
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
              className={`w-full text-center px-3 py-1.5 text-xs hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
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

  // POS Content Component (shared between tablet and traditional POS)
  const POSContent = () => (
    <div className="h-full flex flex-col">
      {/* POS Header */}
      <div className="bg-primary/10 px-3 py-2 border-b flex items-center justify-between">
        <p className="text-xs font-semibold">Demo Store POS</p>
        <WalletSelector
          selectedWallet={merchantWallet}
          onSelect={setMerchantWalletId}
          showDropdown={showMerchantDropdown}
          setShowDropdown={setShowMerchantDropdown}
        />
      </div>

      {/* POS Content */}
      <div className="flex-1 p-4 flex flex-col justify-center relative">
        {step === 'input' && (
          <div className="space-y-4">
            {/* Token Type Toggle */}
            <div className="flex justify-center gap-1">
              <button
                onClick={() => { setTokenType('sol'); setAmount('0.001'); }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  tokenType === 'sol' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Coins className="h-3 w-3" />
                SOL
              </button>
              <button
                onClick={() => { setTokenType('usdc'); setAmount('0.01'); }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  tokenType === 'usdc' ? 'bg-blue-600 text-white' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <DollarSign className="h-3 w-3" />
                USDC
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{tokenType === 'sol' ? text.enterAmountSol : text.enterAmountUsdc}</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.00001"
                min="0.00001"
                max="1"
                className="text-center text-lg font-bold"
              />
            </div>
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Button
                onClick={generateSolanaPayUrl}
                className={`w-full ring-2 ring-offset-2 ${
                  tokenType === 'usdc' ? 'bg-blue-600 hover:bg-blue-700 ring-blue-500/50' : 'ring-primary/50'
                }`}
                size="sm"
                disabled={!merchantWallet}
              >
                {text.generateQR}
              </Button>
            </motion.div>
            {merchantWallet && (
              <p className="text-[10px] text-center text-muted-foreground">
                {text.receiving}: {text.wallet} {merchantWallet.name}
              </p>
            )}
          </div>
        )}

        {(step === 'qr-generated' || step === 'scanning') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="bg-white p-3 rounded-xl shadow-lg">
              <QRCodeSVG
                value={solanaPayUrl}
                size={posType === 'traditional' ? 100 : 120}
                level="M"
                includeMargin
              />
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
                {amount} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
              </p>
              <p className="text-xs text-muted-foreground">{text.waitingForScan}</p>
            </div>
            {step === 'scanning' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`absolute inset-0 rounded-lg flex items-center justify-center ${
                  tokenType === 'usdc' ? 'bg-blue-600/20' : 'bg-primary/20'
                }`}
              >
                <div className="bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className={`text-sm font-medium ${tokenType === 'usdc' ? 'text-blue-600' : 'text-primary'}`}>
                    {text.scanning}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {(step === 'confirming' || step === 'processing') && (
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-lg opacity-50">
              <QRCodeSVG value={solanaPayUrl} size={80} level="M" />
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
              {step === 'processing' ? text.processing : text.waitingConfirmation}
            </p>
          </div>
        )}

        {step === 'completed' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <p className="font-bold text-green-600">{text.completed}</p>
              <p className={`text-lg font-bold ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
                +{amount} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
              </p>
              {merchantWallet && (
                <p className="text-xs text-muted-foreground mt-1">
                  {text.newBalance}: {tokenType === 'usdc'
                    ? `${(merchantWallet.usdcBalance || 0).toFixed(4)} USDC`
                    : `${merchantWallet.balance.toFixed(4)} SOL`
                  }
                </p>
              )}
            </div>
            <Button onClick={reset} variant="outline" size="sm" className="mt-2">
              <RefreshCw className="h-3 w-3 mr-1" />
              {text.tryAgain}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )

  const stepOrder: PaymentStep[] = ['input', 'qr-generated', 'scanning', 'confirming', 'processing', 'completed']
  const currentStepIndex = stepOrder.indexOf(step)

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">{text.noWallet}</p>
      </div>
    )
  }

  const codeTabs = [
    {
      id: 'merchant',
      label: 'Merchant (TS)',
      labelKo: '판매자 (TS)',
      code: `// TypeScript - @solana/pay, @solana/web3.js
import { encodeURL, createQR } from '@solana/pay'
import { PublicKey, Cluster } from '@solana/web3.js'
import BigNumber from 'bignumber.js'

// Generate Solana Pay URL for payment request
function generatePaymentRequest(
  recipientPubkey: PublicKey,
  amount: number,
  label?: string,
  message?: string,
  memo?: string,
  reference?: PublicKey[]
) {
  const url = encodeURL({
    recipient: recipientPubkey,
    amount: new BigNumber(amount),
    label,      // e.g., "Demo Store"
    message,    // e.g., "Payment for Order #123"
    memo,       // On-chain memo
    reference,  // Unique reference for tracking
  })

  return url // Returns: solana:<recipient>?amount=<amount>&...
}

// Create QR code from URL
async function createPaymentQR(url: URL) {
  const qr = createQR(url, 512, 'transparent', 'black')
  const qrBlob = await qr.getRawData('png')
  return qrBlob
}

// Poll for payment completion
async function waitForPayment(
  connection: Connection,
  reference: PublicKey
): Promise<string> {
  const { signature } = await new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const signatureInfo = await findReference(connection, reference)
        clearInterval(interval)
        resolve(signatureInfo)
      } catch (error) {
        // Payment not found yet, continue polling
      }
    }, 1000)
  })
  return signature
}`,
      codeKo: `// TypeScript - @solana/pay, @solana/web3.js
import { encodeURL, createQR } from '@solana/pay'
import { PublicKey, Cluster } from '@solana/web3.js'
import BigNumber from 'bignumber.js'

// 결제 요청용 Solana Pay URL 생성
function generatePaymentRequest(
  recipientPubkey: PublicKey,
  amount: number,
  label?: string,
  message?: string,
  memo?: string,
  reference?: PublicKey[]
) {
  const url = encodeURL({
    recipient: recipientPubkey,
    amount: new BigNumber(amount),
    label,      // 예: "Demo Store"
    message,    // 예: "주문 #123 결제"
    memo,       // 온체인 메모
    reference,  // 추적용 고유 참조값
  })

  return url // 반환: solana:<recipient>?amount=<amount>&...
}

// URL로 QR 코드 생성
async function createPaymentQR(url: URL) {
  const qr = createQR(url, 512, 'transparent', 'black')
  const qrBlob = await qr.getRawData('png')
  return qrBlob
}

// 결제 완료 대기 (폴링)
async function waitForPayment(
  connection: Connection,
  reference: PublicKey
): Promise<string> {
  const { signature } = await new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const signatureInfo = await findReference(connection, reference)
        clearInterval(interval)
        resolve(signatureInfo)
      } catch (error) {
        // 결제가 아직 발견되지 않음, 폴링 계속
      }
    }, 1000)
  })
  return signature
}`,
      packages: [
        { name: '@solana/pay', url: 'https://www.npmjs.com/package/@solana/pay' }
      ]
    },
    {
      id: 'customer',
      label: 'Customer (TS)',
      labelKo: '고객 (TS)',
      code: `// TypeScript - @solana/pay, @solana/web3.js
import { parseURL, validateTransfer, TransferRequestURL } from '@solana/pay'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js'

// Parse Solana Pay URL from QR code
function parsePaymentRequest(url: string): TransferRequestURL {
  const parsed = parseURL(url)
  if (parsed.type !== 'transfer') {
    throw new Error('Invalid payment request')
  }
  return parsed
}

// Execute payment from parsed URL
async function executePayment(
  connection: Connection,
  payerKeypair: Keypair,
  paymentRequest: TransferRequestURL
) {
  const { recipient, amount, reference, memo } = paymentRequest

  // Create transfer instruction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payerKeypair.publicKey,
      toPubkey: recipient,
      lamports: amount ? Math.floor(amount.toNumber() * LAMPORTS_PER_SOL) : 0,
    })
  )

  // Add reference keys for merchant tracking
  if (reference) {
    for (const ref of reference) {
      transaction.keys.push({
        pubkey: ref,
        isSigner: false,
        isWritable: false,
      })
    }
  }

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = payerKeypair.publicKey
  transaction.sign(payerKeypair)

  const signature = await connection.sendRawTransaction(transaction.serialize())
  await connection.confirmTransaction(signature)

  return signature
}`,
      codeKo: `// TypeScript - @solana/pay, @solana/web3.js
import { parseURL, validateTransfer, TransferRequestURL } from '@solana/pay'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js'

// QR 코드에서 Solana Pay URL 파싱
function parsePaymentRequest(url: string): TransferRequestURL {
  const parsed = parseURL(url)
  if (parsed.type !== 'transfer') {
    throw new Error('잘못된 결제 요청입니다')
  }
  return parsed
}

// 파싱된 URL로 결제 실행
async function executePayment(
  connection: Connection,
  payerKeypair: Keypair,
  paymentRequest: TransferRequestURL
) {
  const { recipient, amount, reference, memo } = paymentRequest

  // 전송 명령어 생성
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payerKeypair.publicKey,
      toPubkey: recipient,
      lamports: amount ? Math.floor(amount.toNumber() * LAMPORTS_PER_SOL) : 0,
    })
  )

  // 판매자 추적용 참조 키 추가
  if (reference) {
    for (const ref of reference) {
      transaction.keys.push({
        pubkey: ref,
        isSigner: false,
        isWritable: false,
      })
    }
  }

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = payerKeypair.publicKey
  transaction.sign(payerKeypair)

  const signature = await connection.sendRawTransaction(transaction.serialize())
  await connection.confirmTransaction(signature)

  return signature
}`,
      packages: [
        { name: '@solana/pay', url: 'https://www.npmjs.com/package/@solana/pay' }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with Progress Steps */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: POS Device Selector */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground">{text.posType}:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPosType('tablet')}
              className={`p-1.5 rounded transition-colors ${
                posType === 'tablet' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <Tablet className="h-3 w-3" />
            </button>
            <button
              onClick={() => setPosType('traditional')}
              className={`p-1.5 rounded transition-colors ${
                posType === 'traditional' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <Monitor className="h-3 w-3" />
            </button>
          </div>
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

        {/* Right: Code Preview & Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <CodePreview tabs={codeTabs} />
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDemo}
            disabled={isRefreshing}
            className="text-xs h-7"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? text.resetting : text.resetDemo}
          </Button>
        </div>
      </div>

      {/* Devices Container */}
      <div className="relative flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 py-4">
        <SuccessAnimation show={step === 'completed'} />

        {/* Merchant POS */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{text.merchantSide}</span>
          <div className="relative">
            {posType === 'tablet' ? (
              /* Tablet Frame */
              <div className="relative bg-gray-900 rounded-[2rem] p-3 shadow-2xl">
                {/* Camera */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rounded-full" />
                {/* Screen */}
                <div className="w-64 h-80 sm:w-72 sm:h-96 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden">
                  <POSContent />
                </div>
              </div>
            ) : (
              /* Traditional POS Frame */
              <div className="relative">
                {/* Main POS Body */}
                <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-t-2xl rounded-b-lg p-3 shadow-2xl">
                  {/* Brand Strip */}
                  <div className="bg-gray-600 rounded-t-xl px-3 py-1 mb-2 flex items-center justify-between">
                    <span className="text-[10px] text-gray-300 font-mono">SOLANA POS</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </div>
                  </div>
                  {/* Screen */}
                  <div className="w-56 h-72 sm:w-64 sm:h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden border-4 border-gray-600">
                    <POSContent />
                  </div>
                  {/* Keypad Area */}
                  <div className="mt-2 grid grid-cols-4 gap-1 px-2">
                    {['1', '2', '3', '⌫', '4', '5', '6', 'C', '7', '8', '9', '0'].map((key) => (
                      <div
                        key={key}
                        className="bg-gray-600 hover:bg-gray-500 rounded h-5 flex items-center justify-center text-[10px] text-gray-300 font-mono cursor-default"
                      >
                        {key}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Card Reader Slot */}
                <div className="bg-gray-800 h-8 rounded-b-lg flex items-center justify-center">
                  <div className="w-24 h-1.5 bg-gray-600 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Flow Line */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-2 min-w-[100px]">
          {/* Connection Line */}
          <div className="relative flex items-center">
            {/* Line */}
            <motion.div
              className={`h-1 w-20 rounded-full transition-colors duration-300 ${
                step === 'input' ? 'bg-muted' :
                step === 'qr-generated' ? 'bg-primary/30' :
                step === 'scanning' ? 'bg-blue-500' :
                step === 'confirming' ? 'bg-amber-500' :
                step === 'processing' ? 'bg-purple-500' :
                step === 'completed' ? 'bg-green-500' : 'bg-muted'
              }`}
              animate={
                step === 'scanning' ? { opacity: [0.5, 1, 0.5] } :
                step === 'processing' ? { scaleX: [1, 1.1, 1] } :
                {}
              }
              transition={{ duration: 1, repeat: Infinity }}
            />

            {/* Animated pulse for active states */}
            {(step === 'scanning' || step === 'processing') && (
              <motion.div
                className={`absolute inset-0 rounded-full ${
                  step === 'scanning' ? 'bg-blue-400' : 'bg-purple-400'
                }`}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0, 0.5], scaleX: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>

          {/* Status Text */}
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-[10px] font-medium transition-colors ${
              step === 'input' ? 'text-muted-foreground' :
              step === 'qr-generated' ? 'text-primary/60' :
              step === 'scanning' ? 'text-blue-500' :
              step === 'confirming' ? 'text-amber-500' :
              step === 'processing' ? 'text-purple-500' :
              step === 'completed' ? 'text-green-500' : 'text-muted-foreground'
            }`}
          >
            {step === 'input' ? (language === 'ko' ? '대기' : 'Ready') :
             step === 'qr-generated' ? (language === 'ko' ? 'QR 생성' : 'QR Ready') :
             step === 'scanning' ? (language === 'ko' ? '스캔 중' : 'Scanning') :
             step === 'confirming' ? (language === 'ko' ? '확인 중' : 'Confirming') :
             step === 'processing' ? (language === 'ko' ? '처리 중' : 'Processing') :
             step === 'completed' ? (language === 'ko' ? '완료' : 'Complete') : ''}
          </motion.p>
        </div>

        {/* Mobile Phone - Customer Wallet */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{text.customerSide}</span>
          <motion.div
            animate={step === 'scanning' ? {
              x: [0, -30, 0],
              rotate: [0, -5, 0]
            } : {}}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="relative"
          >
            {/* Phone Frame */}
            <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
              {/* Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-gray-900 rounded-b-xl z-10" />
              {/* Screen */}
              <div className="w-48 h-96 sm:w-52 sm:h-[26rem] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-[2rem] overflow-hidden">
                <div className="h-full flex flex-col pt-8">
                  {/* Wallet App Header */}
                  <div className="bg-primary px-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-primary-foreground">Solana Wallet</p>
                      <WalletSelector
                        selectedWallet={customerWallet}
                        onSelect={setCustomerWalletId}
                        showDropdown={showCustomerDropdown}
                        setShowDropdown={setShowCustomerDropdown}
                      />
                    </div>
                  </div>

                  {/* Wallet Content */}
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    {(step === 'input' || step === 'qr-generated') && (
                      <div className="flex flex-col items-center gap-4 text-center">
                        {customerWallet ? (
                          <>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                              tokenType === 'usdc' ? 'bg-blue-600/10' : 'bg-primary/10'
                            }`}>
                              <Wallet className={`h-8 w-8 ${tokenType === 'usdc' ? 'text-blue-600' : 'text-primary'}`} />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{text.balance}</p>
                              <p className={`text-xl font-bold ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
                                {tokenType === 'usdc'
                                  ? (customerWallet.usdcBalance || 0).toFixed(4)
                                  : customerWallet.balance.toFixed(4)
                                }
                              </p>
                              <p className={`text-xs ${tokenType === 'usdc' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                                {tokenType === 'usdc' ? 'USDC' : 'SOL'}
                              </p>
                            </div>
                            {step === 'qr-generated' && (
                              <motion.div
                                animate={{ scale: [1, 1.03, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-full mt-2"
                              >
                                <Button
                                  onClick={simulateScan}
                                  size="sm"
                                  className={`w-full ring-2 ring-offset-2 ${
                                    tokenType === 'usdc' ? 'bg-blue-600 hover:bg-blue-700 ring-blue-500/50' : 'ring-primary/50'
                                  }`}
                                >
                                  <ScanIcon className="h-4 w-4 mr-2" />
                                  {text.simulateScan}
                                </Button>
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">{text.noWallet}</p>
                        )}
                      </div>
                    )}

                    {step === 'scanning' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <div className="relative">
                          <div className="w-32 h-32 border-2 border-primary rounded-xl flex items-center justify-center overflow-hidden">
                            <motion.div
                              animate={{ y: [-40, 40, -40] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="w-full h-0.5 bg-primary"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{text.scanning}</p>
                      </motion.div>
                    )}

                    {step === 'confirming' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{text.paymentRequest}</p>
                          <p className={`text-2xl font-bold text-center ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
                            {amount} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
                          </p>
                          <div className="text-[10px] text-muted-foreground space-y-0.5">
                            <p>{text.to}: {text.wallet} {merchantWallet?.name}</p>
                            <p>{text.fee}: ~0.000005 SOL</p>
                          </div>
                        </div>
                        {error && (
                          <p className="text-[10px] text-red-600 text-center">{error}</p>
                        )}
                        <motion.div
                          animate={{ scale: [1, 1.03, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Button
                            onClick={processPayment}
                            className={`w-full ring-2 ring-offset-2 ${
                              tokenType === 'usdc' ? 'bg-blue-600 hover:bg-blue-700 ring-blue-500/50' : 'ring-primary/50'
                            }`}
                            size="sm"
                            disabled={!customerWallet || !merchantWallet || (
                              tokenType === 'sol'
                                ? customerWallet.balance < parseFloat(amount) + MIN_BALANCE_FOR_RENT
                                : (customerWallet.usdcBalance || 0) < parseFloat(amount) || customerWallet.balance < MIN_BALANCE_FOR_RENT
                            )}
                          >
                            {text.confirmPayment}
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}

                    {step === 'processing' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm font-medium">{text.processing}</p>
                      </motion.div>
                    )}

                    {step === 'completed' && txSignature && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-3"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                            <Check className="h-6 w-6 text-green-600" />
                          </div>
                          <p className="text-sm font-medium text-green-600">{text.completed}</p>
                          <p className={`text-lg font-bold ${tokenType === 'usdc' ? 'text-blue-600' : ''}`}>
                            -{amount} {tokenType === 'usdc' ? 'USDC' : 'SOL'}
                          </p>
                          {customerWallet && (
                            <p className="text-[10px] text-muted-foreground">
                              {text.newBalance}: {tokenType === 'usdc'
                                ? `${(customerWallet.usdcBalance || 0).toFixed(4)} USDC`
                                : `${customerWallet.balance.toFixed(4)} SOL`
                              }
                            </p>
                          )}
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 space-y-1">
                          <p className="text-[9px] text-muted-foreground">{text.txHash}</p>
                          <p className="text-[8px] font-mono break-all">{txSignature.slice(0, 32)}...</p>
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
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Home Indicator */}
                  <div className="pb-2 flex justify-center">
                    <div className="w-24 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
