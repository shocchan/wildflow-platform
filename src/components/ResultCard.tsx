import { useEffect, useRef, useState } from 'react';
import { TODAY_MOVE } from '../data/entryCopy';
import { useLang } from '../i18n/lang';
import { MESSAGES } from '../i18n/messages';
import { track } from '../services/analytics';
import type { Entry } from '../utils/entry';

type Ability = keyof typeof TODAY_MOVE;
const ORDER: Ability[] = ['strength', 'endurance', 'speed', 'flexibility', 'coordination'];

const T = {
  ja: { title: '📸 結果を画像で保存する', body: 'XHS・Instagram・LINE にそのまま貼れる縦長画像（1080×1350）。名前やメールは入りません。', btn: '画像を保存', hint: 'iPhone で保存されない場合は、画像を長押し →「写真に追加」', head: 'いま一番伸ばせる力は', today: '今日やる1動作', url: 'wild-flow.com/quiz/quick', quiz: '10問の身体チェック' },
  zh: { title: '📸 把结果保存为图片', body: '可直接发到小红书・Instagram・LINE 的竖版图片（1080×1350）。不含姓名和邮箱。', btn: '保存图片', hint: 'iPhone 上没保存的话，长按图片 →「添加到照片」', head: '现在最能提升的能力是', today: '今天做的1个动作', url: 'wild-flow.com/quiz/quick?lang=zh', quiz: '10题身体检查' },
};

const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

/**
 * 診断結果を 1080×1350 の画像に描き、保存できるようにする（2026-09-20）。
 * 個人情報は入れない（軸のスコアとイラストと URL だけ）。すべて端末内の Canvas で完結し、送信しない。
 */
export function ResultCard({ ability, scores, entry }: { ability: Ability; scores: Record<Ability, number>; entry: Entry }) {
  const lang = useLang();
  const t = T[lang];
  const m = MESSAGES[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const c = canvasRef.current; if (!c) return;
      const ctx = c.getContext('2d'); if (!ctx) return;
      const W = 1080, H = 1350; c.width = W; c.height = H;
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a3a2a'); g.addColorStop(1, '#0f261a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(820, 260, 0, 820, 260, 420); glow.addColorStop(0, 'rgba(245,166,35,.35)'); glow.addColorStop(1, 'rgba(245,166,35,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      const jp = '"Noto Sans JP","Hiragino Sans","PingFang SC",sans-serif';
      ctx.fillStyle = '#6fcf97'; ctx.font = `700 34px Sora,${jp}`; ctx.fillText('wildflow', 72, 100);
      ctx.fillStyle = '#C8E6CA'; ctx.font = `500 34px ${jp}`; ctx.fillText(t.head, 72, 190);
      ctx.fillStyle = '#F5A623'; ctx.font = `900 120px ${jp}`; ctx.fillText(m.abilities[ability], 64, 320);
      // illustration
      try { const im = await loadImg(`/img/shocchan/${TODAY_MOVE[ability].image}.webp`); if (!alive) return; const s = 460; ctx.drawImage(im, W - s - 40, 120, s, s * (im.height / im.width)); } catch { /* 画像が無くても続ける */ }
      // bars
      let y = 640;
      ctx.font = `700 30px ${jp}`;
      for (const ab of ORDER) {
        const v = scores[ab] ?? 0; const low = ab === ability;
        ctx.fillStyle = low ? '#F5A623' : '#EAF3E6'; ctx.fillText(m.abilities[ab], 72, y + 32);
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(300, y + 6, 620, 30);
        ctx.fillStyle = low ? '#F5A623' : '#2D8F4E'; ctx.fillRect(300, y + 6, 620 * v / 100, 30);
        ctx.fillStyle = '#EAF3E6'; ctx.textAlign = 'right'; ctx.fillText(String(v), 1008, y + 32); ctx.textAlign = 'left';
        y += 72;
      }
      // today move
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(72, 1030, 936, 150);
      ctx.fillStyle = '#6fcf97'; ctx.font = `700 26px ${jp}`; ctx.fillText(t.today, 100, 1078);
      ctx.fillStyle = '#FFFFFF'; ctx.font = `900 48px ${jp}`; ctx.fillText(`${TODAY_MOVE[ability].name}  ${TODAY_MOVE[ability].jp[lang]}`, 100, 1140);
      ctx.fillStyle = '#9DB6A0'; ctx.font = `700 30px Sora,${jp}`; ctx.fillText(t.url, 72, 1280);
      ctx.textAlign = 'right'; ctx.fillStyle = '#C8E6CA'; ctx.font = `500 26px ${jp}`; ctx.fillText(t.quiz, 1008, 1280); ctx.textAlign = 'left';
      try { setUrl(c.toDataURL('image/jpeg', 0.9)); } catch { /* noop */ }
    })();
    return () => { alive = false; };
  }, [ability, scores, lang, t, m]);

  return (
    <div className="p-5 rounded-2xl border mb-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}>
      <h2 className="text-base font-bold mb-1" style={{ color: '#1C2A1E' }}>{t.title}</h2>
      <p className="text-sm mb-3" style={{ color: '#4A6550' }}>{t.body}</p>
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 items-start">
        <canvas ref={canvasRef} className="w-full rounded-xl" style={{ border: '1px solid #E2E8E4', maxWidth: '180px', display: url ? 'none' : 'block' }} />
        {url && <img src={url} alt="" className="w-full rounded-xl" style={{ maxWidth: '180px', border: '1px solid #E2E8E4' }} />}
        <div>
          <a
            href={url || '#'}
            download={`wildflow-${ability}-${entry}.jpg`}
            onClick={() => track('save_result_image', { ability, entry, lang })}
            className="inline-flex items-center justify-center font-bold text-white rounded-xl px-6"
            style={{ backgroundColor: '#1C2A1E', minHeight: '48px', opacity: url ? 1 : .5, pointerEvents: url ? 'auto' : 'none' }}
          >
            {t.btn}
          </a>
          <p className="text-xs mt-2" style={{ color: '#4A6550' }}>{t.hint}</p>
        </div>
      </div>
    </div>
  );
}
