import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Checkout from '@/pages/Checkout';
import Promotions from '@/pages/Promotions';
import Statistics from '@/pages/Statistics';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pb-16">
          <Routes>
            <Route path="/" element={<Navigate to="/checkout" replace />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="*" element={<Navigate to="/checkout" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-ink-100/60 bg-white/40 backdrop-blur-sm py-4">
          <div className="container max-w-6xl flex items-center justify-between text-xs text-ink-400">
            <span>衣悦 · 服装店促销管理助手</span>
            <span>数据自动保存至您的浏览器本地存储</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}
