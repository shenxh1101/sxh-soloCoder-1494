import { useMemo, useState } from 'react';
import {
  BarChart3,
  Wallet,
  Percent,
  ShoppingCart,
  Users,
  Calendar,
  Receipt,
  Medal,
  Tag,
  ChevronDown,
  Eye,
  TrendingUp,
  ShoppingBag,
  Crown,
  Filter,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatMoney, formatDate, formatDateShort } from '@/utils/format';
import { PROMOTION_TYPE_LABELS, type PromotionType, type Order } from '@/types';
import StatCard from '@/components/StatCard';

type Range = '7d' | '30d' | 'all';

const typeIconMap: Record<PromotionType, typeof Tag> = {
  full_reduce: Tag,
  second_half: ShoppingBag,
  member_discount: Crown,
  fixed_discount: Percent,
};

export default function Statistics() {
  const orders = useStore((s) => s.orders);
  const promotions = useStore((s) => s.promotions);
  const [range, setRange] = useState<Range>('all');
  const [showOrders, setShowOrders] = useState(true);
  const [expandedPromo, setExpandedPromo] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState<string>('all');

  const filteredOrders = useMemo(() => {
    if (range === 'all') return orders;
    const days = range === '7d' ? 7 : 30;
    const cutoff = Date.now() - days * 86400000;
    return orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
  }, [orders, range]);

  const promoOrders = useMemo(
    () => filteredOrders.filter((o) => o.appliedPromotionId),
    [filteredOrders]
  );

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((s, o) => s + o.finalAmount, 0);
    const totalDiscount = filteredOrders.reduce((s, o) => s + o.discountAmount, 0);
    const originalTotal = filteredOrders.reduce((s, o) => s + o.originalAmount, 0);
    const avgOrder = filteredOrders.length ? totalRevenue / filteredOrders.length : 0;
    const memberOrders = filteredOrders.filter((o) => o.isMember).length;
    const discountRate = originalTotal ? (totalDiscount / originalTotal) * 100 : 0;

    const promoRevenue = promoOrders.reduce((s, o) => s + o.finalAmount, 0);
    const incrementalSales = totalRevenue - (filteredOrders.length > 0 ? filteredOrders.filter((o) => !o.appliedPromotionId).reduce((s, o) => s + o.finalAmount, 0) / Math.max(1, filteredOrders.filter((o) => !o.appliedPromotionId).length) * filteredOrders.length : 0);

    const promotionDetail = new Map<
      string,
      {
        id: string;
        name: string;
        type?: PromotionType;
        count: number;
        revenue: number;
        discount: number;
        originalTotal: number;
        incremental: number;
        orders: Order[];
      }
    >();
    for (const o of filteredOrders) {
      const key = o.appliedPromotionId || 'none';
      const name = o.appliedPromotionName || '原价无活动';
      if (!promotionDetail.has(key)) {
        const promo = promotions.find((p) => p.id === key);
        promotionDetail.set(key, {
          id: key,
          name,
          type: promo?.type,
          count: 0,
          revenue: 0,
          discount: 0,
          originalTotal: 0,
          incremental: 0,
          orders: [],
        });
      }
      const s = promotionDetail.get(key)!;
      s.count++;
      s.revenue += o.finalAmount;
      s.discount += o.discountAmount;
      s.originalTotal += o.originalAmount;
      s.orders.push(o);
    }
    const avgNoPromoOrder = filteredOrders.filter((o) => !o.appliedPromotionId).length > 0
      ? filteredOrders.filter((o) => !o.appliedPromotionId).reduce((s, o) => s + o.originalAmount, 0) /
        filteredOrders.filter((o) => !o.appliedPromotionId).length
      : 0;
    for (const s of promotionDetail.values()) {
      if (s.id !== 'none') {
        s.incremental = s.originalTotal - avgNoPromoOrder * s.count;
      }
    }
    const promoList = Array.from(promotionDetail.values())
      .filter((p) => p.id !== 'none')
      .sort((a, b) => b.revenue - a.revenue);

    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    const ordersForProducts = productFilter === 'all'
      ? promoOrders
      : promoOrders.filter((o) => o.appliedPromotionId === productFilter);
    for (const o of ordersForProducts) {
      for (const it of o.items) {
        const key = it.name;
        if (!productMap.has(key)) productMap.set(key, { name: key, qty: 0, revenue: 0 });
        const p = productMap.get(key)!;
        p.qty += it.quantity;
        p.revenue += it.price * it.quantity;
      }
    }
    const productList = Array.from(productMap.values()).sort((a, b) => b.qty - a.qty);
    const maxQty = Math.max(1, ...productList.map((p) => p.qty));

    return {
      totalRevenue,
      totalDiscount,
      originalTotal,
      avgOrder,
      orderCount: filteredOrders.length,
      memberOrders,
      discountRate,
      promoRevenue,
      incrementalSales,
      promoList,
      productList,
      maxQty,
    };
  }, [filteredOrders, promoOrders, promotions, productFilter]);

  const trend = useMemo(() => {
    if (range === 'all') return null;
    const days = range === '7d' ? 7 : 30;
    const now = Date.now();
    const cutoffCurrent = now - days * 86400000;
    const cutoffPrev = now - 2 * days * 86400000;
    const curRev = orders
      .filter((o) => new Date(o.createdAt).getTime() >= cutoffCurrent)
      .reduce((s, o) => s + o.finalAmount, 0);
    const prevRev = orders
      .filter(
        (o) =>
          new Date(o.createdAt).getTime() >= cutoffPrev &&
          new Date(o.createdAt).getTime() < cutoffCurrent
      )
      .reduce((s, o) => s + o.finalAmount, 0);
    if (!prevRev) return { up: true, value: '新周期' };
    const delta = ((curRev - prevRev) / prevRev) * 100;
    return { up: delta >= 0, value: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%` };
  }, [orders, range]);

  const rangeLabels: Record<Range, string> = {
    '7d': '近7天',
    '30d': '近30天',
    all: '全部数据',
  };

  return (
    <div className="container max-w-6xl py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            数据统计
          </h2>
          <p className="text-sm text-ink-500 mt-1">查看活动期间营业额、折扣效果、热销商品排行</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-50/80 border border-ink-100">
          {(Object.keys(rangeLabels) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`tab-btn ${range === r ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              {r === 'all' ? <Calendar className="w-4 h-4 inline mr-1.5 -mt-0.5" /> : null}
              {rangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="实收营业额"
          value={formatMoney(stats.totalRevenue)}
          subtitle={`共 ${stats.orderCount} 笔订单`}
          accent="gold"
          icon={<Wallet className="w-5 h-5 text-champagne-500" />}
          trend={trend || undefined}
        />
        <StatCard
          title="折扣让利"
          value={formatMoney(stats.totalDiscount)}
          subtitle={`平均折扣率 ${stats.discountRate.toFixed(1)}%`}
          accent="rose"
          icon={<Percent className="w-5 h-5 text-rosegold-500" />}
        />
        <StatCard
          title="平均客单价"
          value={formatMoney(stats.avgOrder)}
          subtitle={`会员订单 ${stats.memberOrders} 笔`}
          accent="ink"
          icon={<Users className="w-5 h-5 text-ink-500" />}
        />
        <StatCard
          title="活动拉动增量"
          value={formatMoney(Math.max(0, stats.incrementalSales))}
          subtitle={`促销订单 ${promoOrders.length} 笔`}
          accent="emerald"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          trend={stats.incrementalSales > 0 ? { up: true, value: '活动有效' } : undefined}
        />
      </div>

      <div className="card p-5 mb-6">
        <h3 className="font-display text-base font-semibold text-ink-800 mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-rosegold-500" />
          活动效果详情
        </h3>
        {stats.promoList.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-400">暂无促销活动订单数据</div>
        ) : (
          <div className="space-y-3">
            {stats.promoList.map((p, idx) => {
              const isExpanded = expandedPromo === p.id;
              const discountRate = p.originalTotal ? (p.discount / p.originalTotal) * 100 : 0;
              const Icon = p.type ? typeIconMap[p.type] : Tag;
              return (
                <div key={p.id} className="rounded-xl border border-ink-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedPromo(isExpanded ? null : p.id)}
                    className="w-full text-left p-4 hover:bg-ink-50/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-champagne-100 to-rosegold-100 border border-champagne-200 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-champagne-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-semibold text-ink-800 truncate">{p.name}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="badge badge-gold">{p.count} 单</span>
                            {p.type && <span className="text-xs text-ink-400">{PROMOTION_TYPE_LABELS[p.type]}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 flex-shrink-0 text-right">
                        <div>
                          <div className="text-[11px] text-ink-400">实收</div>
                          <div className="text-sm font-bold text-champagne-600">{formatMoney(p.revenue)}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-ink-400">让利</div>
                          <div className="text-sm font-bold text-rosegold-500">{formatMoney(p.discount)}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-ink-400">增量</div>
                          <div className={`text-sm font-bold ${p.incremental >= 0 ? 'text-emerald-600' : 'text-rosegold-600'}`}>
                            {p.incremental >= 0 ? '+' : ''}{formatMoney(p.incremental)}
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-ink-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-ink-100 animate-slide-up">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-ink-50/40">
                        <div className="text-center p-3 rounded-lg bg-white border border-ink-100">
                          <div className="text-[11px] text-ink-500 mb-1">订单数</div>
                          <div className="font-display text-lg font-bold text-ink-800">{p.count}</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white border border-ink-100">
                          <div className="text-[11px] text-ink-500 mb-1">原价总额</div>
                          <div className="font-display text-lg font-bold text-ink-700">{formatMoney(p.originalTotal)}</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white border border-ink-100">
                          <div className="text-[11px] text-ink-500 mb-1">折扣让利</div>
                          <div className="font-display text-lg font-bold text-rosegold-500">{formatMoney(p.discount)}</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white border border-ink-100">
                          <div className="text-[11px] text-ink-500 mb-1">折扣率</div>
                          <div className="font-display text-lg font-bold text-champagne-600">{discountRate.toFixed(1)}%</div>
                        </div>
                      </div>

                      <div className="px-4 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-3.5 h-3.5 text-ink-400" />
                          <span className="text-xs font-medium text-ink-500">关联订单</span>
                        </div>
                        <div className="max-h-[240px] overflow-y-auto scrollbar-thin">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-ink-50">
                              <tr className="text-ink-400">
                                <th className="text-left py-2 px-2 font-medium">时间</th>
                                <th className="text-left py-2 px-2 font-medium">商品</th>
                                <th className="text-center py-2 px-2 font-medium">会员</th>
                                <th className="text-right py-2 px-2 font-medium">原价</th>
                                <th className="text-right py-2 px-2 font-medium">优惠</th>
                                <th className="text-right py-2 px-2 font-medium">实付</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-50">
                              {p.orders.map((o) => (
                                <tr key={o.id} className="hover:bg-white/60">
                                  <td className="py-1.5 px-2 text-ink-500 whitespace-nowrap">{formatDateShort(o.createdAt)}</td>
                                  <td className="py-1.5 px-2 text-ink-700 max-w-[200px]">
                                    {o.items.map((it, i) => (
                                      <span key={i}>
                                        {it.name}×{it.quantity}
                                        {i < o.items.length - 1 && '、'}
                                      </span>
                                    ))}
                                  </td>
                                  <td className="py-1.5 px-2 text-center">
                                    {o.isMember ? <span className="badge badge-gold text-[10px]">会员</span> : <span className="text-ink-300">—</span>}
                                  </td>
                                  <td className="py-1.5 px-2 text-right text-ink-500">{formatMoney(o.originalAmount)}</td>
                                  <td className="py-1.5 px-2 text-right text-rosegold-500">-{formatMoney(o.discountAmount)}</td>
                                  <td className="py-1.5 px-2 text-right font-medium text-champagne-600">{formatMoney(o.finalAmount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-ink-800 flex items-center gap-2">
            <Medal className="w-4 h-4 text-champagne-500" />
            促销热销商品排行
          </h3>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-ink-400" />
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="input !w-auto !py-1.5 text-xs"
            >
              <option value="all">全部促销订单</option>
              {stats.promoList.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        {stats.productList.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-400">
            {productFilter === 'all' ? '暂无促销订单数据' : '该活动下暂无促销商品数据'}
          </div>
        ) : (
          <div className="space-y-3">
            {stats.productList.slice(0, 10).map((p, idx) => {
              const pct = (p.qty / stats.maxQty) * 100;
              const medals = [
                'bg-gradient-to-br from-champagne-300 to-champagne-500 text-white',
                'bg-gradient-to-br from-ink-300 to-ink-500 text-white',
                'bg-gradient-to-br from-rosegold-300 to-rosegold-500 text-white',
              ];
              return (
                <div key={p.name} className="group">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span
                      className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                        idx < 3 ? medals[idx] : 'bg-ink-100 text-ink-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-ink-700 flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-ink-400 flex-shrink-0">{formatMoney(p.revenue)}</span>
                  </div>
                  <div className="ml-10 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-champagne-300 to-champagne-500'
                          : idx === 1
                          ? 'bg-gradient-to-r from-ink-300 to-ink-500'
                          : idx === 2
                          ? 'bg-gradient-to-r from-rosegold-300 to-rosegold-500'
                          : 'bg-gradient-to-r from-ink-200 to-ink-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="ml-10 text-[11px] text-ink-400 mt-0.5">
                    促销售出 <span className="font-semibold text-ink-600">{p.qty}</span> 件
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <button
          onClick={() => setShowOrders((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-ink-50/40 transition-colors"
        >
          <h3 className="font-display text-base font-semibold text-ink-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-ink-500" />
            全部订单明细 <span className="badge badge-gold ml-2">{filteredOrders.length} 笔</span>
          </h3>
          <ChevronDown className={`w-5 h-5 text-ink-400 transition-transform ${showOrders ? 'rotate-180' : ''}`} />
        </button>
        {showOrders && (
          <div className="overflow-x-auto border-t border-ink-100">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-sm text-ink-400">暂无订单记录</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-ink-50/60">
                  <tr className="text-ink-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-medium">订单时间</th>
                    <th className="text-left px-5 py-3 font-medium">商品</th>
                    <th className="text-left px-5 py-3 font-medium">会员</th>
                    <th className="text-left px-5 py-3 font-medium">使用活动</th>
                    <th className="text-right px-5 py-3 font-medium">原价</th>
                    <th className="text-right px-5 py-3 font-medium">优惠</th>
                    <th className="text-right px-5 py-3 font-medium">实付</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filteredOrders.slice(0, 50).map((o) => (
                    <OrderRow key={o.id} order={o} />
                  ))}
                </tbody>
              </table>
            )}
            {filteredOrders.length > 50 && (
              <div className="px-5 py-3 bg-ink-50/50 text-center text-xs text-ink-400 border-t border-ink-100">
                仅显示最近 50 条，共 {filteredOrders.length} 条记录
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <tr className="hover:bg-ink-50/30 transition-colors">
      <td className="px-5 py-3 text-ink-600 text-xs whitespace-nowrap">
        {formatDate(order.createdAt)}
        <div className="text-[10px] text-ink-400 font-mono mt-0.5">#{order.id.slice(0, 8).toUpperCase()}</div>
      </td>
      <td className="px-5 py-3 text-ink-700 max-w-[260px]">
        <div className="space-y-0.5">
          {order.items.map((it, i) => (
            <div key={i} className="text-xs leading-snug">
              <span className="font-medium">{it.name}</span>
              <span className="text-ink-400"> × {it.quantity}</span>
            </div>
          ))}
        </div>
      </td>
      <td className="px-5 py-3">
        {order.isMember ? (
          <span className="badge badge-gold">会员</span>
        ) : (
          <span className="badge badge-disabled">散客</span>
        )}
      </td>
      <td className="px-5 py-3">
        {order.appliedPromotionId ? (
          <span className="badge badge-enabled">{order.appliedPromotionName}</span>
        ) : (
          <span className="badge badge-disabled">无活动</span>
        )}
      </td>
      <td className="px-5 py-3 text-right text-ink-500">{formatMoney(order.originalAmount)}</td>
      <td className="px-5 py-3 text-right text-rosegold-500 font-medium">
        -{formatMoney(order.discountAmount)}
      </td>
      <td className="px-5 py-3 text-right">
        <span className="font-display font-bold text-champagne-600">{formatMoney(order.finalAmount)}</span>
      </td>
    </tr>
  );
}
