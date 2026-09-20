import { Link } from 'react-router-dom';
import { useLang, langPath } from '../i18n/lang';

const T = {
  ja: { title: 'このページ、床に落ちてました。', body: 'リンクが古いか、URLが少し違うようです。代わりに、ここから。', bad: '🏸 バドミントンをしている', beg: '🌱 運動は苦手・はじめて', quiz: '🐾 10問の身体チェック', home: 'トップへ戻る' },
  zh: { title: '这一页，掉在地板上了。', body: '链接可能过期了，或者网址有一点不对。从这里开始吧。', bad: '🏸 我打羽毛球', beg: '🌱 不擅长运动・零基础', quiz: '🐾 10题身体检查', home: '回到首页' },
};

export function NotFoundPage() {
  const lang = useLang();
  const t = T[lang];
  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-16 text-center">
      <img src="/img/shocchan/handstand.webp" alt="" width={370} height={320} className="wf-float mb-4" style={{ width: '180px', height: 'auto' }} />
      <p className="text-xs font-bold tracking-widest mb-2" style={{ color: '#2D8F4E', fontFamily: 'Sora, sans-serif' }}>404</p>
      <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ color: '#1C2A1E' }}>{t.title}</h1>
      <p className="mb-8 max-w-md" style={{ color: '#4A6550' }}>{t.body}</p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
        <a href={langPath('/badminton', lang)} className="flex-1 inline-flex items-center justify-center font-bold rounded-2xl px-5" style={{ backgroundColor: '#F5A623', color: '#1a3a2a', minHeight: '56px' }}>{t.bad}</a>
        <a href={langPath('/beginner', lang)} className="flex-1 inline-flex items-center justify-center font-bold rounded-2xl px-5" style={{ border: '2px solid #2D8F4E', color: '#1C2A1E', minHeight: '56px' }}>{t.beg}</a>
      </div>
      <p className="mt-5 flex flex-wrap justify-center gap-5 text-sm font-bold">
        <Link to="/quiz/quick" className="underline" style={{ color: '#2D8F4E' }}>{t.quiz}</Link>
        <Link to="/" className="underline" style={{ color: '#4A6550' }}>{t.home}</Link>
      </p>
    </main>
  );
}
