import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <p className="text-8xl mb-4">🌊</p>
      <h1 className="text-4xl font-black text-white mb-2">404</h1>
      <p className="text-lg mb-8" style={{ color: '#94a3b8' }}>ページが見つかりません</p>
      <Link
        to="/"
        className="px-6 py-3 rounded-full font-bold text-white transition-all hover:opacity-80"
        style={{ backgroundColor: '#3b82f6' }}
      >
        ホームに戻る
      </Link>
    </main>
  );
}
