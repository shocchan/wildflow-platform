#!/usr/bin/env python3
"""
静的HTML（public/*.html）の中国語版を public/zh/ に生成する。2026-09-19。

  python3 scripts/build-zh-pages.py          # 生成 + 未翻訳の残りを表示
  python3 scripts/build-zh-pages.py --check  # 生成せず、未翻訳の残りだけ表示（CI 用）

やること
  1. scripts/zh/<page>.json（日本語 → 中国語の対応表）で、テキストノードと alt/aria-label/title/meta を置換
  2. <html lang="zh-CN">、canonical/hreflang/og:url/og:locale を zh 用に
  3. サイト内リンク（/badminton 等）を /zh/ 配下へ。言語切替の「中文」を on に
  4. 置換できなかった日本語（ひらがな・カタカナを含む文字列）を一覧で出す（翻訳漏れの検知）

生成物（public/zh/*.html）はコミットする。ビルド時には走らせない（決定的に保つため）。
日本語ページを直したら、対応表を足してこのスクリプトを再実行すること。
"""
import json, re, sys, html, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
DICT = ROOT / 'scripts' / 'zh'
PAGES = ['badminton', 'beginner', 'routine', 'about-animalflow']
STATIC_LINKS = ['/badminton', '/beginner', '/routine', '/about-animalflow']

JA_RE = re.compile(r'[぀-ヿ]')  # ひらがな・カタカナ（漢字だけの語は中国語でも使うので対象外）


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s).strip()


def translate_page(name: str, check_only: bool) -> list[str]:
    src = (PUBLIC / f'{name}.html').read_text(encoding='utf-8')
    table = json.loads((DICT / f'{name}.json').read_text(encoding='utf-8'))
    table = {norm(k): v for k, v in table.items()}
    missing: list[str] = []
    used: set[str] = set()

    def tr(text: str) -> str:
        key = norm(html.unescape(text))
        if key in table:
            used.add(key)
            # 元のインデント（先頭の空白）は残す
            lead = re.match(r'\s*', text).group(0)
            tail = re.search(r'\s*$', text).group(0)
            return lead + html.escape(table[key], quote=False).replace('&#x27;', "'") + tail
        if JA_RE.search(key) and key not in missing:
            missing.append(key)
        return text

    head, body = src.split('<body>', 1)

    # --- body: テキストノード（<script> と <style> の中は触らない）
    parts = re.split(r'(<script.*?</script>)', body, flags=re.S)
    for i, part in enumerate(parts):
        if part.startswith('<script'):
            # script 内は JS 文字列として入っている表示文言だけ、辞書のキーをそのまま置換する
            for k, v in table.items():
                if k in part:
                    used.add(k); part = part.replace(k, v)
            parts[i] = part
            continue
        parts[i] = re.sub(r'>([^<>]+)<', lambda m: '>' + tr(m.group(1)) + '<', part)
    body = ''.join(parts)

    # --- 属性（alt / aria-label / title / data-alt / placeholder）
    def attr(m):
        return f'{m.group(1)}="{tr(m.group(2))}"'
    body = re.sub(r'\b(alt|aria-label|title|data-alt|placeholder)="([^"]*)"', attr, body)
    head = re.sub(r'\b(content)="([^"]*)"', attr, head)
    head = re.sub(r'<title>([^<]+)</title>', lambda m: f'<title>{tr(m.group(1))}</title>', head)

    # --- head: lang / canonical / hreflang / og
    head = head.replace('<html lang="ja">', '<html lang="zh-CN">')
    for p in STATIC_LINKS:
        head = head.replace(f'href="https://wild-flow.com{p}"', f'href="https://wild-flow.com/zh{p}"')
        head = head.replace(f'content="https://wild-flow.com{p}"', f'content="https://wild-flow.com/zh{p}"')
    head = re.sub(r'<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?', '', head)
    head = head.replace('<link rel="canonical"', f'<link rel="alternate" hreflang="ja" href="https://wild-flow.com/{name}">\n<link rel="alternate" hreflang="zh" href="https://wild-flow.com/zh/{name}">\n<link rel="canonical"', 1)
    head = head.replace('content="ja_JP"', 'content="zh_CN"')
    # 生成物であることを先頭コメントに
    head = head.replace('<!doctype html>\n<!--', '<!doctype html>\n<!-- 自動生成: scripts/build-zh-pages.py（元: public/' + name + '.html）。直接編集せず、scripts/zh/' + name + '.json を直す -->\n<!--', 1)

    # --- body: サイト内リンクを /zh/ へ（アンカー・クエリ付きも）。SPA 側は ?lang=zh を付ける
    for p in STATIC_LINKS:
        body = re.sub(rf'href="{re.escape(p)}(?=[#"?])', f'href="/zh{p}', body)
    body = body.replace('href="/animalflow.html', 'href="/zh/beginner')  # zh 版が無いので入門へ
    body = re.sub(r'href="/(quiz/quick|lessons|blog|contact|quiz)(\?[^"]*)?"', lambda m: f'href="/{m.group(1)}{m.group(2) + "&" if m.group(2) else "?"}lang=zh"', body)
    body = body.replace('href="/"', 'href="/?lang=zh"')
    body = body.replace('kawabado.com/ja/', 'kawabado.com/zh/')
    # 言語切替の on/off
    body = re.sub(r'<span class="lang"><a class="on" href="/([^"]+)">日本語</a><a href="/zh/[^"]+">中文</a></span>',
                  lambda m: f'<span class="lang"><a href="/{m.group(1)}">日本語</a><a class="on" href="/zh/{m.group(1)}">中文</a></span>', body)

    out = head + '<body>' + body
    if not check_only:
        (PUBLIC / 'zh').mkdir(exist_ok=True)
        (PUBLIC / 'zh' / f'{name}.html').write_text(out, encoding='utf-8')
    unused = [k for k in table if k not in used]
    return missing + [f'(unused key) {u}' for u in unused]


def main():
    check = '--check' in sys.argv
    bad = 0
    for name in PAGES:
        issues = translate_page(name, check)
        if issues:
            bad += 1
            print(f'== {name}: {len(issues)} issue(s)')
            for s in issues:
                print('  -', s[:120])
        else:
            print(f'== {name}: ok')
    sys.exit(1 if (check and bad) else 0)


if __name__ == '__main__':
    main()
