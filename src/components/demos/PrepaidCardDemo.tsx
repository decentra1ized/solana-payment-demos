import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Loader2,
  Wallet,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  CreditCard,
  Building2,
  ShoppingBag,
  Coffee,
  ArrowRight,
  Zap,
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
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError
} from '@solana/spl-token'

type TokenType = 'sol' | 'usdc'
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
const USDC_DECIMALS = 6

type DemoStep = 'idle' | 'depositing' | 'processing' | 'charged' | 'spending' | 'spent'

// Minimum balance to keep in wallet (rent-exempt minimum + fee buffer)
const MIN_BALANCE_RESERVE = 0.001

// Destination wallet for card spend
const SPEND_DESTINATION = new PublicKey('CV1J4GMmgvnNrpJr3m87C8pGTm7xndJd9qdrT2mtMtaz')

export function PrepaidCardDemo() {
  const { language } = useLanguage()
  const { wallets, updateBalance } = useLocalWallet()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [depositAmount, setDepositAmount] = useState('0.001')
  const [tokenType, setTokenType] = useState<TokenType>('sol')
  const [usdcBalances, setUsdcBalances] = useState<Record<number, number>>({})
  const [cardBalance, setCardBalance] = useState(0) // Actual token amount deposited
  const [cardDollarBalance, setCardDollarBalance] = useState(0) // Dollar value for display
  const [spentAmount, setSpentAmount] = useState(0) // Dollar amount that was spent
  const [depositedTokenType, setDepositedTokenType] = useState<TokenType>('sol')
  const [step, setStep] = useState<DemoStep>('idle')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showInstDropdown, setShowInstDropdown] = useState(false)
  const [userWalletId, setUserWalletId] = useState<number | null>(null)
  const [institutionWalletId, setInstitutionWalletId] = useState<number | null>(null)

  const t = {
    en: {
      title: 'Prepaid Card Top-up',
      userWallet: 'User Wallet',
      institution: 'Card Operator',
      prepaidCard: 'Prepaid Card',
      depositAmount: 'Deposit Amount',
      depositAmountSol: 'Deposit Amount (SOL)',
      depositAmountUsdc: 'Deposit Amount (USDC)',
      deposit: 'Deposit to Card',
      processing: 'Processing...',
      charged: 'Card Charged!',
      cardBalance: 'Card Balance',
      useCard: 'Use Card',
      spending: 'Paying...',
      spent: 'Payment Complete!',
      tryAgain: 'Reset Demo',
      noWallet: 'Create wallet first',
      insufficientBalance: 'Insufficient balance (keep more than transfer amount)',
      selectWallet: 'Select Wallet',
      wallet: 'Wallet',
      balance: 'Balance',
      resetDemo: 'Reset',
      resetting: 'Resetting...',
      newBalance: 'New Balance',
      viewOnSolscan: 'View on Solscan',
      txHash: 'Transaction',
      institutionAddress: 'Deposit Address',
      flowDescription: 'Deposit → Card balance charged → Use anywhere',
      flowDescriptionSol: 'SOL deposit → Card balance charged → Use anywhere',
      flowDescriptionUsdc: 'USDC deposit → Card balance charged → Use anywhere',
      spendAt: 'Coffee Shop',
      spendAmount: '$0.01',
      realTx: 'Real transaction!',
      fee: 'Network Fee',
      steps: {
        idle: 'Ready',
        depositing: 'Deposit',
        processing: 'Process',
        charged: 'Charged',
        spending: 'Spending',
        spent: 'Done'
      }
    },
    ko: {
      title: '선불 카드 충전',
      userWallet: '사용자 지갑',
      institution: '카드 운영사',
      prepaidCard: '선불 카드',
      depositAmount: '충전 금액',
      depositAmountSol: '충전 금액 (SOL)',
      depositAmountUsdc: '충전 금액 (USDC)',
      deposit: '카드 충전',
      processing: '처리 중...',
      charged: '충전 완료!',
      cardBalance: '카드 잔액',
      useCard: '카드 사용',
      spending: '결제 중...',
      spent: '결제 완료!',
      tryAgain: '데모 리셋',
      noWallet: '지갑을 먼저 생성하세요',
      insufficientBalance: '잔액 부족 (송금액보다 여유있게 유지 필요)',
      selectWallet: '지갑 선택',
      wallet: '지갑',
      balance: '잔액',
      resetDemo: '초기화',
      resetting: '초기화 중...',
      newBalance: '새 잔액',
      viewOnSolscan: 'Solscan에서 보기',
      txHash: '트랜잭션',
      institutionAddress: '충전 주소',
      flowDescription: '충전 → 카드 잔액 반영 → 어디서나 사용',
      flowDescriptionSol: 'SOL 충전 → 카드 잔액 반영 → 어디서나 사용',
      flowDescriptionUsdc: 'USDC 충전 → 카드 잔액 반영 → 어디서나 사용',
      spendAt: '커피숍',
      spendAmount: '₩15',
      realTx: '실제 트랜잭션!',
      fee: '네트워크 수수료',
      steps: {
        idle: '대기',
        depositing: '충전',
        processing: '처리',
        charged: '완료',
        spending: '결제',
        spent: '완료'
      }
    }
  }

  const text = t[language]

  // Auto-select wallets
  useEffect(() => {
    if (wallets.length >= 1 && !userWalletId) {
      setUserWalletId(wallets[0].id)
    }
    if (wallets.length >= 2 && !institutionWalletId) {
      setInstitutionWalletId(wallets[1].id)
    } else if (wallets.length === 1 && !institutionWalletId) {
      setInstitutionWalletId(wallets[0].id)
    }
  }, [wallets])

  const userWallet = wallets.find(w => w.id === userWalletId)
  const institutionWallet = wallets.find(w => w.id === institutionWalletId)

  // Helper to get USDC balance
  const getUsdcBalanceFromChain = async (connection: Connection, walletPubkey: PublicKey): Promise<number> => {
    try {
      const ata = await getAssociatedTokenAddress(USDC_MINT, walletPubkey)
      const account = await getAccount(connection, ata)
      return Number(account.amount) / (10 ** USDC_DECIMALS)
    } catch (e) {
      if (e instanceof TokenAccountNotFoundError) {
        return 0
      }
      console.error('Failed to get USDC balance:', e)
      return 0
    }
  }

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (wallets.length === 0) return
    setIsRefreshing(true)
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const newUsdcBalances: Record<number, number> = {}
      for (const wallet of wallets) {
        try {
          const balance = await connection.getBalance(new PublicKey(wallet.publicKey))
          updateBalance(wallet.id, balance / LAMPORTS_PER_SOL)
          const usdcBalance = await getUsdcBalanceFromChain(connection, new PublicKey(wallet.publicKey))
          newUsdcBalances[wallet.id] = usdcBalance
        } catch (e) {
          console.error(`Failed to fetch balance:`, e)
        }
      }
      setUsdcBalances(newUsdcBalances)
    } finally {
      setIsRefreshing(false)
    }
  }, [wallets, updateBalance])

  useEffect(() => {
    if (wallets.length > 0) {
      refreshBalances()
    }
  }, [wallets.length])

  const handleDeposit = async () => {
    if (!userWallet || !institutionWallet) {
      setError(text.noWallet)
      return
    }

    const amount = parseFloat(depositAmount)

    // Balance check
    if (tokenType === 'sol') {
      if (userWallet.balance < amount + MIN_BALANCE_RESERVE) {
        setError(text.insufficientBalance)
        return
      }
    } else {
      const usdcBalance = usdcBalances[userWallet.id] || 0
      if (usdcBalance < amount) {
        setError(text.insufficientBalance)
        return
      }
    }

    setStep('depositing')
    setError(null)

    // Simulate deposit animation
    await new Promise(resolve => setTimeout(resolve, 1000))
    setStep('processing')

    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const secretKeyArray = new Uint8Array(
        userWallet.secretKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      )
      const payerKeypair = Keypair.fromSecretKey(secretKeyArray)
      const recipientPubkey = new PublicKey(institutionWallet.publicKey)

      const transaction = new Transaction()

      if (tokenType === 'sol') {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: payerKeypair.publicKey,
            toPubkey: recipientPubkey,
            lamports: Math.floor(amount * LAMPORTS_PER_SOL),
          })
        )
      } else {
        // USDC transfer
        const senderAta = await getAssociatedTokenAddress(USDC_MINT, payerKeypair.publicKey)
        const recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey)

        // Check if recipient ATA exists
        try {
          await getAccount(connection, recipientAta)
        } catch (e) {
          if (e instanceof TokenAccountNotFoundError) {
            transaction.add(
              createAssociatedTokenAccountInstruction(
                payerKeypair.publicKey,
                recipientAta,
                recipientPubkey,
                USDC_MINT
              )
            )
          }
        }

        transaction.add(
          createTransferInstruction(
            senderAta,
            recipientAta,
            payerKeypair.publicKey,
            Math.floor(amount * (10 ** USDC_DECIMALS))
          )
        )
      }

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = payerKeypair.publicKey
      transaction.sign(payerKeypair)

      const signature = await connection.sendRawTransaction(transaction.serialize())
      await connection.confirmTransaction(signature)

      // Update balances
      const userBalance = await connection.getBalance(payerKeypair.publicKey)
      const instBalance = await connection.getBalance(recipientPubkey)
      updateBalance(userWallet.id, userBalance / LAMPORTS_PER_SOL)
      updateBalance(institutionWallet.id, instBalance / LAMPORTS_PER_SOL)

      // Update USDC balances
      const userUsdcBalance = await getUsdcBalanceFromChain(connection, payerKeypair.publicKey)
      const instUsdcBalance = await getUsdcBalanceFromChain(connection, recipientPubkey)
      setUsdcBalances(prev => ({
        ...prev,
        [userWallet.id]: userUsdcBalance,
        [institutionWallet.id]: instUsdcBalance
      }))

      setTxSignature(signature)
      // Store actual token amount and dollar value
      setCardBalance(amount)
      setDepositedTokenType(tokenType)
      // Convert to dollar: SOL = $200, USDC = $1
      const dollarValue = tokenType === 'sol' ? amount * 200 : amount
      setCardDollarBalance(dollarValue)
      setStep('charged')
    } catch (err) {
      console.error('Deposit failed:', err)
      setError(err instanceof Error ? err.message : 'Deposit failed')
      setStep('idle')
    }
  }

  const handleSpend = async () => {
    if (!institutionWallet || cardBalance <= 0) return

    setStep('spending')
    setError(null)

    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const secretKeyArray = new Uint8Array(
        institutionWallet.secretKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      )
      const instKeypair = Keypair.fromSecretKey(secretKeyArray)

      const transaction = new Transaction()

      if (depositedTokenType === 'sol') {
        // Transfer SOL from institution to destination
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: instKeypair.publicKey,
            toPubkey: SPEND_DESTINATION,
            lamports: Math.floor(cardBalance * LAMPORTS_PER_SOL)
          })
        )
      } else {
        // Transfer USDC from institution to destination
        const instAta = await getAssociatedTokenAddress(USDC_MINT, instKeypair.publicKey)
        const destAta = await getAssociatedTokenAddress(USDC_MINT, SPEND_DESTINATION)

        // Check if destination ATA exists, create if needed
        try {
          await getAccount(connection, destAta)
        } catch {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              instKeypair.publicKey,
              destAta,
              SPEND_DESTINATION,
              USDC_MINT
            )
          )
        }

        transaction.add(
          createTransferInstruction(
            instAta,
            destAta,
            instKeypair.publicKey,
            Math.floor(cardBalance * (10 ** USDC_DECIMALS))
          )
        )
      }

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = instKeypair.publicKey
      transaction.sign(instKeypair)

      const signature = await connection.sendRawTransaction(transaction.serialize())
      await connection.confirmTransaction(signature)

      // Update institution balance
      const instBalance = await connection.getBalance(instKeypair.publicKey)
      updateBalance(institutionWallet.id, instBalance / LAMPORTS_PER_SOL)

      if (depositedTokenType === 'usdc') {
        const instUsdcBalance = await getUsdcBalanceFromChain(connection, instKeypair.publicKey)
        setUsdcBalances(prev => ({
          ...prev,
          [institutionWallet.id]: instUsdcBalance
        }))
      }

      setSpentAmount(cardDollarBalance) // Store dollar amount spent
      setCardBalance(0)
      setCardDollarBalance(0)
      setStep('spent')
    } catch (err) {
      console.error('Spend failed:', err)
      setError(err instanceof Error ? err.message : 'Spend failed')
      setStep('charged')
    }
  }

  const reset = () => {
    setStep('idle')
    setDepositAmount(tokenType === 'sol' ? '0.001' : '0.01')
    setCardBalance(0)
    setCardDollarBalance(0)
    setSpentAmount(0)
    setTxSignature(null)
    setError(null)
  }

  const resetDemo = async () => {
    reset()
    await refreshBalances()
  }

  const WalletSelector = ({ selectedWallet, onSelect, showDropdown, setShowDropdown }: {
    selectedWallet: LocalWallet | undefined
    onSelect: (id: number) => void
    showDropdown: boolean
    setShowDropdown: (show: boolean) => void
  }) => (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1 px-2 py-0.5 rounded bg-background/50 hover:bg-background/80 transition-colors text-[10px]"
      >
        <Wallet className="h-2.5 w-2.5" />
        <span>{selectedWallet ? `${text.wallet} ${selectedWallet.name}` : text.selectWallet}</span>
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {showDropdown && (
        <div className="absolute top-full right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 min-w-[80px]">
          {wallets.map(w => (
            <button
              key={w.id}
              onClick={() => { onSelect(w.id); setShowDropdown(false) }}
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

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">{text.noWallet}</p>
      </div>
    )
  }

  const stepOrder: DemoStep[] = ['idle', 'depositing', 'processing', 'charged', 'spending', 'spent']
  const currentStepIndex = stepOrder.indexOf(step)

  const codeTabs = [
    {
      id: 'deposit',
      label: 'Deposit (TS)',
      labelKo: '충전 (TS)',
      code: `// User deposits SOL to card issuer's address
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function depositToCard(
  connection: Connection,
  userKeypair: Keypair,
  cardIssuerAddress: PublicKey,
  amountSOL: number
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: userKeypair.publicKey,
      toPubkey: cardIssuerAddress,
      lamports: amountSOL * LAMPORTS_PER_SOL,
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = userKeypair.publicKey;
  transaction.sign(userKeypair);

  const signature = await connection.sendRawTransaction(
    transaction.serialize()
  );
  await connection.confirmTransaction(signature);

  // Card issuer monitors this address and credits
  // the user's card balance upon confirmation
  return signature;
}`,
      codeKo: `// 사용자가 카드 운영사 주소로 SOL 충전
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function depositToCard(
  connection: Connection,
  userKeypair: Keypair,
  cardIssuerAddress: PublicKey,
  amountSOL: number
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: userKeypair.publicKey,
      toPubkey: cardIssuerAddress,
      lamports: amountSOL * LAMPORTS_PER_SOL,
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = userKeypair.publicKey;
  transaction.sign(userKeypair);

  const signature = await connection.sendRawTransaction(
    transaction.serialize()
  );
  await connection.confirmTransaction(signature);

  // 카드 운영사가 이 주소를 모니터링하고
  // 확인 시 사용자 카드 잔액에 반영
  return signature;
}`,
      packages: [
        { name: '@solana/web3.js', url: 'https://www.npmjs.com/package/@solana/web3.js' }
      ]
    },
    {
      id: 'monitor',
      label: 'Monitor (TS)',
      labelKo: '모니터링 (TS)',
      code: `// Card operator monitors deposit address for incoming transfers
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Method 1: WebSocket subscription for real-time updates
async function watchDeposits(
  connection: Connection,
  depositAddress: PublicKey,
  onDeposit: (amount: number, signature: string, sender: string) => void
) {
  // Subscribe to account changes
  const subscriptionId = connection.onAccountChange(
    depositAddress,
    async (accountInfo, context) => {
      // Get recent signatures to find the deposit transaction
      const signatures = await connection.getSignaturesForAddress(
        depositAddress,
        { limit: 1 }
      );

      if (signatures.length > 0) {
        const tx = await connection.getParsedTransaction(
          signatures[0].signature,
          { maxSupportedTransactionVersion: 0 }
        );

        if (tx?.meta?.preBalances && tx?.meta?.postBalances) {
          const depositAmount = (tx.meta.postBalances[1] - tx.meta.preBalances[1]) / LAMPORTS_PER_SOL;
          const sender = tx.transaction.message.accountKeys[0].pubkey.toString();

          if (depositAmount > 0) {
            onDeposit(depositAmount, signatures[0].signature, sender);
          }
        }
      }
    },
    'confirmed'
  );

  return subscriptionId; // Call connection.removeAccountChangeListener(id) to stop
}

// Method 2: Polling for transaction history
async function pollDeposits(
  connection: Connection,
  depositAddress: PublicKey,
  lastSignature?: string
) {
  const signatures = await connection.getSignaturesForAddress(
    depositAddress,
    { until: lastSignature, limit: 10 }
  );

  const deposits = [];
  for (const sig of signatures) {
    const tx = await connection.getParsedTransaction(sig.signature, {
      maxSupportedTransactionVersion: 0
    });
    // Parse and validate each transaction...
    deposits.push({ signature: sig.signature, tx });
  }

  return deposits;
}`,
      codeKo: `// 카드 운영사가 충전 주소로 들어오는 입금을 모니터링
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// 방법 1: 실시간 업데이트를 위한 WebSocket 구독
async function watchDeposits(
  connection: Connection,
  depositAddress: PublicKey,
  onDeposit: (amount: number, signature: string, sender: string) => void
) {
  // 계정 변경 구독
  const subscriptionId = connection.onAccountChange(
    depositAddress,
    async (accountInfo, context) => {
      // 최근 서명을 조회하여 입금 트랜잭션 찾기
      const signatures = await connection.getSignaturesForAddress(
        depositAddress,
        { limit: 1 }
      );

      if (signatures.length > 0) {
        const tx = await connection.getParsedTransaction(
          signatures[0].signature,
          { maxSupportedTransactionVersion: 0 }
        );

        if (tx?.meta?.preBalances && tx?.meta?.postBalances) {
          const depositAmount = (tx.meta.postBalances[1] - tx.meta.preBalances[1]) / LAMPORTS_PER_SOL;
          const sender = tx.transaction.message.accountKeys[0].pubkey.toString();

          if (depositAmount > 0) {
            onDeposit(depositAmount, signatures[0].signature, sender);
          }
        }
      }
    },
    'confirmed'
  );

  return subscriptionId; // 중지하려면 connection.removeAccountChangeListener(id) 호출
}

// 방법 2: 트랜잭션 히스토리 폴링
async function pollDeposits(
  connection: Connection,
  depositAddress: PublicKey,
  lastSignature?: string
) {
  const signatures = await connection.getSignaturesForAddress(
    depositAddress,
    { until: lastSignature, limit: 10 }
  );

  const deposits = [];
  for (const sig of signatures) {
    const tx = await connection.getParsedTransaction(sig.signature, {
      maxSupportedTransactionVersion: 0
    });
    // 각 트랜잭션 파싱 및 검증...
    deposits.push({ signature: sig.signature, tx });
  }

  return deposits;
}`,
      packages: [
        { name: '@solana/web3.js', url: 'https://www.npmjs.com/package/@solana/web3.js' }
      ]
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header - all on one line: description - steps - buttons */}
      <div className="flex items-center gap-2 justify-between">
        {/* Left: Flow description */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="whitespace-nowrap">{tokenType === 'sol' ? text.flowDescriptionSol : text.flowDescriptionUsdc}</span>
        </div>

        {/* Center: Progress Steps */}
        <div className="flex items-center gap-1 text-xs">
          {stepOrder.slice(0, 4).map((s, index) => (
            <div key={s} className="flex items-center shrink-0">
              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-colors text-[10px] ${
                index <= Math.min(currentStepIndex, 3)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <span className="font-medium">{index + 1}</span>
                <span className="hidden sm:inline">{text.steps[s]}</span>
              </div>
              {index < 3 && (
                <ArrowRight className="h-3 w-3 mx-0.5 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Right: Code + Reset */}
        <div className="flex items-center gap-1 shrink-0">
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

      {/* Three-way visualization */}
      <div className="relative flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 py-4">
        <SuccessAnimation show={step === 'charged' || step === 'spent'} />

        {/* User Phone */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{text.userWallet}</span>
          <div className="relative bg-gray-900 rounded-[2rem] p-2 shadow-xl">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-gray-900 rounded-b-xl z-10" />
            <div className="w-40 h-72 bg-gradient-to-br from-gray-100 to-gray-200 rounded-[1.5rem] overflow-hidden">
              <div className="h-full flex flex-col pt-6">
                <div className="bg-primary px-2 py-1.5 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-primary-foreground">Solana Wallet</span>
                  <WalletSelector
                    selectedWallet={userWallet}
                    onSelect={setUserWalletId}
                    showDropdown={showUserDropdown}
                    setShowDropdown={setShowUserDropdown}
                  />
                </div>
                <div className="flex-1 p-3 flex flex-col justify-center items-center gap-3">
                  {userWallet && (
                    <>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">{text.balance}</p>
                        {tokenType === 'sol' ? (
                          <p className="text-lg font-bold">{userWallet.balance.toFixed(4)} SOL</p>
                        ) : (
                          <p className="text-lg font-bold text-blue-600">{(usdcBalances[userWallet.id] || 0).toFixed(2)} USDC</p>
                        )}
                      </div>
                      {step === 'idle' && (
                        <div className="w-full space-y-2">
                          {/* Token toggle */}
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => { setTokenType('sol'); setDepositAmount('0.001'); }}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] transition-colors ${
                                tokenType === 'sol'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              <Coins className="h-2.5 w-2.5" />
                              SOL
                            </button>
                            <button
                              onClick={() => { setTokenType('usdc'); setDepositAmount('0.01'); }}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] transition-colors ${
                                tokenType === 'usdc'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              <DollarSign className="h-2.5 w-2.5" />
                              USDC
                            </button>
                          </div>
                          <div>
                            <Label className="text-[9px]">
                              {tokenType === 'sol' ? text.depositAmountSol : text.depositAmountUsdc}
                            </Label>
                            <Input
                              type="number"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              step={tokenType === 'sol' ? '0.001' : '0.00001'}
                              min={tokenType === 'sol' ? '0.001' : '0.00001'}
                              className="h-7 text-xs text-center"
                            />
                            <p className="text-[8px] text-muted-foreground text-center mt-0.5">
                              {text.fee}: ~0.000005 SOL
                            </p>
                          </div>
                          <Button
                            onClick={handleDeposit}
                            size="sm"
                            className={`w-full h-7 text-[10px] ${tokenType === 'usdc' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                            disabled={!userWallet || !institutionWallet}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            {text.deposit}
                          </Button>
                        </div>
                      )}
                      {(step === 'depositing' || step === 'processing') && (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <p className="text-[10px]">{text.processing}</p>
                        </div>
                      )}
                      {(step === 'charged' || step === 'spending' || step === 'spent') && (
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">{text.newBalance}</p>
                          {tokenType === 'sol' ? (
                            <>
                              <p className="text-sm font-bold">{userWallet.balance.toFixed(4)} SOL</p>
                              <p className="text-[9px] text-green-600">-{depositAmount} SOL</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-bold text-blue-600">{(usdcBalances[userWallet.id] || 0).toFixed(2)} USDC</p>
                              <p className="text-[9px] text-blue-600">-{depositAmount} USDC</p>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {error && <p className="text-[10px] text-red-500 break-words whitespace-normal leading-tight">{error}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow to Institution */}
        <div className="flex flex-col items-center gap-1">
          <ArrowRight className={`h-6 w-6 transition-colors ${
            step === 'depositing' || step === 'processing' ? (tokenType === 'usdc' ? 'text-blue-500' : 'text-primary') :
            currentStepIndex >= 3 ? 'text-green-500' : 'text-muted-foreground'
          }`} />
          <span className={`text-[9px] ${tokenType === 'usdc' ? 'text-blue-500' : 'text-muted-foreground'}`}>
            {tokenType === 'sol' ? 'SOL' : 'USDC'}
          </span>
        </div>

        {/* Institution Server */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{text.institution}</span>
          <div className="relative">
            <div className="w-32 h-44 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg shadow-xl flex flex-col items-center justify-center p-3 gap-2">
              <Building2 className="h-7 w-7 text-slate-300" />
              <div className="text-center flex flex-col items-center">
                <p className="text-[9px] text-slate-400 mb-1">{text.institutionAddress}</p>
                <div className="relative">
                  <button
                    onClick={() => setShowInstDropdown(!showInstDropdown)}
                    className="flex items-center justify-center gap-1 px-2 py-0.5 rounded bg-slate-600 hover:bg-slate-500 transition-colors text-[9px] text-slate-200"
                  >
                    <Wallet className="h-2.5 w-2.5" />
                    <span>{institutionWallet ? `${text.wallet} ${institutionWallet.name}` : text.selectWallet}</span>
                    <ChevronDown className="h-2.5 w-2.5" />
                  </button>
                  {showInstDropdown && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-background border rounded-lg shadow-lg z-50 min-w-[80px]">
                      {wallets.map(w => (
                        <button
                          key={w.id}
                          onClick={() => { setInstitutionWalletId(w.id); setShowInstDropdown(false) }}
                          className={`w-full text-center px-3 py-1.5 text-[9px] hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                            w.id === institutionWallet?.id ? 'bg-primary/10' : ''
                          }`}
                        >
                          {text.wallet} {w.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[7px] font-mono text-slate-400 truncate w-24 mt-1">
                  {institutionWallet?.publicKey.slice(0, 8)}...
                </p>
              </div>
              {step === 'processing' && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1 bg-primary rounded-full p-1"
                >
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                </motion.div>
              )}
              {currentStepIndex >= 3 && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          </div>
          {/* Real TX badge - in normal flow for better centering */}
          {txSignature && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="bg-violet-600 text-white text-[9px] font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-lg relative">
                {language === 'ko' ? '실제 트랜잭션 확인 가능!' : 'View real transaction!'}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-violet-600 rotate-45" />
              </div>
              <a
                href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[9px] text-primary hover:underline bg-primary/10 px-2 py-1 rounded-full mt-1"
              >
                <span>✨ {text.realTx}</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </motion.div>
          )}
        </div>

        {/* Arrow to Card */}
        <div className="flex flex-col items-center gap-1">
          <ArrowRight className={`h-6 w-6 transition-colors ${
            step === 'processing' ? 'text-primary' :
            currentStepIndex >= 3 ? 'text-green-500' : 'text-muted-foreground'
          }`} />
          <span className="text-[9px] text-muted-foreground">Credit</span>
        </div>

        {/* Prepaid Card */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{text.prepaidCard}</span>
          <motion.div
            animate={step === 'charged' ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Card Design */}
            <div className="w-52 h-32 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-xl shadow-xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-10 h-7 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded" />
                <span className="text-[10px] text-white/80 font-medium">PREPAID</span>
              </div>
              <div>
                <p className="text-[10px] text-white/60">{text.cardBalance}</p>
                <p className="text-2xl font-bold text-white">
                  ${cardDollarBalance.toFixed(2)} <span className="text-sm">USD</span>
                </p>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-[10px] text-white/80 font-mono">•••• •••• •••• 4242</p>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-red-500 rounded-full opacity-80" />
                  <div className="w-4 h-4 bg-yellow-500 rounded-full opacity-80 -ml-2" />
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <AnimatePresence>
              {step === 'charged' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-1 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-xs font-medium">{text.charged}</span>
                  </div>
                  <Button onClick={handleSpend} size="sm" variant="outline" className="h-7 text-[10px]">
                    <Coffee className="h-3 w-3 mr-1" />
                    {text.useCard} @ {text.spendAt}
                  </Button>
                </motion.div>
              )}
              {step === 'spending' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 flex flex-col items-center gap-2"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-[10px]">{text.spending}</span>
                </motion.div>
              )}
              {step === 'spent' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg">
                    <ShoppingBag className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-[10px] font-medium text-green-700">{text.spent}</p>
                      <p className="text-[9px] text-green-600">
                        {text.spendAt} - ${spentAmount.toFixed(2)} USD
                      </p>
                    </div>
                  </div>
                  <Button onClick={reset} size="sm" variant="ghost" className="h-6 text-[10px]">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {text.tryAgain}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
