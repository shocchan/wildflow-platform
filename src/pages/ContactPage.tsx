import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { SITE_CONFIG } from '../config/site';

type Status = 'idle' | 'sending' | 'success' | 'error';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: { name, email, message },
      });
      if (error) throw error;
      setStatus('success');
    } catch (err) {
      console.error(err);
      setErrorMsg('送信に失敗しました。しばらく経ってから再度お試しください。');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <main className="max-w-2xl md:max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-24 text-center">
        <div className="text-5xl mb-6">🐾</div>
        <h1 className="text-2xl font-black mb-4" style={{ color: '#1C2A1E' }}>
          お問い合わせを受け付けました
        </h1>
        <p className="leading-relaxed mb-8" style={{ color: '#4A6550', fontSize: '16px' }}>
          3営業日以内にご返信いたします。<br />
          自動返信メールが届かない場合は迷惑メールフォルダをご確認ください。
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#2D8F4E' }}
        >
          トップページへ戻る
        </a>
      </main>
    );
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border outline-none text-sm transition-colors';
  const inputStyle = { borderColor: '#E2E8E4', backgroundColor: '#FFFFFF', color: '#1C2A1E' };

  return (
    <main className="max-w-2xl md:max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-16">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#2D8F4E' }}>
        CONTACT
      </p>
      <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ color: '#1C2A1E' }}>
        お問い合わせ
      </h1>
      <p className="text-sm mb-10" style={{ color: '#4A6550' }}>
        レッスンのご質問・コラボ・その他、お気軽にどうぞ。3営業日以内にご返信します。
      </p>

      <div
        className="rounded-2xl border p-6 md:p-8"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* お名前 */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C2A1E' }}>
              お名前 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="山田 花子"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C2A1E' }}>
              メールアドレス <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* お問い合わせ内容 */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1C2A1E' }}>
              お問い合わせ内容 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              required
              rows={6}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="レッスンについて教えてください..."
              className={`${inputClass} resize-none`}
              style={inputStyle}
            />
          </div>

          {/* エラー */}
          {status === 'error' && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}
            >
              {errorMsg}
            </div>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full py-3.5 rounded-xl font-bold text-white transition-opacity"
            style={{
              backgroundColor: status === 'sending' ? '#9CA3AF' : '#2D8F4E',
              cursor: status === 'sending' ? 'not-allowed' : 'pointer',
              fontSize: '16px',
            }}
          >
            {status === 'sending' ? '送信中...' : '送信する'}
          </button>
        </form>
      </div>

      {/* 直接連絡 */}
      <p className="text-sm text-center mt-6" style={{ color: '#9CA3AF' }}>
        または直接メールで：{' '}
        <a
          href={`mailto:${SITE_CONFIG.contactEmail}`}
          className="underline hover:opacity-70 transition-opacity"
          style={{ color: '#4A6550' }}
        >
          {SITE_CONFIG.contactEmail}
        </a>
      </p>
    </main>
  );
}
