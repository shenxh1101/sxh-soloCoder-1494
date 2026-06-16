import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  UserCog,
  Crown,
  Receipt,
  Sparkles,
  Minus,
  CheckCircle2,
  Tag,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatMoney } from '@/utils/format';
import { countItems, sumItems } from '@/utils/discountEngine';
import type { DiscountPlan } from '@/types';
import Modal from '@/components/Modal';

const typeIcons: Record<string, typeof Tag> = {
  full_reduce: Tag,
  second_half: ShoppingBag,
  member_discount: Crown,
  fixed_discount: Percent,
};

export default function Checkout() {
  const cart = useStore((s) => s.cart);
  const isMember = useStore((s) => s.isMember);
  const addCartItem = useStore((s) => s.addCartItem);
  const updateCartItem = useStore((s) => s.updateCartItem);
  const removeCartItem = useStore((s) => s.removeCartItem);
  const clearCart = useStore((s) => s.clearCart);
  const setIsMember = useStore((s) => s.setIsMember);
  const computePlans = useStore((s) => s.computePlans);
  const checkout = useStore((s) => s.checkout);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');
  const [showSuccess, setShowSuccess] = useState<null | { orderId: string; final: number }>(null);

  const plans = useMemo(() => computePlans(), [cart, computePlans]);
  const bestPlan = plans.find((p) => p.isBest);
  const selectedId = useStore((s) => s.selectedPlan?.promotionId ?? 'best');
  const setSelectedPlan = useStore((s) => s.setSelectedPlan);

  useEffect(() => {
    if (bestPlan) setSelectedPlan(bestPlan);
    else setSelectedPlan(null);
  }, [bestPlan, setSelectedPlan]);

  const selectedPlan: DiscountPlan | null =
    plans.find((p) => (p.promotionId ?? 'none') === selectedId) || bestPlan || plans[0] || null;

  const totalItems = countItems(cart);
  const totalOriginal = sumItems(cart);

  function handleAdd() {
    const p = parseFloat(price);
    const q = parseInt(qty, 10);
    if (!name.trim() || !p || p <= 0 || !q || q <= 0) return;
    addCartItem(name, p, q);
    setName('');
    setPrice('');
    setQty('1');
  }

  function handleCheckout() {
    if (!selectedPlan) return;
    const order = checkout(selectedPlan);
    setShowSuccess({ orderId: order.id.slice(0, 8).toUpperCase(), final: order.finalAmount });
    setTimeout(() => setShowSuccess(null), 3200);
  }

  return (
    <div className="container max-w-6xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-800 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-champagne-500" />
            结账台
          </h2>
          <p className="text-sm text-ink-500 mt-1">录入商品，系统自动为您选出最优惠方案</p>
        </div>
        <button
          onClick={() => setIsMember(!isMember)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            isMember
              ? 'bg-champagne-500/10 border-champagne-300 text-champagne-700 shadow-gold'
              : 'bg-white border-ink-200 text-ink-500 hover:border-champagne-300'
          }`}
        >
          <Crown className={`w-4 h-4 ${isMember ? 'text-champagne-500' : ''}`} />
          <span className="text-sm font-medium">{isMember ? '会员身份已启用' : '非会员（点击切换）'}</span>
          <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${isMember ? 'bg-champagne-400' : 'bg-ink-200'}`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform shadow ${isMember ? 'translate-x-4' : ''}`} />
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="card p-5">
            <h3 className="font-display text-base font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-rosegold-500" />
              添加商品
            </h3>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-5">
                <label className="label">商品名称</label>
                <input
                  className="input"
                  placeholder="例：真丝连衣裙"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <div className="col-span-3">
                <label className="label">单价（¥）</label>
                <input
                  className="input"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <div className="col-span-2">
                <label className="label">数量</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <div className="col-span-2 flex items-end">
                <button onClick={handleAdd} className="btn-secondary w-full justify-center">
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink-100 bg-ink-50/60">
              <h3 className="font-display text-base font-semibold text-ink-800">
                购物清单
                {cart.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-ink-400">
                    {cart.length} 款 · 共 {totalItems} 件
                  </span>
                )}
              </h3>
              {cart.length > 0 && (
                <button onClick={clearCart} className="btn-ghost !py-1.5 text-xs text-ink-400 hover:text-rosegold-600">
                  <Trash2 className="w-3.5 h-3.5" />
                  清空
                </button>
              )}
            </div>
            {cart.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-ink-50 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-ink-300" />
                </div>
                <p className="text-ink-400 text-sm">还没有商品，快添加吧～</p>
              </div>
            ) : (
              <div className="divide-y divide-ink-100">
                {cart.map((it) => (
                  <div key={it.id} className="px-5 py-3 flex items-center gap-4 hover:bg-ink-50/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <input
                        className="bg-transparent border-none outline-none w-full font-medium text-ink-800 text-sm focus:bg-white focus:rounded-md focus:px-1"
                        value={it.name}
                        onChange={(e) => updateCartItem(it.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="w-28">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-400 text-xs">¥</span>
                        <input
                          type="number"
                          step="0.01"
                          className="input !py-1.5 pl-6 text-right text-sm"
                          value={it.price}
                          onChange={(e) => updateCartItem(it.id, { price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-ink-50 rounded-lg p-1 border border-ink-100">
                      <button
                        className="w-6 h-6 rounded-md text-ink-500 hover:bg-white hover:text-ink-800 transition"
                        onClick={() => updateCartItem(it.id, { quantity: Math.max(1, it.quantity - 1) })}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        className="w-12 text-center bg-transparent border-none outline-none text-sm font-medium text-ink-800"
                        value={it.quantity}
                        onChange={(e) => updateCartItem(it.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      />
                      <button
                        className="w-6 h-6 rounded-md text-ink-500 hover:bg-white hover:text-ink-800 transition"
                        onClick={() => updateCartItem(it.id, { quantity: it.quantity + 1 })}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="w-24 text-right">
                      <span className="font-display font-semibold text-ink-800">{formatMoney(it.price * it.quantity)}</span>
                    </div>
                    <button
                      className="p-2 rounded-lg text-ink-300 hover:text-rosegold-600 hover:bg-rosegold-50 transition"
                      onClick={() => removeCartItem(it.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="px-5 py-3 bg-ink-50/60 flex items-center justify-between">
                  <span className="text-sm text-ink-500 flex items-center gap-2">
                    <UserCog className="w-4 h-4" />
                    商品原价合计
                  </span>
                  <span className="font-display text-xl font-bold text-ink-800">{formatMoney(totalOriginal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <h3 className="font-display text-base font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-champagne-500" />
              优惠方案对比
            </h3>
            {plans.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-ink-400">添加商品后自动计算优惠方案</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
                {plans.map((plan) => {
                  const Icon = plan.promotionType ? typeIcons[plan.promotionType] : null;
                  const isSelected =
                    (plan.promotionId ?? 'none') === selectedId ||
                    (plan.isBest && selectedId === 'best' && !plans.some((p) => (p.promotionId ?? 'none') === selectedId));
                  return (
                    <button
                      key={plan.promotionId ?? 'none'}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        plan.isBest
                          ? 'bg-gradient-to-br from-champagne-50 via-white to-rosegold-50/60 border-champagne-300 shadow-gold'
                          : 'bg-white border-ink-100 hover:border-rosegold-200'
                      } ${isSelected && !plan.isBest ? 'ring-2 ring-ink-400 ring-offset-1' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                              plan.isBest ? 'bg-champagne-400 text-white' : 'bg-ink-100 text-ink-500'
                            }`}
                          >
                            {Icon ? <Icon className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-sm font-semibold ${plan.isBest ? 'text-champagne-700' : 'text-ink-700'}`}>
                                {plan.promotionName}
                              </span>
                              {plan.isBest && (
                                <span className="badge badge-gold">
                                  <Sparkles className="w-3 h-3 mr-0.5" /> 最优
                                </span>
                              )}
                            </div>
                            <ul className="mt-1.5 space-y-0.5">
                              {plan.breakdown.map((b, i) => (
                                <li key={i} className="text-xs text-ink-400 leading-snug">
                                  · {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div
                            className={`font-display font-bold ${
                              plan.isBest ? 'text-champagne-600 text-lg' : 'text-ink-700 text-base'
                            }`}
                          >
                            {formatMoney(plan.finalAmount)}
                          </div>
                          {plan.discountAmount > 0 && (
                            <div className="text-xs text-rosegold-500 font-medium mt-0.5">
                              省 {formatMoney(plan.discountAmount)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card p-5 border-champagne-200 bg-gradient-to-br from-white via-champagne-50/30 to-rosegold-50/30">
            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">原价总额</span>
                <span className="text-ink-700">{selectedPlan ? formatMoney(selectedPlan.originalAmount) : '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">优惠减免</span>
                <span className="text-rosegold-600 font-medium">
                  -{selectedPlan ? formatMoney(selectedPlan.discountAmount) : '—'}
                </span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent" />
              <div className="flex items-end justify-between pt-1">
                <span className="text-sm font-medium text-ink-600">应付金额</span>
                <span className="font-display text-3xl font-bold text-champagne-600">
                  {selectedPlan ? formatMoney(selectedPlan.finalAmount) : '—'}
                </span>
              </div>
            </div>
            <button
              disabled={!selectedPlan}
              onClick={handleCheckout}
              className="btn-primary w-full py-3 text-base animate-pulse-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:animate-none"
            >
              <CheckCircle2 className="w-5 h-5" />
              确认结账
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={!!showSuccess}
        onClose={() => setShowSuccess(null)}
        title="结账成功"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <p className="font-display text-xl font-bold text-ink-800 mb-1">
            {showSuccess ? formatMoney(showSuccess.final) : ''}
          </p>
          <p className="text-sm text-ink-500">
            订单号：<span className="font-mono font-medium text-ink-700">{showSuccess?.orderId}</span>
          </p>
          <p className="text-xs text-ink-400 mt-3">订单已保存，可在数据统计页查看</p>
        </div>
      </Modal>
    </div>
  );
}
