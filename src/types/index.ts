export type PromotionType = 'full_reduce' | 'second_half' | 'member_discount' | 'fixed_discount';

export interface FullReduceConfig {
  threshold: number;
  reduce: number;
  stackable?: boolean;
}

export interface SecondHalfConfig {
  applyTo: 'cheapest' | 'same_price';
}

export interface MemberDiscountConfig {
  discount: number;
}

export interface FixedDiscountConfig {
  discount: number;
  threshold?: number;
}

export type PromotionConfig = FullReduceConfig | SecondHalfConfig | MemberDiscountConfig | FixedDiscountConfig;

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  config: PromotionConfig;
  enabled: boolean;
  description: string;
  createdAt: string;
  startDate?: string;
  archivedAt?: string;
}

export interface ArchiveStats {
  orderCount: number;
  totalRevenue: number;
  totalDiscount: number;
  originalTotal: number;
}

export interface PromotionTemplate {
  id: string;
  name: string;
  type: PromotionType;
  config: PromotionConfig;
  description: string;
  savedAt: string;
  isArchive: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
  statsSummary?: ArchiveStats;
  sourcePromotionName?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DiscountPlan {
  promotionId: string | null;
  promotionName: string;
  promotionType?: PromotionType;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  breakdown: string[];
  isBest: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  isMember: boolean;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  appliedPromotionId: string | null;
  appliedPromotionName: string;
  createdAt: string;
}

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  full_reduce: '满减优惠',
  second_half: '第二件半价',
  member_discount: '会员折扣',
  fixed_discount: '限时折扣',
};

export const PROMOTION_TYPE_ICONS: Record<PromotionType, string> = {
  full_reduce: 'Tag',
  second_half: 'ShoppingBag',
  member_discount: 'Crown',
  fixed_discount: 'Percent',
};
