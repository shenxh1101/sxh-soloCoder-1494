import type {
  CartItem,
  DiscountPlan,
  Promotion,
  FullReduceConfig,
  SecondHalfConfig,
  MemberDiscountConfig,
  FixedDiscountConfig,
} from '@/types';

function sumOriginal(items: CartItem[]): number {
  return items.reduce((sum, it) => sum + it.price * it.quantity, 0);
}

function expandItems(items: CartItem[]): { price: number; name: string }[] {
  const list: { price: number; name: string }[] = [];
  for (const it of items) {
    for (let i = 0; i < it.quantity; i++) {
      list.push({ price: it.price, name: it.name });
    }
  }
  return list;
}

function calcFullReduce(
  items: CartItem[],
  config: FullReduceConfig
): { discount: number; breakdown: string[] } {
  const original = sumOriginal(items);
  const breakdown: string[] = [];
  if (original < config.threshold) {
    return { discount: 0, breakdown: [`未达到满减门槛 ¥${config.threshold}`] };
  }
  let discount = 0;
  if (config.stackable) {
    const times = Math.floor(original / config.threshold);
    discount = config.reduce * times;
    breakdown.push(`满 ¥${config.threshold} 减 ¥${config.reduce}，可叠加 ${times} 次`);
  } else {
    discount = config.reduce;
    breakdown.push(`满 ¥${config.threshold} 减 ¥${config.reduce}`);
  }
  return { discount, breakdown };
}

function calcSecondHalf(
  items: CartItem[],
  config: SecondHalfConfig
): { discount: number; breakdown: string[] } {
  const expanded = expandItems(items);
  if (expanded.length < 2) {
    return { discount: 0, breakdown: ['商品数量不足2件，无法享受第二件半价'] };
  }
  const breakdown: string[] = [];
  let discount = 0;

  if (config.applyTo === 'cheapest') {
    const sorted = [...expanded].sort((a, b) => b.price - a.price);
    let pairIdx = 0;
    for (let i = 1; i < sorted.length; i += 2) {
      pairIdx++;
      const halfPrice = sorted[i].price / 2;
      discount += halfPrice;
      breakdown.push(`第${pairIdx}组：「${sorted[i].name}」¥${sorted[i].price} 半价省 ¥${halfPrice.toFixed(2)}`);
    }
  } else {
    const groups = new Map<string, { prices: number[] }>();
    for (const it of items) {
      if (!groups.has(it.name)) groups.set(it.name, { prices: [] });
      const g = groups.get(it.name)!;
      for (let i = 0; i < it.quantity; i++) g.prices.push(it.price);
    }
    for (const [name, g] of groups) {
      const pairs = Math.floor(g.prices.length / 2);
      if (pairs > 0) {
        const perPairDiscount = g.prices[0] / 2;
        discount += perPairDiscount * pairs;
        breakdown.push(`「${name}」买 ${pairs * 2} 件，其中 ${pairs} 件半价省 ¥${(perPairDiscount * pairs).toFixed(2)}`);
      }
    }
    if (discount === 0) {
      breakdown.push('无同款商品满足第二件半价条件');
    }
  }
  return { discount, breakdown };
}

function calcMemberDiscount(
  items: CartItem[],
  config: MemberDiscountConfig,
  isMember: boolean
): { discount: number; breakdown: string[] } {
  const original = sumOriginal(items);
  const breakdown: string[] = [];
  if (!isMember) {
    return { discount: 0, breakdown: ['非会员无法享受会员折扣'] };
  }
  const discount = original * (1 - config.discount);
  breakdown.push(`会员专属 ${(config.discount * 10).toFixed(0)} 折`);
  return { discount, breakdown };
}

function calcFixedDiscount(
  items: CartItem[],
  config: FixedDiscountConfig
): { discount: number; breakdown: string[] } {
  const original = sumOriginal(items);
  const breakdown: string[] = [];
  if (config.threshold && original < config.threshold) {
    return { discount: 0, breakdown: [`未达到折扣门槛 ¥${config.threshold}`] };
  }
  const discount = original * (1 - config.discount);
  breakdown.push(
    config.threshold
      ? `满 ¥${config.threshold} 享受 ${(config.discount * 10).toFixed(0)} 折`
      : `全场 ${(config.discount * 10).toFixed(0)} 折`
  );
  return { discount, breakdown };
}

export function computeAllPlans(
  items: CartItem[],
  promotions: Promotion[],
  isMember: boolean
): DiscountPlan[] {
  const original = sumOriginal(items);
  const plans: DiscountPlan[] = [];

  plans.push({
    promotionId: null,
    promotionName: '不使用活动',
    originalAmount: original,
    discountAmount: 0,
    finalAmount: original,
    breakdown: ['原价结算，不参与任何活动'],
    isBest: false,
  });

  for (const p of promotions) {
    if (!p.enabled) continue;
    let result: { discount: number; breakdown: string[] };
    try {
      switch (p.type) {
        case 'full_reduce':
          result = calcFullReduce(items, p.config as FullReduceConfig);
          break;
        case 'second_half':
          result = calcSecondHalf(items, p.config as SecondHalfConfig);
          break;
        case 'member_discount':
          result = calcMemberDiscount(items, p.config as MemberDiscountConfig, isMember);
          break;
        case 'fixed_discount':
          result = calcFixedDiscount(items, p.config as FixedDiscountConfig);
          break;
        default:
          continue;
      }
    } catch {
      continue;
    }
    const discount = Math.max(0, Math.min(result.discount, original));
    plans.push({
      promotionId: p.id,
      promotionName: p.name,
      promotionType: p.type,
      originalAmount: original,
      discountAmount: Number(discount.toFixed(2)),
      finalAmount: Number((original - discount).toFixed(2)),
      breakdown: result.breakdown,
      isBest: false,
    });
  }

  const best = plans.reduce((prev, cur) => (cur.finalAmount < prev.finalAmount ? cur : prev), plans[0]);
  const bestIdx = plans.indexOf(best);
  if (bestIdx >= 0) plans[bestIdx].isBest = true;

  plans.sort((a, b) => a.finalAmount - b.finalAmount);
  return plans;
}

export function sumItems(items: CartItem[]): number {
  return sumOriginal(items);
}

export function countItems(items: CartItem[]): number {
  return items.reduce((sum, it) => sum + it.quantity, 0);
}
