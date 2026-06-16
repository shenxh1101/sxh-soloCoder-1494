import type { Promotion, PromotionTemplate, Order } from '@/types';

const KEYS = {
  promotions: 'yiyue_promotions',
  templates: 'yiyue_templates',
  orders: 'yiyue_orders',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error', e);
  }
}

export const storage = {
  getPromotions(): Promotion[] {
    return read<Promotion[]>(KEYS.promotions, []);
  },
  setPromotions(list: Promotion[]) {
    write(KEYS.promotions, list);
  },
  getTemplates(): PromotionTemplate[] {
    return read<PromotionTemplate[]>(KEYS.templates, []);
  },
  setTemplates(list: PromotionTemplate[]) {
    write(KEYS.templates, list);
  },
  getOrders(): Order[] {
    return read<Order[]>(KEYS.orders, []);
  },
  setOrders(list: Order[]) {
    write(KEYS.orders, list);
  },
};
