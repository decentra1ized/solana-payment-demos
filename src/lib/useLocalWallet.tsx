import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token'

// Devnet USDC mint address
export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
export const USDC_DECIMALS = 6

export interface LocalWallet {
  id: number
  name: string
  publicKey: string
  secretKey: string
  balance: number
  usdcBalance: number
}

interface LocalWalletContextType {
  wallets: LocalWallet[]
  selectedWalletId: number | null
  setSelectedWalletId: (id: number | null) => void
  addWallet: (wallet: Omit<LocalWallet, 'id' | 'name' | 'usdcBalance'>) => void
  updateBalance: (id: number, balance: number) => void
  updateUsdcBalance: (id: number, usdcBalance: number) => void
  canAddWallet: boolean
  getSelectedWallet: () => LocalWallet | null
  refreshAllBalances: () => Promise<void>
  isRefreshing: boolean
}

const LocalWalletContext = createContext<LocalWalletContextType | null>(null)

const MAX_WALLETS = 3
const STORAGE_KEY = 'solana_test_wallets'

const DEVNET_RPC = 'https://api.devnet.solana.com'

export function LocalWalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<LocalWallet[]>([])
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Helper function to get USDC balance
  const getUsdcBalance = async (connection: Connection, walletPubkey: PublicKey): Promise<number> => {
    try {
      const ata = await getAssociatedTokenAddress(USDC_MINT, walletPubkey)
      const account = await getAccount(connection, ata)
      return Number(account.amount) / Math.pow(10, USDC_DECIMALS)
    } catch {
      // Account doesn't exist or other error - return 0
      return 0
    }
  }

  // Refresh all wallet balances from blockchain
  const refreshAllBalances = useCallback(async (walletsToRefresh?: LocalWallet[]) => {
    const targetWallets = walletsToRefresh || wallets
    if (targetWallets.length === 0) return

    setIsRefreshing(true)
    try {
      const connection = new Connection(DEVNET_RPC, 'confirmed')
      const updatedWallets = await Promise.all(
        targetWallets.map(async (wallet) => {
          try {
            const pubkey = new PublicKey(wallet.publicKey)
            const [balance, usdcBalance] = await Promise.all([
              connection.getBalance(pubkey),
              getUsdcBalance(connection, pubkey)
            ])
            return {
              ...wallet,
              balance: balance / LAMPORTS_PER_SOL,
              usdcBalance
            }
          } catch (e) {
            console.error(`Failed to fetch balance for wallet ${wallet.id}:`, e)
            return wallet
          }
        })
      )
      setWallets(updatedWallets)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWallets))
    } catch (e) {
      console.error('Failed to refresh balances:', e)
    } finally {
      setIsRefreshing(false)
    }
  }, [wallets])

  // Load wallets from localStorage on mount and refresh balances
  useEffect(() => {
    const loadAndRefresh = async () => {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as LocalWallet[]
          // Ensure usdcBalance exists for older stored wallets
          const walletsWithUsdc = parsed.map(w => ({
            ...w,
            usdcBalance: w.usdcBalance ?? 0
          }))
          setWallets(walletsWithUsdc)
          if (walletsWithUsdc.length > 0) {
            setSelectedWalletId(walletsWithUsdc[0].id)
            // Immediately refresh balances from blockchain
            setIsRefreshing(true)
            try {
              const connection = new Connection(DEVNET_RPC, 'confirmed')
              const updatedWallets = await Promise.all(
                walletsWithUsdc.map(async (wallet) => {
                  try {
                    const pubkey = new PublicKey(wallet.publicKey)
                    const [balance, usdcBal] = await Promise.all([
                      connection.getBalance(pubkey),
                      getUsdcBalance(connection, pubkey)
                    ])
                    return {
                      ...wallet,
                      balance: balance / LAMPORTS_PER_SOL,
                      usdcBalance: usdcBal
                    }
                  } catch (e) {
                    console.error(`Failed to fetch balance for wallet ${wallet.id}:`, e)
                    return wallet
                  }
                })
              )
              setWallets(updatedWallets)
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWallets))
            } catch (e) {
              console.error('Failed to refresh balances:', e)
            } finally {
              setIsRefreshing(false)
            }
          }
        } catch (e) {
          console.error('Failed to parse stored wallets:', e)
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    }
    loadAndRefresh()
  }, [])

  const saveWallets = (newWallets: LocalWallet[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWallets))
  }

  const addWallet = (walletData: Omit<LocalWallet, 'id' | 'name' | 'usdcBalance'>) => {
    if (wallets.length >= MAX_WALLETS) return

    const newId = wallets.length + 1
    const newWallet: LocalWallet = {
      ...walletData,
      id: newId,
      name: `${newId}`,
      usdcBalance: 0,
    }
    const newWallets = [...wallets, newWallet]

    setWallets(newWallets)
    saveWallets(newWallets)

    // Auto-select the new wallet
    setSelectedWalletId(newId)
  }

  const updateBalance = (id: number, balance: number) => {
    const newWallets = wallets.map(w =>
      w.id === id ? { ...w, balance } : w
    )
    setWallets(newWallets)
    saveWallets(newWallets)
  }

  const updateUsdcBalance = (id: number, usdcBalance: number) => {
    const newWallets = wallets.map(w =>
      w.id === id ? { ...w, usdcBalance } : w
    )
    setWallets(newWallets)
    saveWallets(newWallets)
  }

  const canAddWallet = wallets.length < MAX_WALLETS

  const getSelectedWallet = () => {
    return wallets.find(w => w.id === selectedWalletId) || null
  }

  return (
    <LocalWalletContext.Provider value={{
      wallets,
      selectedWalletId,
      setSelectedWalletId,
      addWallet,
      updateBalance,
      updateUsdcBalance,
      canAddWallet,
      getSelectedWallet,
      refreshAllBalances: () => refreshAllBalances(),
      isRefreshing
    }}>
      {children}
    </LocalWalletContext.Provider>
  )
}

export function useLocalWallet() {
  const context = useContext(LocalWalletContext)
  if (!context) {
    throw new Error('useLocalWallet must be used within LocalWalletProvider')
  }
  return context
}
