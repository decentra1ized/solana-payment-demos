export interface Adopter {
  id: string
  name: string
  logo: string
  description: string
  descriptionKo: string
  highlight: string
  highlightKo: string
  highlightValue: string
  status: 'live' | 'launching'
  officialUrl: string
}

export const adoptersData: Adopter[] = [
  {
    id: 'visa',
    name: 'Visa',
    logo: '/logos/visa.svg',
    description:
      'Through live pilots with issuers and acquirers, Visa has moved millions of USDC between its partners over Solana to settle fiat-denominated payments authorized over VisaNet.',
    descriptionKo:
      '발급사 및 가맹점과의 실제 파일럿을 통해 Visa는 VisaNet을 통해 승인된 법정화폐 결제를 정산하기 위해 Solana에서 파트너 간에 수백만 달러의 USDC를 이동했습니다.',
    highlight: 'Settled in USDC',
    highlightKo: 'USDC 정산액',
    highlightValue: 'Millions',
    status: 'live',
    officialUrl: 'https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.19881.html',
  },
  {
    id: 'worldpay',
    name: 'Worldpay',
    logo: '/logos/worldpay.svg',
    description:
      'Through an integration with the Solana network, merchants can now settle transactions with USDG – the U.S. Global Dollar – on the Solana network. The move offers fast, cost-efficient transactions and expands the usefulness of stablecoins in global payments.',
    descriptionKo:
      'Solana 네트워크와의 통합을 통해 가맹점은 이제 Solana 네트워크에서 USDG(미국 글로벌 달러)로 거래를 정산할 수 있습니다. 이를 통해 빠르고 비용 효율적인 거래가 가능하며 글로벌 결제에서 스테이블코인의 활용도가 확대됩니다.',
    highlight: 'Stablecoin issued',
    highlightKo: '발행 스테이블코인',
    highlightValue: 'USDG',
    status: 'live',
    officialUrl: 'https://www.worldpay.com/en/insights/articles/worldpay-solana-stablecoin-partnership',
  },
  {
    id: 'western-union',
    name: 'Western Union',
    logo: '/logos/western-union.svg',
    description:
      "Western Union is launching the U.S. Dollar Payment Token (USDPT), a dollar-backed stablecoin built on Solana, issued by Anchorage Digital Bank. The stablecoin will enable Western Union's 100 million customers to send money internationally with lower costs and faster settlement.",
    descriptionKo:
      'Western Union은 Anchorage Digital Bank가 발행하는 Solana 기반 달러 담보 스테이블코인인 U.S. Dollar Payment Token(USDPT)을 출시합니다. 이 스테이블코인을 통해 Western Union의 1억 명 고객이 더 낮은 비용과 빠른 정산으로 해외 송금을 할 수 있습니다.',
    highlight: 'Stablecoin launching',
    highlightKo: '출시 예정 스테이블코인',
    highlightValue: 'USDPT',
    status: 'launching',
    officialUrl: 'https://ir.westernunion.com/news/archived-press-releases/press-release-details/2025/Western-Union-Announces-USDPT-Stablecoin-on-Solana-and-Digital-Asset-Network/default.aspx',
  },
  {
    id: 'fiserv',
    name: 'Fiserv',
    logo: '/logos/fiserv.svg',
    description:
      'Fiserv launched FIUSD, a stablecoin designed for its institutional clients.',
    descriptionKo:
      'Fiserv는 기관 고객을 위해 설계된 스테이블코인 FIUSD를 출시했습니다.',
    highlight: 'Stablecoin issued',
    highlightKo: '발행 스테이블코인',
    highlightValue: 'FIUSD',
    status: 'live',
    officialUrl: 'https://www.fiserv.com/en/solutions/embedded-finance/fiusd-stablecoin.html',
  },
]
