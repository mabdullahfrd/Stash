/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, TransactionType } from '../types/finance';

export interface AutoCategoryMatch {
  categoryId: string;
  categoryName: string;
  matchedKeyword: string;
  isCharity: boolean;
}

interface CategoryRule {
  categoryId: string;
  type: TransactionType;
  keywords: string[];
  isCharity?: boolean;
}

// Ordered by specificity: charity, subscriptions, health, coffee/treats, groceries, dining, bills, shopping, study, transit
const AUTO_CATEGORY_RULES: CategoryRule[] = [
  {
    categoryId: 'cat-charity',
    type: 'expense',
    isCharity: true,
    keywords: [
      'charity',
      'zakat',
      'sadaqah',
      'donation',
      'donate',
      'tithe',
      'relief',
      'mosque',
      'masjid',
      'orphan',
      'alms',
      'food aid',
      '기부',
      '자선',
      '자카트',
      '후원',
    ],
  },
  {
    categoryId: 'cat-subscriptions',
    type: 'expense',
    keywords: [
      'apple music',
      'spotify',
      'youtube premium',
      'netflix',
      'disney+',
      'icloud',
      'google one',
      'chatgpt',
      'notion',
      'coupang wow',
      'naver plus',
      'subscription',
      'membership',
      'streaming',
      '멜론',
      '지니뮤직',
      '넷플릭스',
      '유튜브 프리미엄',
      '정기결제',
      '구독',
      '멤버십',
    ],
  },
  {
    categoryId: 'cat-health',
    type: 'expense',
    keywords: [
      'pharmacy',
      'clinic',
      'hospital',
      'dentist',
      'doctor',
      'medicine',
      'vitamin',
      'gym',
      'fitness',
      'pilates',
      'olive young',
      '약국',
      '병원',
      '치과',
      '내과',
      '의원',
      '헬스장',
      '올리브영',
    ],
  },
  {
    categoryId: 'cat-icecream',
    type: 'expense',
    keywords: [
      'ice cream',
      'icecream',
      'baskin',
      'haagen',
      'gelato',
      'bingsu',
      'dessert',
      'cake',
      'macaron',
      'cookie',
      'chocolate',
      'chocolate bar',
      'candy',
      'snack',
      'chips',
      'waffle',
      'croffle',
      'tiramisu',
      'churros',
      'donut',
      'doughnut',
      'treat',
      '배스킨',
      '베라',
      '아이스크림',
      '메로나',
      '마카롱',
      '케이크',
      '디저트',
      '과자',
      '초콜릿',
      '빙수',
    ],
  },
  {
    categoryId: 'cat-coffee',
    type: 'expense',
    keywords: [
      'coffee',
      'latte',
      'americano',
      'espresso',
      'cappuccino',
      'macchiato',
      'mocha',
      'tea',
      'matcha',
      'boba',
      'bubble tea',
      'smoothie',
      'juice',
      'soda',
      'cola',
      'coke',
      'sprite',
      'energy drink',
      'red bull',
      'monster',
      'drink',
      'beverage',
      'cafe',
      'mega coffee',
      'compose',
      'paiks',
      'starbucks',
      'twosome',
      'ediya',
      'hollys',
      'paul bassett',
      '메가커피',
      '컴포즈',
      '빽다방',
      '스타벅스',
      '스벅',
      '이디야',
      '투썸',
      '커피',
      '라떼',
      '아메리카노',
      '음료',
      '카페',
    ],
  },
  {
    categoryId: 'cat-dining',
    type: 'expense',
    keywords: [
      'lunch',
      'dinner',
      'breakfast',
      'meal',
      'restaurant',
      'burger',
      'pizza',
      'fried chicken',
      'chicken',
      'kimbap',
      'gimbap',
      'tteokbokki',
      'bibimbap',
      'bulgogi',
      'samgyeopsal',
      'ramyeon',
      'udon',
      'sushi',
      'pasta',
      'sandwich',
      'salad',
      'steak',
      'taco',
      'curry',
      'kebab',
      'halal',
      'mcdonald',
      'kfc',
      'lotteria',
      'moms touch',
      'baemin',
      'yogiyo',
      'coupang eats',
      'takeout',
      'delivery',
      'cafeteria',
      '밥',
      '점심',
      '저녁',
      '식사',
      '배달',
      '배민',
      '김밥',
      '떡볶이',
      '비빔밥',
      '치킨',
      '피자',
      '버거',
      '식당',
      '학식',
    ],
  },
  {
    categoryId: 'cat-groceries',
    type: 'expense',
    keywords: [
      'egg',
      'eggs',
      'bread',
      'milk',
      'butter',
      'cheese',
      'yogurt',
      'rice',
      'ramen',
      'ramyun',
      'noodle',
      'apple',
      'banana',
      'fruit',
      'vegetable',
      'veggies',
      'onion',
      'garlic',
      'tomato',
      'potato',
      'chicken breast',
      'beef',
      'pork',
      'meat',
      'fish',
      'salmon',
      'tofu',
      'kimchi',
      'cereal',
      'oat',
      'water',
      'grocery',
      'groceries',
      'mart',
      'emart',
      'emart24',
      'homeplus',
      'lotte mart',
      'coupang fresh',
      'market',
      'cu',
      'gs25',
      '7-eleven',
      '계란',
      '달걀',
      '특란',
      '식빵',
      '빵',
      '우유',
      '쌀',
      '라면',
      '이마트',
      '마트',
      '편의점',
      '장보기',
    ],
  },
  {
    categoryId: 'cat-bills',
    type: 'expense',
    keywords: [
      'rent',
      'electricity',
      'electric bill',
      'water bill',
      'gas bill',
      'utility',
      'utilities',
      'internet',
      'wifi',
      'phone bill',
      'mobile plan',
      'kt',
      'skt',
      'lgu+',
      '월세',
      '관리비',
      '전기세',
      '수도세',
      '가스비',
      '통신비',
      '공과금',
    ],
  },
  {
    categoryId: 'cat-study',
    type: 'expense',
    keywords: [
      'book',
      'textbook',
      'notebook',
      'pen',
      'pencil',
      'highlighter',
      'stationery',
      'paper',
      'print',
      'printing',
      'tuition',
      'course',
      'lab',
      'laptop',
      'usb',
      'keyboard',
      'mouse',
      'charger',
      'cable',
      'tablet',
      'ipad',
      'software',
      'kyobo',
      'hottracks',
      'daiso',
      'study',
      'exam',
      '책',
      '교재',
      '노트',
      '공책',
      '필기구',
      '형광펜',
      '다이소',
      '교보문고',
      '인쇄',
      '프린트',
      '학용품',
    ],
  },
  {
    categoryId: 'cat-shopping',
    type: 'expense',
    keywords: [
      'clothes',
      'shirt',
      'shoes',
      'sneakers',
      'jacket',
      'uniqlo',
      'zara',
      'musinsa',
      'coupang',
      'fashion',
      'backpack',
      'electronics',
      '무신사',
      '유니클로',
      '쿠팡',
      '쇼핑',
      '의류',
      '신발',
    ],
  },
  {
    categoryId: 'cat-transit',
    type: 'expense',
    keywords: [
      'metro',
      'subway',
      'bus',
      'train',
      'ktx',
      'srt',
      'taxi',
      'cab',
      'kakao t',
      'uber',
      't-money',
      'tmoney',
      'climate card',
      'transit',
      'transport',
      'commute',
      'flight',
      'airport',
      'arex',
      'fuel',
      'gas',
      'parking',
      'toll',
      '지하철',
      '버스',
      '택시',
      '카카오택시',
      '티머니',
      '기후동행카드',
      '교통',
      '기차',
    ],
  },
  {
    categoryId: 'cat-placement',
    type: 'income',
    keywords: [
      'salary',
      'stipend',
      'paycheck',
      'wage',
      'internship',
      'placement',
      'bonus',
      'freelance',
      'payroll',
      '월급',
      '급여',
      '인턴',
      '장학금',
      '알바',
    ],
  },
  {
    categoryId: 'cat-tutoring',
    type: 'income',
    keywords: [
      'tutor',
      'tutoring',
      'teaching',
      'ta',
      'research assistant',
      'campus job',
      '과외',
      '튜터링',
      '근로',
    ],
  },
  {
    categoryId: 'cat-allowance',
    type: 'income',
    keywords: [
      'allowance',
      'parents',
      'mom',
      'dad',
      'family',
      'gift',
      'refund',
      'cashback',
      '용돈',
      '지원금',
      '환급',
    ],
  },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isLatinKeyword(keyword: string): boolean {
  return /^[a-z0-9\s\-+]+$/i.test(keyword);
}

function matchesKeyword(haystackLower: string, rawKeyword: string): boolean {
  const kw = rawKeyword.trim().toLowerCase();
  if (!kw) return false;

  if (isLatinKeyword(kw)) {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(kw)}($|[^a-z0-9])`, 'i');
    return pattern.test(haystackLower);
  }

  return haystackLower.includes(kw);
}

export function getFallbackCategory(
  categories: Category[],
  type: TransactionType = 'expense'
): Category {
  const uncategorized = categories.find((c) => c.id === 'cat-uncategorized' || c.name === 'Uncategorized');
  if (uncategorized) return uncategorized;
  const typed = categories.find((c) => c.type === (type === 'income' ? 'income' : 'expense'));
  return (
    typed ||
    categories[0] || {
      id: 'cat-uncategorized',
      name: 'Uncategorized',
      type: 'expense',
      icon: 'Tag',
      color: '#8E8E93',
    }
  );
}

export function inferCategoryForItem(
  itemText: string,
  categories: Category[],
  currentType: TransactionType = 'expense'
): AutoCategoryMatch | null {
  const normalized = itemText.trim().toLowerCase();
  if (normalized.length < 2) return null;

  for (const rule of AUTO_CATEGORY_RULES) {
    if (currentType !== 'transfer' && rule.type !== currentType) continue;

    for (const kw of rule.keywords) {
      if (matchesKeyword(normalized, kw)) {
        const category = categories.find(
          (c) =>
            c.id === rule.categoryId ||
            (rule.isCharity && c.isCharity)
        );
        if (category) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            matchedKeyword: kw.trim(),
            isCharity: Boolean(rule.isCharity || category.isCharity),
          };
        }
      }
    }
  }

  return null;
}

export function categorizeItemOrUncategorized(
  itemText: string,
  categories: Category[],
  currentType: TransactionType = 'expense'
): Category {
  const match = inferCategoryForItem(itemText, categories, currentType);
  if (match) {
    const found = categories.find((c) => c.id === match.categoryId);
    if (found) return found;
  }
  return getFallbackCategory(categories, currentType);
}
