type Env = {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const parseList = (value: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const listText = (value: unknown) => JSON.stringify(Array.isArray(value) ? value : []);
const autoName = (heroes: string[]) => heroes.map((hero) => (hero || '').trim()[0] || '').join('');

const hasAdmin = (request: Request, env: Env) => {
  const password = request.headers.get('x-admin-password') || '';
  return password === (env.ADMIN_PASSWORD || '0070');
};

const ensureTables = async (db: D1Database) => {
  await db.prepare(`CREATE TABLE IF NOT EXISTS guild_enemy_decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    heroes TEXT NOT NULL,
    pets TEXT,
    memo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS guild_counter_decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enemy_id INTEGER NOT NULL,
    name TEXT,
    heroes TEXT NOT NULL,
    pets TEXT,
    skill_order TEXT,
    memo TEXT,
    is_recommended INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
};

const getData = async (db: D1Database) => {
  await ensureTables(db);
  const enemies = await db.prepare('SELECT * FROM guild_enemy_decks ORDER BY created_at DESC, id DESC').all();
  const counters = await db.prepare('SELECT * FROM guild_counter_decks ORDER BY is_recommended DESC, priority ASC, created_at DESC, id DESC').all();

  return {
    enemyDecks: (enemies.results || []).map((row: any) => ({
      id: String(row.id),
      name: row.name || '',
      heroes: parseList(row.heroes),
      pets: parseList(row.pets),
      memo: row.memo || '',
    })),
    counterDecks: (counters.results || []).map((row: any) => ({
      id: String(row.id),
      enemyDeckId: String(row.enemy_id),
      name: row.name || '',
      heroes: parseList(row.heroes),
      pets: parseList(row.pets),
      skillOrder: row.skill_order || '',
      memo: row.memo || '',
      isRecommended: row.is_recommended !== 0,
      priority: row.priority || 999,
    })),
  };
};

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    return json(await getData(env.DB));
  } catch (error) {
    return json({ message: 'D1 데이터를 불러오지 못했습니다.', error: String(error) }, 500);
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    await ensureTables(env.DB);
    const body: any = await request.json().catch(() => ({}));

    if (body.action === 'login') return json({ ok: hasAdmin(request, env) });
    if (!hasAdmin(request, env)) return json({ ok: false, message: '관리자 권한이 필요합니다.' }, 401);

    if (body.action === 'createEnemy') {
      const heroes = body.heroes || [];
      const pets = body.pets || [];
      await env.DB.prepare('INSERT INTO guild_enemy_decks (name, heroes, pets, memo) VALUES (?, ?, ?, ?)')
        .bind(body.name || autoName(heroes), listText(heroes), listText(pets), body.memo || '').run();
      return json({ ok: true, ...(await getData(env.DB)) });
    }

    if (body.action === 'updateEnemy') {
      const heroes = body.heroes || [];
      const pets = body.pets || [];
      await env.DB.prepare('UPDATE guild_enemy_decks SET name = ?, heroes = ?, pets = ?, memo = ? WHERE id = ?')
        .bind(body.name || autoName(heroes), listText(heroes), listText(pets), body.memo || '', body.id).run();
      return json({ ok: true, ...(await getData(env.DB)) });
    }

    if (body.action === 'deleteEnemy') {
      await env.DB.prepare('DELETE FROM guild_counter_decks WHERE enemy_id = ?').bind(body.id).run();
      await env.DB.prepare('DELETE FROM guild_enemy_decks WHERE id = ?').bind(body.id).run();
      return json({ ok: true, ...(await getData(env.DB)) });
    }

    if (body.action === 'createCounter') {
      const heroes = body.heroes || [];
      const pets = body.pets || [];
      await env.DB.prepare('INSERT INTO guild_counter_decks (enemy_id, name, heroes, pets, skill_order, memo, is_recommended, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(body.enemyDeckId, body.name || autoName(heroes), listText(heroes), listText(pets), body.skillOrder || '', body.memo || '', body.isRecommended === false ? 0 : 1, body.priority || 999).run();
      return json({ ok: true, ...(await getData(env.DB)) });
    }

    if (body.action === 'updateCounter') {
      const heroes = body.heroes || [];
      const pets = body.pets || [];
      await env.DB.prepare('UPDATE guild_counter_decks SET enemy_id = ?, name = ?, heroes = ?, pets = ?, skill_order = ?, memo = ?, is_recommended = ?, priority = ? WHERE id = ?')
        .bind(body.enemyDeckId, body.name || autoName(heroes), listText(heroes), listText(pets), body.skillOrder || '', body.memo || '', body.isRecommended === false ? 0 : 1, body.priority || 999, body.id).run();
      return json({ ok: true, ...(await getData(env.DB)) });
    }

    if (body.action === 'deleteCounter') {
      await env.DB.prepare('DELETE FROM guild_counter_decks WHERE id = ?').bind(body.id).run();
      return json({ ok: true, ...(await getData(env.DB)) });
    }

    return json({ ok: false, message: '알 수 없는 요청입니다.' }, 400);
  } catch (error) {
    return json({ ok: false, message: '요청 처리 중 오류가 발생했습니다.', error: String(error) }, 500);
  }
};
