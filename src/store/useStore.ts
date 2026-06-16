import { create } from 'zustand';
import type {
  CartItem,
  Promotion,
  PromotionTemplate,
  Order,
  PromotionType,
  PromotionConfig,
  DiscountPlan,
  ArchiveStats,
} from '@/types';
import { storage } from '@/utils/storage';
import { genId } from '@/utils/format';
import { computeAllPlans } from '@/utils/discountEngine';

const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: 'demo_1',
    name: '满300减50',
    type: 'full_reduce',
    config: { threshold: 300, reduce: 50, stackable: true },
    enabled: true,
    description: '全场满300元立减50元，可叠加（满600减100）',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'demo_2',
    name: '第二件半价（低价款）',
    type: 'second_half',
    config: { applyTo: 'cheapest' },
    enabled: true,
    description: '任意搭配，第二件取最低价半价结算',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'demo_3',
    name: '会员专享9折',
    type: 'member_discount',
    config: { discount: 0.9 },
    enabled: true,
    description: '注册会员全场9折优惠',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'demo_4',
    name: '全场88折',
    type: 'fixed_discount',
    config: { discount: 0.88 },
    enabled: false,
    description: '季末全场88折',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
];

const DEFAULT_TEMPLATES: PromotionTemplate[] = [
  {
    id: 'tpl_1',
    name: '夏季清仓 满500减100',
    type: 'full_reduce',
    config: { threshold: 500, reduce: 100, stackable: false },
    description: '每年夏季大清仓，满500减100不可叠加',
    savedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    isArchive: false,
  },
  {
    id: 'tpl_2',
    name: 'VIP会员日 85折',
    type: 'member_discount',
    config: { discount: 0.85 },
    description: '每月会员日专属折扣',
    savedAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    isArchive: false,
  },
];

const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ord_1',
    items: [
      { id: 'i1', name: '真丝连衣裙', price: 699, quantity: 1 },
      { id: 'i2', name: '夏季T恤', price: 199, quantity: 2 },
    ],
    isMember: true,
    originalAmount: 1097,
    discountAmount: 109.7,
    finalAmount: 987.3,
    appliedPromotionId: 'demo_3',
    appliedPromotionName: '会员专享9折',
    createdAt: new Date(Date.now() - 86400000 * 2 + 3600000 * 4).toISOString(),
  },
  {
    id: 'ord_2',
    items: [
      { id: 'i3', name: '牛仔裤', price: 399, quantity: 1 },
      { id: 'i4', name: '白色衬衫', price: 259, quantity: 1 },
    ],
    isMember: false,
    originalAmount: 658,
    discountAmount: 100,
    finalAmount: 558,
    appliedPromotionId: 'demo_1',
    appliedPromotionName: '满300减50',
    createdAt: new Date(Date.now() - 86400000 + 3600000 * 10).toISOString(),
  },
  {
    id: 'ord_3',
    items: [
      { id: 'i5', name: '夏季T恤', price: 199, quantity: 2 },
      { id: 'i6', name: '短裤', price: 249, quantity: 1 },
    ],
    isMember: false,
    originalAmount: 647,
    discountAmount: 99.5,
    finalAmount: 547.5,
    appliedPromotionId: 'demo_2',
    appliedPromotionName: '第二件半价（低价款）',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'ord_4',
    items: [
      { id: 'i7', name: '真丝连衣裙', price: 699, quantity: 1 },
    ],
    isMember: true,
    originalAmount: 699,
    discountAmount: 69.9,
    finalAmount: 629.1,
    appliedPromotionId: 'demo_3',
    appliedPromotionName: '会员专享9折',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

interface StoreState {
  cart: CartItem[];
  isMember: boolean;
  promotions: Promotion[];
  templates: PromotionTemplate[];
  orders: Order[];
  selectedPlan: DiscountPlan | null;

  addCartItem: (name: string, price: number, quantity: number) => void;
  updateCartItem: (id: string, patch: Partial<CartItem>) => void;
  removeCartItem: (id: string) => void;
  clearCart: () => void;
  setIsMember: (v: boolean) => void;

  addPromotion: (data: { name: string; type: PromotionType; config: PromotionConfig; description: string }) => void;
  updatePromotion: (id: string, patch: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  togglePromotion: (id: string) => void;

  saveAsTemplate: (promotionId: string, templateName: string) => void;
  archivePromotion: (promotionId: string, data: { name: string; notes: string }) => void;
  createFromTemplate: (templateId: string) => Promotion;
  deleteTemplate: (templateId: string) => void;

  computePlans: () => DiscountPlan[];
  setSelectedPlan: (plan: DiscountPlan | null) => void;
  checkout: (plan: DiscountPlan) => Order;
}

function initializeData(): {
  promotions: Promotion[];
  templates: PromotionTemplate[];
  orders: Order[];
} {
  let promotions = storage.getPromotions();
  let templates = storage.getTemplates();
  let orders = storage.getOrders();

  if (promotions.length === 0) {
    promotions = DEFAULT_PROMOTIONS;
    storage.setPromotions(promotions);
  }
  if (templates.length === 0) {
    templates = DEFAULT_TEMPLATES;
    storage.setTemplates(templates);
  }
  if (orders.length === 0) {
    orders = SAMPLE_ORDERS;
    storage.setOrders(orders);
  }

  return { promotions, templates, orders };
}

export const useStore = create<StoreState>((set, get) => {
  const init = initializeData();

  return {
    cart: [],
    isMember: false,
    promotions: init.promotions,
    templates: init.templates,
    orders: init.orders,
    selectedPlan: null,

    addCartItem: (name, price, quantity) => {
      if (!name.trim() || price <= 0 || quantity <= 0) return;
      set((s) => ({
        cart: [
          ...s.cart,
          {
            id: genId(),
            name: name.trim(),
            price: Number(price),
            quantity: Number(quantity),
          },
        ],
      }));
    },

    updateCartItem: (id, patch) => {
      set((s) => ({
        cart: s.cart.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      }));
    },

    removeCartItem: (id) => {
      set((s) => ({ cart: s.cart.filter((it) => it.id !== id) }));
    },

    clearCart: () => set({ cart: [], selectedPlan: null, isMember: false }),

    setIsMember: (v) => set({ isMember: v }),

    addPromotion: (data) => {
      const now = new Date().toISOString();
      const newP: Promotion = {
        id: genId(),
        ...data,
        enabled: true,
        createdAt: now,
        startDate: now,
      };
      set((s) => {
        const list = [...s.promotions, newP];
        storage.setPromotions(list);
        return { promotions: list };
      });
    },

    updatePromotion: (id, patch) => {
      set((s) => {
        const list = s.promotions.map((p) => (p.id === id ? { ...p, ...patch } : p));
        storage.setPromotions(list);
        return { promotions: list };
      });
    },

    deletePromotion: (id) => {
      set((s) => {
        const list = s.promotions.filter((p) => p.id !== id);
        storage.setPromotions(list);
        return { promotions: list };
      });
    },

    togglePromotion: (id) => {
      set((s) => {
        const list = s.promotions.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p));
        storage.setPromotions(list);
        return { promotions: list };
      });
    },

    saveAsTemplate: (promotionId, templateName) => {
      const p = get().promotions.find((x) => x.id === promotionId);
      if (!p) return;
      const tpl: PromotionTemplate = {
        id: genId(),
        name: templateName || p.name,
        type: p.type,
        config: p.config,
        description: p.description,
        savedAt: new Date().toISOString(),
        isArchive: false,
        sourcePromotionName: p.name,
      };
      set((s) => {
        const list = [tpl, ...s.templates];
        storage.setTemplates(list);
        return { templates: list };
      });
    },

    archivePromotion: (promotionId, data) => {
      const p = get().promotions.find((x) => x.id === promotionId);
      if (!p) return;
      const orders = get().orders;
      const relatedOrders = orders.filter((o) => o.appliedPromotionId === promotionId);
      const stats: ArchiveStats = {
        orderCount: relatedOrders.length,
        totalRevenue: relatedOrders.reduce((s, o) => s + o.finalAmount, 0),
        totalDiscount: relatedOrders.reduce((s, o) => s + o.discountAmount, 0),
        originalTotal: relatedOrders.reduce((s, o) => s + o.originalAmount, 0),
      };
      const now = new Date().toISOString();
      const tpl: PromotionTemplate = {
        id: genId(),
        name: data.name || p.name,
        type: p.type,
        config: p.config,
        description: p.description,
        savedAt: now,
        isArchive: true,
        startDate: p.startDate || p.createdAt,
        endDate: now,
        notes: data.notes,
        statsSummary: stats,
        sourcePromotionName: p.name,
      };
      set((s) => {
        const tList = [tpl, ...s.templates];
        storage.setTemplates(tList);
        const pList = s.promotions.map((pr) =>
          pr.id === promotionId ? { ...pr, enabled: false, archivedAt: now } : pr
        );
        storage.setPromotions(pList);
        return { templates: tList, promotions: pList };
      });
    },

    createFromTemplate: (templateId) => {
      const tpl = get().templates.find((t) => t.id === templateId)!;
      const now = new Date().toISOString();
      const newP: Promotion = {
        id: genId(),
        name: tpl.name.replace(/（复用）$/, '').replace(/（归档.*$/, '') + '（复用）',
        type: tpl.type,
        config: tpl.config,
        enabled: true,
        description: tpl.description,
        createdAt: now,
        startDate: now,
      };
      set((s) => {
        const list = [newP, ...s.promotions];
        storage.setPromotions(list);
        return { promotions: list };
      });
      return newP;
    },

    deleteTemplate: (templateId) => {
      set((s) => {
        const list = s.templates.filter((t) => t.id !== templateId);
        storage.setTemplates(list);
        return { templates: list };
      });
    },

    computePlans: () => {
      const { cart, promotions, isMember } = get();
      if (cart.length === 0) return [];
      return computeAllPlans(cart, promotions, isMember);
    },

    setSelectedPlan: (plan) => set({ selectedPlan: plan }),

    checkout: (plan) => {
      const { cart, isMember } = get();
      const order: Order = {
        id: genId(),
        items: JSON.parse(JSON.stringify(cart)),
        isMember,
        originalAmount: plan.originalAmount,
        discountAmount: plan.discountAmount,
        finalAmount: plan.finalAmount,
        appliedPromotionId: plan.promotionId,
        appliedPromotionName: plan.promotionName,
        createdAt: new Date().toISOString(),
      };
      set((s) => {
        const list = [order, ...s.orders];
        storage.setOrders(list);
        return { orders: list, cart: [], selectedPlan: null, isMember: false };
      });
      return order;
    },
  };
});
