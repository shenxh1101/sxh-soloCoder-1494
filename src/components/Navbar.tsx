import { NavLink } from 'react-router-dom';
import { Calculator, Tag, BarChart3, Sparkles } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b border-ink-100/70">
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-champagne-300 via-rosegold-300 to-rosegold-400 flex items-center justify-center shadow-card">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <h1 className="text-xl font-bold text-ink-800 font-display tracking-wide">衣悦</h1>
              <p className="text-[11px] text-ink-400 -mt-0.5">服装店促销管理助手</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 p-1 rounded-xl bg-ink-50/80 border border-ink-100">
            <NavLink to="/checkout" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">结账台</span>
            </NavLink>
            <NavLink to="/promotions" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">活动管理</span>
            </NavLink>
            <NavLink to="/statistics" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">数据统计</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
