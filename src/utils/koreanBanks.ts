/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KoreanBankPreset {
  id: string;
  name: string;
  koreanName: string;
  code: string;
  color: string;
  textColor: string;
  badge: string;
  bgLight: string;
  defaultType: 'checking' | 'savings' | 'credit' | 'cash';
  description: string;
}

export const KOREAN_BANKS: KoreanBankPreset[] = [
  {
    id: 'shinhan',
    name: 'Shinhan Bank',
    koreanName: '신한은행',
    code: 'SHINHAN',
    color: '#0046FF',
    textColor: '#FFFFFF',
    badge: '신한',
    bgLight: '#EFF4FF',
    defaultType: 'checking',
    description: 'Shinhan Main Checking & Debit',
  },
  {
    id: 'kakao',
    name: 'KakaoBank',
    koreanName: '카카오뱅크',
    code: 'KAKAO',
    color: '#FEE500',
    textColor: '#191919',
    badge: '카카오',
    bgLight: '#FFFDE7',
    defaultType: 'checking',
    description: 'KakaoBank Mobile Safe Vault',
  },
  {
    id: 'toss',
    name: 'Toss Bank',
    koreanName: '토스뱅크',
    code: 'TOSS',
    color: '#0064FF',
    textColor: '#FFFFFF',
    badge: '토스',
    bgLight: '#EFF6FF',
    defaultType: 'checking',
    description: 'Toss High-Yield Daily Account',
  },
  {
    id: 'kb',
    name: 'KB Kookmin Bank',
    koreanName: 'KB국민은행',
    code: 'KB',
    color: '#FFBC00',
    textColor: '#3A2800',
    badge: '국민',
    bgLight: '#FFFBEB',
    defaultType: 'checking',
    description: 'KB Star Campus Account',
  },
  {
    id: 'woori',
    name: 'Woori Bank',
    koreanName: '우리은행',
    code: 'WOORI',
    color: '#0073B7',
    textColor: '#FFFFFF',
    badge: '우리',
    bgLight: '#F0F9FF',
    defaultType: 'checking',
    description: 'Woori WON Global Banking',
  },
  {
    id: 'hana',
    name: 'Hana Bank',
    koreanName: '하나은행',
    code: 'HANA',
    color: '#008485',
    textColor: '#FFFFFF',
    badge: '하나',
    bgLight: '#F0FDFA',
    defaultType: 'checking',
    description: 'Hana 1Q Student Account',
  },
  {
    id: 'nh',
    name: 'NH Nonghyup',
    koreanName: 'NH농협은행',
    code: 'NH',
    color: '#00A344',
    textColor: '#FFFFFF',
    badge: '농협',
    bgLight: '#F0FDF4',
    defaultType: 'savings',
    description: 'NH All-One Savings Deposit',
  },
  {
    id: 'ibk',
    name: 'IBK Industrial Bank',
    koreanName: 'IBK기업은행',
    code: 'IBK',
    color: '#0050A1',
    textColor: '#FFFFFF',
    badge: '기업',
    bgLight: '#EFF6FF',
    defaultType: 'checking',
    description: 'IBK Smart Direct Account',
  },
  {
    id: 'cash',
    name: 'Cash in Wallet',
    koreanName: '현금 지갑',
    code: 'CASH',
    color: '#58CC02',
    textColor: '#FFFFFF',
    badge: '현금',
    bgLight: '#F2FCE2',
    defaultType: 'cash',
    description: 'Physical Korean Won Cash (지갑)',
  },
  {
    id: 'global',
    name: 'Global Pocket (USD/EUR)',
    koreanName: '글로벌 외화',
    code: 'GLOBAL',
    color: '#9333EA',
    textColor: '#FFFFFF',
    badge: '외화',
    bgLight: '#FAF5FF',
    defaultType: 'checking',
    description: 'Revolut / Multi-Currency Travel Pocket',
  },
];

export function findBankPreset(institutionOrName: string): KoreanBankPreset {
  const query = institutionOrName.toLowerCase();
  if (query.includes('shinhan') || query.includes('신한')) return KOREAN_BANKS[0];
  if (query.includes('kakao') || query.includes('카카오')) return KOREAN_BANKS[1];
  if (query.includes('toss') || query.includes('토스')) return KOREAN_BANKS[2];
  if (query.includes('kb') || query.includes('kookmin') || query.includes('국민')) return KOREAN_BANKS[3];
  if (query.includes('woori') || query.includes('우리')) return KOREAN_BANKS[4];
  if (query.includes('hana') || query.includes('하나')) return KOREAN_BANKS[5];
  if (query.includes('nh') || query.includes('nonghyup') || query.includes('농협')) return KOREAN_BANKS[6];
  if (query.includes('ibk') || query.includes('기업')) return KOREAN_BANKS[7];
  if (query.includes('cash') || query.includes('현금') || query.includes('wallet') || query.includes('지갑')) return KOREAN_BANKS[8];
  if (query.includes('global') || query.includes('revolut') || query.includes('외화')) return KOREAN_BANKS[9];

  // Default fallback preset
  return {
    id: 'custom',
    name: institutionOrName || 'Bank Account',
    koreanName: '은행 계좌',
    code: 'BANK',
    color: '#0064FF',
    textColor: '#FFFFFF',
    badge: (institutionOrName.slice(0, 2) || '은행').toUpperCase(),
    bgLight: '#EFF6FF',
    defaultType: 'checking',
    description: 'Linked Bank Account',
  };
}
