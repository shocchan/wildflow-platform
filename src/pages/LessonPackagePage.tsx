import { useEffect, useState } from 'react';
import { fetchPublishedPackages, createPackageEntry } from '../services/packages';
import type { LessonPackage } from '../services/packages';
import { supabase } from '../services/supabaseClient';

type PageState = 'detail' | 'submitting' | 'done' | 'error';

const ABILITY_LABELS: Record<string, string> = {
  strength: '💪 筋力',
  endurance: '🫀 持久力',
  speed: '⚡ 敏捷性',
  flexibility: '🌊 柔軟性',
  coordination: '🎯 協調性',
};

export function LessonPackagePage() {
  const [pkg, setPkg] = useState<LessonPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageState, setPageState] = useState<PageState>('detail');
  const [errorMsg, setErrorMsg] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPublishedPackages()
      .then(pkgs => setPkg(pkgs[0] ?? null))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg) return;
    setPageState('submitting');

    try {
      const entry = await createPackageEntry({
        package_id: pkg.id,
        name,
        email,
        phone: phone || null,
        message: message || null,
      });

      await supabase.functions.invoke('send-lesson-payment-email', {
        body: {
          entryData: entry,
          lessonData: {
            title: pkg.name,
            date: '日程はメールでご連絡します',
            start_time: '',
            end_time: '',
            location: '埼玉県川口・蕨エリア',
            instructor: 'しょっちゃん',
            price: pkg.package_price,
            payment_deadline: null,
            paypay_id: pkg.paypay_id ?? 'shocchance',
          },
        },
      });

      setPageState('done');
    } catch (err) {
      console.error(err);
      setErrorMsg('申し込みに失敗しました。時間をおいて再度お試しください。');
      setPageState('error');
    }
  };

  if (loading) {
    return (
      <main className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-10">
        <div className="h-8 w-48 rounded animate-pulse mb-4" style={{ backgroundColor: '#E2E8E4' }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: '#E2E8E4' }} />
      </main>
    );
  }

  if (!pkg) {
    return (
      <main className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-10 text-center">
        <p className="text-4xl mb-3">🍃</p>
        <p className="font-bold" style={{ color: '#1C2A1E' }}>パッケージが見つかりませんでした</p>
        <a href="/lessons" className="mt-4 text-sm underline inline-block" style={{ color: '#2D8F4E' }}>
          レッスン一覧に戻る
        </a>
      </main>
    );
  }

  if (pageState === 'done') {
    return (
      <main className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-10 text-center">
        <div className="rounded-2xl border p-10" style={{ borderColor: '#E2E8E4', backgroundColor: '#fff' }}>
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-xl font-black mb-3" style={{ color: '#1C2A1E' }}>申し込みが完了しました！</h2>
          <p className="text-sm mb-2" style={{ color: '#5a7a62' }}>
            ご登録のメールアドレスに支払い案内をお送りしました。
          </p>
          <p className="text-sm mb-6" style={{ color: '#5a7a62' }}>
            ご不明な点は{' '}
            <a href="mailto:info@kawabado.com" style={{ color: '#2D8F4E', textDecoration: 'underline' }}>
              info@kawabado.com
            </a>{' '}
            までお気軽にご連絡ください。
          </p>
          <a
            href="/lessons"
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white inline-block"
            style={{ backgroundColor: '#2D8F4E' }}
          >
            レッスン一覧に戻る
          </a>
        </div>
      </main>
    );
  }

  const discount = Math.round((1 - pkg.package_price / pkg.original_price) * 100);

  return (
    <main className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-10">
      <a href="/lessons" className="text-sm mb-6 flex items-center gap-1 transition-colors" style={{ color: '#2D8F4E' }}>
        ← レッスン一覧に戻る
      </a>

      {/* パッケージ詳細 */}
      <div
        className="rounded-2xl border p-6 mb-8"
        style={{ borderColor: '#F59E0B', borderLeft: '4px solid #F59E0B', backgroundColor: '#fff' }}
      >
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="text-3xl">🐉</span>
          <h1 className="text-2xl font-black" style={{ color: '#1C2A1E' }}>{pkg.name}</h1>
          <span
            className="text-xs px-2 py-1 rounded-full font-bold text-white"
            style={{ backgroundColor: '#F59E0B' }}
          >
            {discount}% OFF
          </span>
        </div>

        {pkg.description && (
          <p className="text-sm leading-relaxed mb-5" style={{ color: '#5a7a62' }}>{pkg.description}</p>
        )}

        {/* 含まれるアビリティ */}
        <div className="mb-5">
          <p className="text-xs font-bold mb-2" style={{ color: '#5a7a62' }}>含まれるアビリティ</p>
          <div className="flex flex-wrap gap-2">
            {pkg.included_types.map(type => (
              <span
                key={type}
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#EDF7EE', color: '#2D8F4E', border: '1px solid #2D8F4E' }}
              >
                {ABILITY_LABELS[type] ?? type}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-sm" style={{ color: '#5a7a62' }}>
          <p>📍 場所：埼玉県川口・蕨エリア（詳細は別途ご連絡）</p>
          <p>👤 インストラクター：しょっちゃん</p>
          <div className="flex items-baseline gap-3 mt-2">
            <span className="line-through text-xs">通常 ¥{pkg.original_price.toLocaleString()}</span>
            <span className="font-black text-xl" style={{ color: '#D97706' }}>
              ¥{pkg.package_price.toLocaleString()}
            </span>
          </div>
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            💳 支払い方法：PayPay / WeChat Pay
          </p>
        </div>
      </div>

      {/* 申込フォーム */}
      <div className="rounded-2xl border p-6" style={{ borderColor: '#E2E8E4', backgroundColor: '#fff' }}>
        <h2 className="text-lg font-bold mb-5" style={{ color: '#1C2A1E' }}>申込フォーム</h2>
        {pageState === 'error' && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#5a7a62' }}>
              お名前 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
              style={{ borderColor: '#E2E8E4', color: '#1C2A1E', backgroundColor: '#F8F7F2' }}
              placeholder="山田 太郎"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#5a7a62' }}>
              メールアドレス <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
              style={{ borderColor: '#E2E8E4', color: '#1C2A1E', backgroundColor: '#F8F7F2' }}
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#5a7a62' }}>電話番号（任意）</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
              style={{ borderColor: '#E2E8E4', color: '#1C2A1E', backgroundColor: '#F8F7F2' }}
              placeholder="090-1234-5678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#5a7a62' }}>メッセージ（任意）</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm resize-none"
              style={{ borderColor: '#E2E8E4', color: '#1C2A1E', backgroundColor: '#F8F7F2' }}
              placeholder="ご質問・ご要望があればご記入ください"
            />
          </div>
          <button
            type="submit"
            disabled={pageState === 'submitting'}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
            style={{ backgroundColor: pageState === 'submitting' ? '#93c4a7' : '#D97706' }}
          >
            {pageState === 'submitting' ? '送信中...' : 'フルパックで申し込む'}
          </button>
        </form>
        <p className="text-xs mt-3 text-center" style={{ color: '#9ca3af' }}>
          申込後、PayPay / WeChat Pay のお支払い案内メールをお送りします。
        </p>
      </div>
    </main>
  );
}
