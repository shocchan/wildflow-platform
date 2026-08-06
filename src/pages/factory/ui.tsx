// 企画工場UI共通の小物コンポーネント
/* eslint-disable react-refresh/only-export-components -- 定数と小物UIを1ファイルに集約(HMR最適化より簡潔さ優先) */
import type { ReactNode } from 'react';

export const C = {
  text: '#1C2A1E',
  sub: '#4A6550',
  green: '#2D8F4E',
  border: '#E2E8E4',
  bg: '#F8F7F2',
  amber: '#F59E0B',
  red: '#DC2626',
};

export function Card({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4 mb-4" style={{ borderColor: C.border }}>
      {(title || right) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="font-bold" style={{ color: C.text }}>{title}</h3>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-2">
      <span className="block text-xs font-bold mb-1" style={{ color: C.sub }}>{label}</span>
      {children}
    </label>
  );
}

export const inputCls = 'w-full rounded-lg border px-2 py-1.5 text-sm';
export const inputStyle = { borderColor: C.border, color: C.text } as const;

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} style={inputStyle} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={2} {...props} className={inputCls} style={inputStyle} />;
}

export function Btn({ children, onClick, disabled, kind = 'primary', small }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean;
  kind?: 'primary' | 'ghost' | 'danger'; small?: boolean;
}) {
  const base = small ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm';
  const styles = kind === 'primary'
    ? { backgroundColor: C.green, color: '#fff' }
    : kind === 'danger'
      ? { backgroundColor: '#fff', color: C.red, border: `1px solid ${C.red}` }
      : { backgroundColor: '#fff', color: C.text, border: `1px solid ${C.border}` };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} rounded-lg font-bold disabled:opacity-40`} style={styles}>
      {children}
    </button>
  );
}

export function Tag({ children, color = C.green }: { children: ReactNode; color?: string }) {
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full mr-1 mb-1"
      style={{ backgroundColor: `${color}18`, color }}>
      {children}
    </span>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'error' }) {
  const color = tone === 'error' ? C.red : tone === 'warn' ? C.amber : C.green;
  return (
    <div className="rounded-lg border px-3 py-2 text-sm mb-3"
      style={{ borderColor: color, color, backgroundColor: `${color}0d` }}>
      {children}
    </div>
  );
}

/** 配列⇔改行テキストの変換(text[]編集用) */
export const toLines = (a: string[] | undefined) => (a ?? []).join('\n');
export const fromLines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean);
