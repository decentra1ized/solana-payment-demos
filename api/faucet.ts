import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
} from '@solana/spl-token'

const DEVNET_RPC = 'https://api.devnet.solana.com'
const FAUCET_SOL_AMOUNT = 0.01 // SOL to send
const FAUCET_USDC_AMOUNT = 0.05 // USDC to send

// Devnet USDC mint address
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
const USDC_DECIMALS = 6

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { recipientPublicKey, tokenType = 'sol' } = req.body

    if (!recipientPublicKey) {
      return res.status(400).json({ error: 'Missing recipientPublicKey' })
    }

    if (tokenType !== 'sol' && tokenType !== 'usdc') {
      return res.status(400).json({ error: 'Invalid tokenType. Must be "sol" or "usdc"' })
    }

    // Validate public key
    let recipientPubkey: PublicKey
    try {
      recipientPubkey = new PublicKey(recipientPublicKey)
    } catch {
      return res.status(400).json({ error: 'Invalid public key' })
    }

    // Get master wallet from environment variable
    const masterSecretKey = process.env.MASTER_WALLET_SECRET
    if (!masterSecretKey) {
      console.error('MASTER_WALLET_SECRET not configured')
      return res.status(500).json({ error: 'Faucet not configured' })
    }

    // Parse master wallet secret key
    let masterKeypair: Keypair
    try {
      const secretKeyArray = new Uint8Array(
        masterSecretKey.split(',').map((s) => parseInt(s.trim(), 10))
      )
      masterKeypair = Keypair.fromSecretKey(secretKeyArray)
    } catch {
      console.error('Failed to parse MASTER_WALLET_SECRET')
      return res.status(500).json({ error: 'Faucet configuration error' })
    }

    const connection = new Connection(DEVNET_RPC, 'confirmed')

    if (tokenType === 'sol') {
      // SOL Transfer
      const masterBalance = await connection.getBalance(masterKeypair.publicKey)
      const requiredLamports = FAUCET_SOL_AMOUNT * LAMPORTS_PER_SOL + 5000

      if (masterBalance < requiredLamports) {
        console.error(`Master wallet low SOL balance: ${masterBalance / LAMPORTS_PER_SOL} SOL`)
        return res.status(503).json({
          error: 'Faucet temporarily unavailable',
          message: 'Master wallet needs refill'
        })
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: masterKeypair.publicKey,
          toPubkey: recipientPubkey,
          lamports: Math.floor(FAUCET_SOL_AMOUNT * LAMPORTS_PER_SOL),
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = masterKeypair.publicKey
      transaction.sign(masterKeypair)

      const signature = await connection.sendRawTransaction(transaction.serialize())
      await connection.confirmTransaction(signature)

      return res.status(200).json({
        success: true,
        signature,
        amount: FAUCET_SOL_AMOUNT,
        tokenType: 'sol',
        recipient: recipientPublicKey,
      })
    } else {
      // USDC Transfer
      const masterAta = await getAssociatedTokenAddress(USDC_MINT, masterKeypair.publicKey)
      const recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey)

      // Check master USDC balance
      let masterUsdcBalance = 0
      try {
        const masterAccount = await getAccount(connection, masterAta)
        masterUsdcBalance = Number(masterAccount.amount) / Math.pow(10, USDC_DECIMALS)
      } catch {
        console.error('Master wallet has no USDC account')
        return res.status(503).json({
          error: 'Faucet temporarily unavailable',
          message: 'Master wallet needs USDC'
        })
      }

      if (masterUsdcBalance < FAUCET_USDC_AMOUNT) {
        console.error(`Master wallet low USDC balance: ${masterUsdcBalance} USDC`)
        return res.status(503).json({
          error: 'Faucet temporarily unavailable',
          message: 'Master wallet needs USDC refill'
        })
      }

      const transaction = new Transaction()

      // Check if recipient has ATA, if not create it
      try {
        await getAccount(connection, recipientAta)
      } catch {
        // ATA doesn't exist, create it
        transaction.add(
          createAssociatedTokenAccountInstruction(
            masterKeypair.publicKey, // payer
            recipientAta,            // ata
            recipientPubkey,         // owner
            USDC_MINT                // mint
          )
        )
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          masterAta,                                           // source
          recipientAta,                                        // destination
          masterKeypair.publicKey,                             // owner
          Math.floor(FAUCET_USDC_AMOUNT * Math.pow(10, USDC_DECIMALS)) // amount
        )
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = masterKeypair.publicKey
      transaction.sign(masterKeypair)

      const signature = await connection.sendRawTransaction(transaction.serialize())
      await connection.confirmTransaction(signature)

      return res.status(200).json({
        success: true,
        signature,
        amount: FAUCET_USDC_AMOUNT,
        tokenType: 'usdc',
        recipient: recipientPublicKey,
      })
    }
  } catch (error) {
    console.error('Faucet error:', error)
    return res.status(500).json({
      error: 'Transfer failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
