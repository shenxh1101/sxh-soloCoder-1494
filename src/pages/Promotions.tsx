import { useState } from 'react';
import {
  Tag,
  ShoppingBag,
  Crown,
  Percent,
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Save,
  FolderUp,
  LayoutTemplate,
  Sparkles,
  Download,
  Trash,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  PROMOTION_TYPE_LABELS,
  type Promotion,
  type PromotionType,
  type PromotionConfig,
  type FullReduceConfig,
  type SecondHalfConfig,
  type MemberDiscountConfig,
  type FixedDiscountConfig,
} from '@/types';
import { discountPercent, formatDateShort } from '@/utils/format';
import Modal from '@/components/Modal';

const typeIconMap: Record<PromotionType, typeof Tag> = {
  full_reduce: Tag,
  second_half: ShoppingBag,
  member_discount: Crown,
  fixed_discount: Percent,
};

const typeColors: Record<PromotionType, string> = {
  full_reduce: 'bg-rosegold-50 text-rosegold-600 border-rosegold-100',
  second_half: 'bg-champagne-50 text-champagne-700 border-champagne-200',
  member_discount: 'bg-purple-50 text-purple-600 border-purple-100',
  fixed_discount: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

type Tab = 'active' | 'templates';

export default function Promotions() {
  const promotions = useStore((s) => s.promotions);
  const templates = useStore((s) => s.templates);
  const addPromotion = useStore((s) => s.addPromotion);
  const updatePromotion = useStore((s) => s.updatePromotion);
  const deletePromotion = useStore((s) => s.deletePromotion);
  const togglePromotion = useStore((s) => s.togglePromotion);
  const saveAsTemplate = useStore((s) => s.saveAsTemplate);
  const createFromTemplate = useStore((s) => s.createFromTemplate);
  const deleteTemplate = useStore((s) => s.deleteTemplate);

  const [tab, setTab] = useState<Tab>('active');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showSaveTpl, setShowSaveTpl] = useState<null | string>(null);
  const [tplName, setTplName] = useState('');
  const [expandId, setExpandId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    type: PromotionType;
    config: PromotionConfig;
    description: string;
  }>({
    name: '',
    type: 'full_reduce',
    config: { threshold: 300, reduce: 50, stackable: true } as FullReduceConfig,
    description: '',
  });

  function openCreate() {
    setEditingId(null);
    setForm({
      name: '',
      type: 'full_reduce',
      config: { threshold: 300, reduce: 50, stackable: true },
      description: '',
    });
    setShowEdit(true);
  }

  function openEdit(p: Promotion) {
    setEditingId(p.id);
    setForm({ name: p.name, type: p.type, config: p.config, description: p.description });
    setShowEdit(true);
  }

  function changeType(type: PromotionType) {
    let config: PromotionConfig;
    switch (type) {
      case 'full_reduce':
        config = { threshold: 300, reduce: 50, stackable: true };
        break;
      case 'second_half':
        config = { applyTo: 'cheapest' };
        break;
      case 'member_discount':
        config = { discount: 0.9 };
        break;
      case 'fixed_discount':
        config = { discount: 0.85, threshold: undefined };
        break;
    }
    setForm((f) => ({ ...f, type, config }));
  }

  function submitForm() {
    if (!form.name.trim()) return;
    if (editingId) {
      updatePromotion(editingId, {
        name: form.name,
        type: form.type,
        config: form.config,
        description: form.description,
      });
    } else {
      addPromotion({
        name: form.name,
        type: form.type,
        config: form.config,
        description: form.description,
      });
    }
    setShowEdit(false);
  }

  function doSaveTpl() {
    if (showSaveTpl) {
      saveAsTemplate(showSaveTpl, tplName.trim() || '未命名模板');
      setShowSaveTpl(null);
      setTplName('');
    }
  }

  function doFromTpl(tplId: string) {
    const newP = createFromTemplate(tplId);
    openEdit(newP);
    setTab('active');
  }

  function exportTemplate(id: string) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    const data = JSON.stringify(tpl, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tpl_${tpl.name.replace(/[^\w\u4e00-\u9fa5]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function ruleSummary(type: PromotionType, config: PromotionConfig): string {
    switch (type) {
      case 'full_reduce': {
        const c = config as FullReduceConfig;
        return `满¥${c.threshold}减¥${c.reduce}${c.stackable ? '（可叠加）' : ''}`;
      }
      case 'second_half': {
        const c = config as SecondHalfConfig;
        return c.applyTo === 'cheapest' ? '任意搭配，低价款半价' : '同款第二件半价';
      }
      case 'member_discount': {
        const c = config as MemberDiscountConfig;
        return `会员${discountPercent(c.discount)}`;
      }
      case 'fixed_discount': {
        const c = config as FixedDiscountConfig;
        return c.threshold ? `满¥${c.threshold}${discountPercent(c.discount)}` : `全场${discountPercent(c.discount)}`;
      }
    }
  }

  return (
    <div className="container max-w-6xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-800 flex items-center gap-2">
            <Tag className="w-6 h-6 text-rosegold-500" />
            活动管理
          </h2>
          <p className="text-sm text-ink-500 mt-1">创建活动规则、启停活动、保存模板方便复用</p>
        </div>
        {tab === 'active' && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            新建活动
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-5 p-1 rounded-xl bg-ink-50/80 border border-ink-100 w-fit">
        <button
          onClick={() => setTab('active')}
          className={`tab-btn ${tab === 'active' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          <LayoutTemplate className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          活动规则 ({promotions.length})
        </button>
        <button
          onClick={() => setTab('templates')}
          className={`tab-btn ${tab === 'templates' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          <Save className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          模板仓库 ({templates.length})
        </button>
      </div>

      {tab === 'active' ? (
        promotions.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-ink-50 flex items-center justify-center mb-4">
              <LayoutTemplate className="w-8 h-8 text-ink-300" />
            </div>
            <p className="text-ink-500 text-sm mb-4">还没有活动规则</p>
            <button onClick={openCreate} className="btn-outline">
              <Plus className="w-4 h-4" />
              创建第一个活动
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promotions.map((p) => {
              const Icon = typeIconMap[p.type];
              const expanded = expandId === p.id;
              return (
                <div key={p.id} className={`card card-hover overflow-hidden ${p.enabled ? '' : 'opacity-70'}`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${typeColors[p.type]}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-semibold text-ink-800 truncate">{p.name}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`badge ${p.enabled ? 'badge-enabled' : 'badge-disabled'}`}>
                              {p.enabled ? '启用中' : '已停用'}
                            </span>
                            <span className="text-xs text-ink-400">
                              {PROMOTION_TYPE_LABELS[p.type]}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePromotion(p.id)}
                        className={`p-2 rounded-lg transition ${
                          p.enabled
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-ink-400 hover:bg-ink-100'
                        }`}
                        title={p.enabled ? '点击停用' : '点击启用'}
                      >
                        {p.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                    </div>

                    <div
                      className={`px-3 py-2.5 rounded-lg ${
                        p.enabled ? 'bg-champagne-50/60 border border-champagne-100' : 'bg-ink-50 border border-ink-100'
                      } mb-3`}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
                        <Sparkles className="w-3.5 h-3.5 text-champagne-500" />
                        {ruleSummary(p.type, p.config)}
                      </div>
                    </div>

                    {p.description && (
                      <p className="text-xs text-ink-500 mb-3 line-clamp-2">{p.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                      <span className="text-xs text-ink-400">创建于 {formatDateShort(p.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setExpandId(expanded ? null : p.id)}
                          className="p-2 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-50"
                          title="展开参数"
                        >
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setShowSaveTpl(p.id)}
                          className="p-2 rounded-lg text-champagne-600 hover:bg-champagne-50"
                          title="保存为模板"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg text-rosegold-500 hover:bg-rosegold-50"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('确定删除此活动规则？')) deletePromotion(p.id);
                          }}
                          className="p-2 rounded-lg text-ink-400 hover:text-rosegold-600 hover:bg-rosegold-50"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-3 p-3 rounded-lg bg-ink-50 border border-ink-100 animate-slide-up">
                        <pre className="text-xs text-ink-600 font-mono whitespace-pre-wrap break-all">
                          {JSON.stringify(p.config, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : templates.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-ink-50 flex items-center justify-center mb-4">
            <Save className="w-8 h-8 text-ink-300" />
          </div>
          <p className="text-ink-500 text-sm">还没有保存任何模板</p>
          <p className="text-xs text-ink-400 mt-1">在活动列表中点击「保存」图标可将规则打包为模板</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const Icon = typeIconMap[t.type];
            return (
              <div key={t.id} className="card card-hover overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${typeColors[t.type]}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-semibold text-ink-800 truncate">{t.name}</h4>
                      <span className="badge badge-gold mt-1">
                        {PROMOTION_TYPE_LABELS[t.type]}
                      </span>
                    </div>
                  </div>

                  <div className="px-3 py-2 rounded-lg bg-ink-50 border border-ink-100 mb-3">
                    <div className="text-xs font-semibold text-ink-600">{ruleSummary(t.type, t.config)}</div>
                  </div>

                  {t.description && (
                    <p className="text-xs text-ink-500 mb-3 line-clamp-2">{t.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                    <span className="text-xs text-ink-400">保存于 {formatDateShort(t.savedAt)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => exportTemplate(t.id)}
                        className="p-2 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-50"
                        title="导出JSON"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => doFromTpl(t.id)}
                        className="btn-primary !py-1.5 !px-3 text-xs"
                      >
                        <FolderUp className="w-3.5 h-3.5" />
                        复用
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('确定删除此模板？')) deleteTemplate(t.id);
                        }}
                        className="p-2 rounded-lg text-ink-400 hover:text-rosegold-600 hover:bg-rosegold-50"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title={editingId ? '编辑活动规则' : '新建活动规则'}
        size="lg"
        footer={
          <>
            <button onClick={() => setShowEdit(false)} className="btn-ghost">
              取消
            </button>
            <button onClick={submitForm} className="btn-primary">
              {editingId ? '保存修改' : '创建活动'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">活动名称</label>
            <input
              className="input"
              placeholder="例：618大促 满300减50"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">活动类型</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {(Object.keys(PROMOTION_TYPE_LABELS) as PromotionType[]).map((t) => {
                const Icon = typeIconMap[t];
                const selected = form.type === t;
                return (
                  <button
                    key={t}
                    onClick={() => changeType(t)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-champagne-400 bg-champagne-50/60 shadow-gold'
                        : 'border-ink-200 bg-white hover:border-rosegold-200'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        selected ? typeColors[t] : 'bg-ink-100 text-ink-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className={`text-sm font-semibold ${selected ? 'text-champagne-700' : 'text-ink-700'}`}>
                      {PROMOTION_TYPE_LABELS[t]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1">
            <div className="h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent mb-4" />
            <label className="label">规则参数</label>
            {form.type === 'full_reduce' && (
              <ConfigFullReduce
                value={form.config as FullReduceConfig}
                onChange={(c) => setForm((f) => ({ ...f, config: c }))}
              />
            )}
            {form.type === 'second_half' && (
              <ConfigSecondHalf
                value={form.config as SecondHalfConfig}
                onChange={(c) => setForm((f) => ({ ...f, config: c }))}
              />
            )}
            {form.type === 'member_discount' && (
              <ConfigMemberDiscount
                value={form.config as MemberDiscountConfig}
                onChange={(c) => setForm((f) => ({ ...f, config: c }))}
              />
            )}
            {form.type === 'fixed_discount' && (
              <ConfigFixedDiscount
                value={form.config as FixedDiscountConfig}
                onChange={(c) => setForm((f) => ({ ...f, config: c }))}
              />
            )}
          </div>

          <div>
            <label className="label">活动描述（可选）</label>
            <textarea
              rows={2}
              className="input resize-none"
              placeholder="备注说明，如：活动仅限正价商品参与"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!showSaveTpl}
        onClose={() => setShowSaveTpl(null)}
        title="保存为模板"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowSaveTpl(null)} className="btn-ghost">
              取消
            </button>
            <button onClick={doSaveTpl} className="btn-primary">
              <Save className="w-4 h-4" />
              保存
            </button>
          </>
        }
      >
        <div>
          <label className="label">模板名称</label>
          <input
            className="input"
            placeholder="例：双11满减活动模板"
            autoFocus
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSaveTpl()}
          />
          <p className="text-xs text-ink-400 mt-2">
            保存后可在「模板仓库」中一键复用，活动规则将打包下载本地
          </p>
        </div>
      </Modal>
    </div>
  );
}

function ConfigFullReduce({
  value,
  onChange,
}: {
  value: FullReduceConfig;
  onChange: (c: FullReduceConfig) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label className="label">满多少金额（¥）</label>
        <input
          type="number"
          className="input"
          value={value.threshold}
          onChange={(e) => onChange({ ...value, threshold: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <div>
        <label className="label">减多少金额（¥）</label>
        <input
          type="number"
          className="input"
          value={value.reduce}
          onChange={(e) => onChange({ ...value, reduce: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 p-2.5 rounded-lg bg-ink-50 border border-ink-200 cursor-pointer hover:bg-white transition w-full">
          <input
            type="checkbox"
            checked={!!value.stackable}
            onChange={(e) => onChange({ ...value, stackable: e.target.checked })}
            className="w-4 h-4 text-champagne-500 rounded focus:ring-champagne-400"
          />
          <span className="text-sm text-ink-700">可叠加（满600减100…）</span>
        </label>
      </div>
    </div>
  );
}

function ConfigSecondHalf({
  value,
  onChange,
}: {
  value: SecondHalfConfig;
  onChange: (c: SecondHalfConfig) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {(['cheapest', 'same_price'] as const).map((opt) => (
        <label
          key={opt}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            value.applyTo === opt
              ? 'border-champagne-400 bg-champagne-50/60'
              : 'border-ink-200 hover:border-rosegold-200 bg-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              checked={value.applyTo === opt}
              onChange={() => onChange({ applyTo: opt })}
              className="mt-0.5 text-champagne-500"
            />
            <div>
              <div className="text-sm font-semibold text-ink-800">
                {opt === 'cheapest' ? '任意搭配，低价款半价' : '同款商品第二件半价'}
              </div>
              <div className="text-xs text-ink-500 mt-1">
                {opt === 'cheapest'
                  ? '例：买¥399 + ¥199，¥199那件半价省¥99.5'
                  : '例：同款T恤2件，第二件半价'}
              </div>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}

function ConfigMemberDiscount({
  value,
  onChange,
}: {
  value: MemberDiscountConfig;
  onChange: (c: MemberDiscountConfig) => void;
}) {
  const pct = Math.round(value.discount * 10);
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="label">折扣力度</label>
          <input
            type="range"
            min={5}
            max={9.9}
            step={0.1}
            value={pct}
            onChange={(e) => onChange({ discount: parseFloat(e.target.value) / 10 })}
            className="w-full accent-champagne-500"
          />
        </div>
        <div className="w-28">
          <label className="label">折数</label>
          <input
            type="number"
            min={1}
            max={10}
            step={0.1}
            value={pct}
            onChange={(e) => onChange({ discount: (parseFloat(e.target.value) || 9) / 10 })}
            className="input"
          />
        </div>
      </div>
      <div className="text-sm text-champagne-600 bg-champagne-50 border border-champagne-100 rounded-lg px-3 py-2">
        会员结算时可享受 {pct} 折优惠
      </div>
    </div>
  );
}

function ConfigFixedDiscount({
  value,
  onChange,
}: {
  value: FixedDiscountConfig;
  onChange: (c: FixedDiscountConfig) => void;
}) {
  const pct = Math.round(value.discount * 10);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">折扣力度（折数）</label>
          <input
            type="number"
            min={1}
            max={10}
            step={0.1}
            value={pct}
            onChange={(e) => onChange({ ...value, discount: (parseFloat(e.target.value) || 8) / 10 })}
            className="input"
          />
        </div>
        <div>
          <label className="label">消费门槛（¥，可选）</label>
          <input
            type="number"
            placeholder="0 表示无门槛"
            value={value.threshold ?? ''}
            onChange={(e) => {
              const v = e.target.value ? parseFloat(e.target.value) : undefined;
              onChange({ ...value, threshold: v });
            }}
            className="input"
          />
        </div>
      </div>
      <div className="text-sm text-champagne-600 bg-champagne-50 border border-champagne-100 rounded-lg px-3 py-2">
        {value.threshold
          ? `消费满 ¥${value.threshold} 享受 ${pct} 折`
          : `全场无门槛 ${pct} 折优惠`}
      </div>
    </div>
  );
}
