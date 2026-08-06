// wild-flow Cloudflare Worker
// - 静的アセット配信(従来どおり。SPA fallback は wrangler.json の assets 設定)
// - /api/factory/generate: SNS企画工場のAI生成エンドポイント
//
// 認証: Supabase発行JWTを /auth/v1/user で検証(署名・有効期限・失効はSupabase側で判定)
//       → さらに pf_admins テーブルで管理者権限を確認。一般ユーザーは403。
// 制限: 1時間5回 / 24時間20回 / 同時実行1件 / 月間費用上限(pf_generation_jobsを根拠に判定)
// 費用: APIのusageから実測トークンで計算し、ジョブに記録する
//
// 必要な設定:
//   wrangler secret put ANTHROPIC_API_KEY
//   vars(任意): ANTHROPIC_MODEL_STANDARD / ANTHROPIC_MODEL_HIGH_QUALITY /
//               COST_LIMIT_MONTHLY_USD / COST_WARN_MONTHLY_USD

interface Env {
  ASSETS: Fetcher;
  ANTHROPIC_API_KEY?: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ANTHROPIC_MODEL_STANDARD?: string;
  ANTHROPIC_MODEL_HIGH_QUALITY?: string;
  COST_LIMIT_MONTHLY_USD?: string;
  COST_WARN_MONTHLY_USD?: string;
}

// ── モデルと単価(USD / 1Mトークン) ──────────────────────
// モデルIDは公式ドキュメント(platform.claude.com/docs/en/about-claude/models/overview)で確認済み。
// 環境変数で差し替え可能。単価は定価ベース(sonnet-5は2026-08-31まで$2/$10の導入価格だが、
// 費用見積もりは保守的に定価で計算する)。
const DEFAULT_MODEL_STANDARD = 'claude-sonnet-5';      // $3 in / $15 out per MTok
const DEFAULT_MODEL_HIGH = 'claude-opus-5';            // $5 in / $25 out per MTok
const MODEL_PRICES_PER_MTOK: Record<string, { input: number; output: number }> = {
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-opus-5': { input: 5, output: 25 },
};

// ── コスト・乱用ガード ──
const MAX_COUNT_PER_CALL = 10;      // 1リクエストの生成企画数上限
const MAX_TOKENS = 20000;           // 出力トークン上限
const MAX_BODY_BYTES = 200_000;     // リクエストボディ上限(不正な巨大プロンプト対策)
const MAX_PROMPT_CHARS = 60_000;    // プロンプト文字数上限
const LIMIT_PER_HOUR = 5;
const LIMIT_PER_DAY = 20;
const CONCURRENT_WINDOW_MIN = 10;   // この分数以内のprocessingジョブがあれば同時実行とみなす
const DEFAULT_COST_LIMIT = 30;      // 月間費用上限(USD)
const DEFAULT_COST_WARN = 20;       // 警告ライン(USD)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    // CORSヘッダは意図的に付けない: フロントは同一オリジン(wild-flow.com)から呼ぶ。
    // 他オリジンからのブラウザ呼び出しはCORSで遮断される。
  });

// ── Supabase REST ヘルパ(呼び出し元ユーザーのJWTで実行 → RLSが適用される) ──
async function sbGet(env: Env, jwt: string, pathWithQuery: string): Promise<unknown[]> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${pathWithQuery}`, {
    headers: { authorization: `Bearer ${jwt}`, apikey: env.SUPABASE_ANON_KEY },
  });
  if (!res.ok) throw new Error(`Supabase REST エラー (${res.status})`);
  return res.json();
}

async function sbPatch(env: Env, jwt: string, pathWithQuery: string, body: unknown): Promise<void> {
  await fetch(`${env.SUPABASE_URL}/rest/v1/${pathWithQuery}`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${jwt}`,
      apikey: env.SUPABASE_ANON_KEY,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
}

/**
 * 認証+認可。
 * 1) Authorization: Bearer <jwt> を Supabase /auth/v1/user に転送して検証
 *    (署名・issuer・有効期限・失効の判定はSupabase Authが行う。ローカルでの自前検証はしない)
 * 2) pf_admins に user_id が存在するかを確認(管理者のみ許可)
 * 戻り値: 認証済みなら { jwt, userId }。失敗時はResponseを返す。
 */
async function authorize(request: Request, env: Env): Promise<{ jwt: string; userId: string } | Response> {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return json({ error: '認証エラー: ログインしてください。' }, 401);
  }
  const jwt = auth.slice('Bearer '.length);
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { authorization: auth, apikey: env.SUPABASE_ANON_KEY },
  });
  if (!userRes.ok) {
    // 期限切れ・失効・不正署名はすべてここで401になる
    return json({ error: '認証エラー: セッションが無効です。再ログインしてください。' }, 401);
  }
  const user = (await userRes.json()) as { id?: string };
  if (!user.id) return json({ error: '認証エラー: ユーザー情報を取得できません。' }, 401);

  // 管理者権限の確認(pf_adminsは自分の行のみselect可能なRLS)
  const admins = await sbGet(env, jwt, `pf_admins?select=user_id&user_id=eq.${user.id}&limit=1`);
  if (admins.length === 0) {
    return json({ error: '権限エラー: このアカウントには企画工場の管理者権限がありません。' }, 403);
  }
  return { jwt, userId: user.id };
}

/** レート制限・費用上限チェック(pf_generation_jobs を根拠に判定。失敗ジョブも回数に含む) */
async function checkLimits(env: Env, jwt: string): Promise<{ ok: true; warn?: string } | Response> {
  const now = Date.now();
  const hourAgo = new Date(now - 3600_000).toISOString();
  const dayAgo = new Date(now - 24 * 3600_000).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const concurrentSince = new Date(now - CONCURRENT_WINDOW_MIN * 60_000).toISOString();

  const [hourJobs, dayJobs, processingJobs, monthJobs] = await Promise.all([
    sbGet(env, jwt, `pf_generation_jobs?select=id&created_at=gte.${hourAgo}`),
    sbGet(env, jwt, `pf_generation_jobs?select=id&created_at=gte.${dayAgo}`),
    sbGet(env, jwt, `pf_generation_jobs?select=id&status=eq.processing&updated_at=gte.${concurrentSince}`),
    sbGet(env, jwt, `pf_generation_jobs?select=estimated_cost_usd&created_at=gte.${monthStart}`),
  ]);

  if (processingJobs.length > 0) {
    return json({ error: '実行中の生成ジョブがあります。完了を待つか、10分後に再試行してください。' }, 429);
  }
  if (hourJobs.length >= LIMIT_PER_HOUR) {
    return json({ error: `1時間の生成上限(${LIMIT_PER_HOUR}回)に達しました。時間をおいて再試行してください。` }, 429);
  }
  if (dayJobs.length >= LIMIT_PER_DAY) {
    return json({ error: `24時間の生成上限(${LIMIT_PER_DAY}回)に達しました。明日再試行してください。` }, 429);
  }

  const monthCost = (monthJobs as { estimated_cost_usd: number | null }[])
    .reduce((sum, j) => sum + (j.estimated_cost_usd ?? 0), 0);
  const limit = Number(env.COST_LIMIT_MONTHLY_USD ?? DEFAULT_COST_LIMIT);
  const warnLine = Number(env.COST_WARN_MONTHLY_USD ?? DEFAULT_COST_WARN);
  if (monthCost >= limit) {
    return json({ error: `月間AI費用の上限($${limit})に達しました(今月$${monthCost.toFixed(2)})。来月まで生成を停止します。` }, 429);
  }
  return {
    ok: true,
    warn: monthCost >= warnLine
      ? `⚠️ 今月のAI費用が$${monthCost.toFixed(2)}に達しています(警告ライン$${warnLine}/上限$${limit})`
      : undefined,
  };
}

// 生成する企画1件のJSONスキーマ(structured outputsで型を保証)
const IDEA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    style: { type: 'string', enum: ['A', 'B', 'C'] },
    purpose_main: { type: 'string', enum: ['awareness', 'save', 'persona', 'trust'] },
    purpose_sub: { type: 'string' },
    pillar_main: { type: 'string' },
    pillar_sub: { type: 'array', items: { type: 'string' } },
    audience: { type: 'string' },
    concern: { type: 'string' },
    reason_to_watch: { type: 'string' },
    core_message: { type: 'string' },
    takeaway: { type: 'string' },
    hook_visual: { type: 'string' },
    hook_line: { type: 'string' },
    moves: { type: 'array', items: { type: 'string' } },
    camera_angles: { type: 'string' },
    comparison_footage: { type: 'string' },
    structure: { type: 'string' },
    talking_points: { type: 'array', items: { type: 'string' } },
    material_titles: { type: 'array', items: { type: 'string' } },
    needs_material: { type: 'boolean' },
    avoid_misunderstanding: { type: 'string' },
    safety_notes: { type: 'string' },
    closing_question: { type: 'string' },
    closing_style: { type: 'string' },
    comment_prompt: { type: 'string' },
    keywords: { type: 'array', items: { type: 'string' } },
    lesson_cta: { type: 'boolean' },
    lesson_cta_phrase: { type: 'string' },
    duration_sec: { type: 'integer' },
    shoot_difficulty: { type: 'integer' },
    edit_difficulty: { type: 'integer' },
    values_used: { type: 'array', items: { type: 'string' } },
    scores: {
      type: 'object',
      additionalProperties: false,
      properties: {
        target_clarity: { type: 'integer' },
        concern_specificity: { type: 'integer' },
        hook_strength: { type: 'integer' },
        visual_value: { type: 'integer' },
        takeaway_value: { type: 'integer' },
        originality: { type: 'integer' },
        brand_fit: { type: 'integer' },
        filmability: { type: 'integer' },
      },
      required: ['target_clarity', 'concern_specificity', 'hook_strength', 'visual_value',
        'takeaway_value', 'originality', 'brand_fit', 'filmability'],
    },
    primary_metric: { type: 'string' },
    repurpose: { type: 'string' },
    remake_note: { type: 'string' },
    fact_check_notes: { type: 'string' },
  },
  required: ['title', 'style', 'purpose_main', 'pillar_main', 'audience', 'concern',
    'reason_to_watch', 'core_message', 'takeaway', 'hook_visual', 'hook_line', 'moves',
    'camera_angles', 'structure', 'talking_points', 'needs_material', 'material_titles',
    'avoid_misunderstanding', 'safety_notes', 'closing_question', 'closing_style',
    'comment_prompt', 'keywords', 'lesson_cta', 'lesson_cta_phrase', 'duration_sec',
    'shoot_difficulty', 'edit_difficulty', 'values_used', 'scores', 'primary_metric',
    'repurpose', 'remake_note', 'fact_check_notes'],
} as const;

interface GenerateBody {
  count?: number;
  quality?: 'standard' | 'high';
  systemPrompt?: string;
  userPrompt?: string;
  job_id?: string;
}

async function handleGenerate(request: Request, env: Env): Promise<Response> {
  // ボディサイズ上限
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: 'リクエストが大きすぎます。' }, 413);
  }

  // 認証・認可を最初に行う(未認証者に設定状態を漏らさない)
  const authResult = await authorize(request, env);
  if (authResult instanceof Response) return authResult;
  const { jwt } = authResult;

  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'AI生成は現在休眠中です(ANTHROPIC_API_KEY未設定)。追加企画はClaude Codeセッションで生成する運用です。' }, 503);
  }

  const limitResult = await checkLimits(env, jwt);
  if (limitResult instanceof Response) return limitResult;

  let body: GenerateBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'リクエストボディが不正なJSONです。' }, 400);
  }
  const count = Math.min(Math.max(1, body.count ?? 8), MAX_COUNT_PER_CALL);
  if (!body.systemPrompt || !body.userPrompt || !body.job_id) {
    return json({ error: 'systemPrompt / userPrompt / job_id が必要です。' }, 400);
  }
  if (body.systemPrompt.length + body.userPrompt.length > MAX_PROMPT_CHARS) {
    return json({ error: 'プロンプトが長すぎます。素材・参考投稿の量を見直してください。' }, 400);
  }

  const quality: 'standard' | 'high' = body.quality === 'high' ? 'high' : 'standard';
  const model = quality === 'high'
    ? (env.ANTHROPIC_MODEL_HIGH_QUALITY ?? DEFAULT_MODEL_HIGH)
    : (env.ANTHROPIC_MODEL_STANDARD ?? DEFAULT_MODEL_STANDARD);

  const jobPath = `pf_generation_jobs?id=eq.${body.job_id}`;
  const fail = async (msg: string, status: number, extra?: Record<string, unknown>) => {
    await sbPatch(env, jwt, jobPath, { status: 'failed', error: msg, model });
    return json({ error: msg, ...extra }, status);
  };

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        system: [{ type: 'text', text: body.systemPrompt, cache_control: { type: 'ephemeral' } }],
        output_config: {
          format: {
            type: 'json_schema',
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: { ideas: { type: 'array', items: IDEA_SCHEMA } },
              required: ['ideas'],
            },
          },
        },
        messages: [{ role: 'user', content: `${body.userPrompt}\n\n生成する企画数: ${count}件` }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      // Anthropicのエラー種別ごとに分かりやすく(APIキーはログにも応答にも出さない)
      const hint = apiRes.status === 401 ? 'APIキーが不正です。'
        : apiRes.status === 429 ? 'Anthropic側のレート制限です。数分後に再試行してください。'
          : apiRes.status >= 500 ? 'Anthropic側の一時的な障害です。時間をおいて再試行してください。'
            : '';
      return await fail(`Anthropic APIエラー (${apiRes.status}) ${hint} ${errText.slice(0, 300)}`, 502);
    }

    const data = (await apiRes.json()) as {
      stop_reason?: string;
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    if (data.stop_reason === 'refusal') {
      return await fail('生成が拒否されました。プロンプト内容を見直してください。', 502);
    }
    const text = data.content?.find(b => b.type === 'text')?.text;
    if (!text) return await fail('AIの応答が空でした。', 502);

    let parsed: { ideas: unknown[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      // usageは記録しておく(課金は発生しているため)
      await sbPatch(env, jwt, jobPath, {
        status: 'failed', model,
        error: 'AI応答のJSONパースに失敗(課金は発生済み)',
        input_tokens: data.usage?.input_tokens ?? null,
        output_tokens: data.usage?.output_tokens ?? null,
        estimated_cost_usd: estimateCost(model, data.usage),
      });
      return json({ error: 'AI応答のJSONパースに失敗しました。再試行してください。' }, 502);
    }

    const cost = estimateCost(model, data.usage);
    await sbPatch(env, jwt, jobPath, {
      status: 'completed',
      model,
      input_tokens: data.usage?.input_tokens ?? null,
      output_tokens: data.usage?.output_tokens ?? null,
      estimated_cost_usd: cost,
      ideas_json: parsed.ideas,
    });

    return json({
      ideas: parsed.ideas,
      truncated: data.stop_reason === 'max_tokens',
      usage: data.usage,
      model,
      estimated_cost_usd: cost,
      cost_warning: limitResult.warn ?? null,
    });
  } catch (e) {
    return await fail(`内部エラー: ${e instanceof Error ? e.message : String(e)}`, 500);
  }
}

function estimateCost(model: string, usage?: { input_tokens?: number; output_tokens?: number }): number | null {
  const price = MODEL_PRICES_PER_MTOK[model];
  if (!price || !usage) return null;
  const cost = ((usage.input_tokens ?? 0) * price.input + (usage.output_tokens ?? 0) * price.output) / 1_000_000;
  return Math.round(cost * 10000) / 10000;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/factory/generate') {
      if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
      try {
        return await handleGenerate(request, env);
      } catch (e) {
        return json({ error: `内部エラー: ${e instanceof Error ? e.message : String(e)}` }, 500);
      }
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'not found' }, 404);
    const assetRes = await env.ASSETS.fetch(request);
    // staging(workers.dev)は検索エンジンにインデックスさせない(本番との重複コンテンツ防止)
    if (url.hostname.endsWith('.workers.dev')) {
      const res = new Response(assetRes.body, assetRes);
      res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return res;
    }
    return assetRes;
  },
};
