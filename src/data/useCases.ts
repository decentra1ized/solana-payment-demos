// Use case data structure
// Use cases will be added dynamically via commands

export interface IntegrationPoint {
  name: string
  nameKo: string
  url: string
}

export interface UseCase {
  id: string
  title: string
  titleKo: string
  description: string
  descriptionKo: string
  steps: string[]
  stepsKo: string[]
  integrationPoints?: IntegrationPoint[]
  assumptions?: string
  assumptionsKo?: string
  hasDemo?: boolean
}

export const useCasesData: UseCase[] = [
  {
    id: 'basic-payment',
    title: 'Basic SOL Payment',
    titleKo: '기본 SOL 전송',
    description: 'Direct peer-to-peer SOL transfer. Simple, fast, and low-cost transfers settling in under 1 second.',
    descriptionKo: '직접 P2P SOL 전송. 1초 미만의 빠르고 저렴한 전송.',
    steps: [
      'Select sender wallet with SOL balance',
      'Select recipient wallet address',
      'Enter amount to transfer',
      'Review and confirm transaction details',
      'Transaction is signed and sent to network',
      'Fast confirmation received'
    ],
    stepsKo: [
      'SOL 잔액이 있는 송금 지갑 선택',
      '수신 지갑 주소 선택',
      '전송할 금액 입력',
      '트랜잭션 상세 검토 및 확인',
      '트랜잭션 서명 및 네트워크 전송',
      '빠른 확인 수신'
    ],
    integrationPoints: [
      {
        name: 'Solana Docs: Basic Payment',
        nameKo: 'Solana 문서: 기본 결제',
        url: 'https://solana.com/docs/payments/send-payments/basic-payment'
      }
    ],
    assumptions: 'Sender has sufficient SOL balance for transfer amount plus network fee (~0.000005 SOL).',
    assumptionsKo: '송금자가 전송 금액 및 네트워크 수수료(~0.000005 SOL)를 충당할 충분한 SOL 잔액 보유.',
    hasDemo: true
  },
  {
    id: 'usdc-transfer',
    title: 'USDC Transfer',
    titleKo: 'USDC 전송',
    description: 'Transfer USDC stablecoins using SPL Token program. Automatic creation of recipient token account if needed.',
    descriptionKo: 'SPL 토큰 프로그램을 사용한 USDC 스테이블코인 전송. 필요시 수신자 토큰 계정 자동 생성.',
    steps: [
      'Select sender wallet with USDC balance',
      'Select recipient wallet address',
      'Enter USDC amount to transfer',
      'Check if recipient has token account (ATA)',
      'Create ATA if recipient does not have one',
      'Sign and send SPL token transfer',
      'Fast confirmation received'
    ],
    stepsKo: [
      'USDC 잔액이 있는 송금 지갑 선택',
      '수신 지갑 주소 선택',
      '전송할 USDC 금액 입력',
      '수신자 토큰 계정(ATA) 존재 여부 확인',
      'ATA가 없으면 자동 생성',
      'SPL 토큰 전송 서명 및 전송',
      '빠른 확인 수신'
    ],
    integrationPoints: [
      {
        name: 'Solana Docs: Transfer Tokens',
        nameKo: 'Solana 문서: 토큰 전송',
        url: 'https://solana.com/docs/tokens/basics/transfer-tokens'
      },
      {
        name: '@solana/spl-token',
        nameKo: '@solana/spl-token',
        url: 'https://www.npmjs.com/package/@solana/spl-token'
      }
    ],
    assumptions: 'Sender needs SOL for transaction fee (~0.000005 SOL) even when sending USDC. Recipient ATA is created automatically if not existing.',
    assumptionsKo: 'USDC 전송 시에도 트랜잭션 수수료용 SOL 필요(~0.000005 SOL). 수신자 ATA가 없으면 자동 생성.',
    hasDemo: true
  },
  {
    id: 'payment-with-memo',
    title: 'Payment with Memo',
    titleKo: '메모 포함 결제',
    description: 'Attach invoice numbers, order IDs, or custom references to payments. Memos are permanently recorded on-chain for easy reconciliation.',
    descriptionKo: '송장 번호, 주문 ID 또는 사용자 참조를 결제에 첨부합니다. 메모는 온체인에 영구 기록되어 쉬운 조회가 가능합니다.',
    steps: [
      'Create a transfer instruction with amount',
      'Create a memo instruction with reference text',
      'Combine both instructions in single transaction',
      'Sign and submit transaction to network',
      'Memo is recorded in transaction logs',
      'Verify memo through block explorer'
    ],
    stepsKo: [
      '금액이 포함된 전송 명령 생성',
      '참조 텍스트가 포함된 메모 명령 생성',
      '두 명령을 하나의 트랜잭션으로 결합',
      '트랜잭션 서명 및 네트워크 제출',
      '메모가 트랜잭션 로그에 기록됨',
      '블록 익스플로러를 통해 메모 확인'
    ],
    integrationPoints: [
      {
        name: 'Solana Docs: Payment with Memo',
        nameKo: 'Solana 문서: 메모 포함 결제',
        url: 'https://solana.com/docs/payments/send-payments/payment-with-memo'
      }
    ],
    assumptions: 'Memo text should be under 566 bytes. Useful for invoice tracking, order references, and audit trails.',
    assumptionsKo: '메모 텍스트는 566바이트 미만. 송장 추적, 주문 참조, 감사 추적에 유용.',
    hasDemo: true
  },
  {
    id: 'solana-pay-qr',
    title: 'Solana Pay QR Payment',
    titleKo: 'Solana Pay QR 결제',
    description: 'Simulate QR-based payment flow using Solana Pay protocol. Scan a QR code to complete instant transactions on Solana.',
    descriptionKo: 'Solana Pay 프로토콜을 사용한 QR 기반 결제 플로우 시뮬레이션. QR 코드를 스캔하여 Solana에서 즉시 거래를 완료합니다.',
    steps: [
      'Merchant generates payment QR code with amount',
      'Customer scans QR code with wallet',
      'Wallet parses Solana Pay URL and displays payment details',
      'Customer confirms and signs transaction',
      'Transaction settles quickly on Solana',
      'Both parties receive confirmation'
    ],
    stepsKo: [
      '판매자가 금액이 포함된 결제 QR 코드 생성',
      '고객이 지갑으로 QR 코드 스캔',
      '지갑이 Solana Pay URL을 파싱하고 결제 정보 표시',
      '고객이 확인 후 트랜잭션 서명',
      'Solana에서 빠르게 트랜잭션 정산',
      '양측 모두 확인 수신'
    ],
    integrationPoints: [
      {
        name: 'Solana Docs: Solana Pay',
        nameKo: 'Solana 문서: Solana Pay',
        url: 'https://solana.com/docs/advanced/actions'
      }
    ],
    assumptions: 'Customer has a Solana wallet with sufficient SOL balance.',
    assumptionsKo: '고객이 충분한 SOL 잔액이 있는 Solana 지갑을 보유.',
    hasDemo: true
  },
  {
    id: 'batch-payment',
    title: 'Batch Payment',
    titleKo: '일괄 결제',
    description: 'Send SOL to multiple recipients in a single atomic transaction. Save on fees and ensure all-or-nothing execution.',
    descriptionKo: '하나의 원자적 트랜잭션으로 여러 수신자에게 SOL 전송. 수수료 절감 및 전체 성공/실패 보장.',
    steps: [
      'Select sender wallet with sufficient balance',
      'Add multiple recipients with amounts',
      'Create transfer instructions for each recipient',
      'Combine all instructions into single transaction',
      'Sign and submit atomic transaction',
      'All transfers succeed or all fail together'
    ],
    stepsKo: [
      '충분한 잔액이 있는 송신자 지갑 선택',
      '여러 수신자와 금액 추가',
      '각 수신자에 대한 전송 명령 생성',
      '모든 명령을 하나의 트랜잭션으로 결합',
      '원자적 트랜잭션 서명 및 제출',
      '모든 전송이 함께 성공하거나 함께 실패'
    ],
    integrationPoints: [
      {
        name: 'Solana Docs: Batch Payments',
        nameKo: 'Solana 문서: 일괄 결제',
        url: 'https://solana.com/docs/payments/send-payments/payment-processing/batch-payments'
      }
    ],
    assumptions: 'Single transaction limit is ~1232 bytes. For large batches, use @solana/instruction-plans for automatic splitting.',
    assumptionsKo: '단일 트랜잭션 제한은 ~1232바이트. 대규모 배치의 경우 @solana/instruction-plans를 사용하여 자동 분할.',
    hasDemo: true
  },
  {
    id: 'fee-abstraction',
    title: 'Fee Abstraction',
    titleKo: '수수료 대납',
    description: 'Let a sponsor pay transaction fees on behalf of users. Users can transact without holding SOL for fees.',
    descriptionKo: '스폰서가 사용자 대신 트랜잭션 수수료를 지불합니다. 사용자는 수수료용 SOL 없이도 거래할 수 있습니다.',
    steps: [
      'User initiates a token transfer',
      'Sponsor wallet is designated as fee payer',
      'User signs for transfer authority',
      'Sponsor signs for fee payment',
      'Transaction submitted with dual signatures',
      'Sponsor pays fee, user sends tokens'
    ],
    stepsKo: [
      '사용자가 토큰 전송 시작',
      '스폰서 지갑이 수수료 지불자로 지정',
      '사용자가 전송 권한에 서명',
      '스폰서가 수수료 지불에 서명',
      '이중 서명으로 트랜잭션 제출',
      '스폰서가 수수료 지불, 사용자가 토큰 전송'
    ],
    integrationPoints: [
      {
        name: 'Solana Docs: Fee Abstraction',
        nameKo: 'Solana 문서: 수수료 대납',
        url: 'https://solana.com/docs/payments/send-payments/payment-processing/fee-abstraction'
      }
    ],
    assumptions: 'Sponsor must have SOL for fees. Both parties must sign the transaction. Useful for stablecoin-only UX.',
    assumptionsKo: '스폰서가 수수료용 SOL을 보유해야 함. 양 당사자가 트랜잭션에 서명해야 함. 스테이블코인 전용 UX에 유용.',
    hasDemo: true
  },
  {
    id: 'prepaid-card',
    title: 'Prepaid Card Top-up',
    titleKo: '선불 카드 충전',
    description: 'Deposit SOL/stablecoins to a card operator wallet to charge prepaid card balance. Use the card like a regular debit card.',
    descriptionKo: '카드 운영사 지갑에 SOL/스테이블코인을 충전하여 선불 카드 잔액을 충전합니다. 일반 체크카드처럼 사용할 수 있습니다.',
    steps: [
      'User selects deposit amount',
      'SOL transferred to card operator designated address',
      'Card operator verifies on-chain transaction',
      'Card balance credited in real-time',
      'Use card at any merchant (online/offline)'
    ],
    stepsKo: [
      '사용자가 충전 금액 선택',
      '카드 운영사 지정 주소로 SOL 전송',
      '카드 운영사가 온체인 트랜잭션 확인',
      '카드 잔액 실시간 반영',
      '어디서나 카드 사용 (온라인/오프라인)'
    ],
    integrationPoints: [
      {
        name: 'Solana Docs: Payments Overview',
        nameKo: 'Solana 문서: 결제 개요',
        url: 'https://solana.com/docs/payments'
      }
    ],
    assumptions: 'Card operator monitors deposit address and credits balance upon confirmation. Exchange rate applied by operator.',
    assumptionsKo: '카드 운영사가 충전 주소를 모니터링하고 확인 시 잔액 반영. 운영사가 환율 적용.',
    hasDemo: true
  }
]
