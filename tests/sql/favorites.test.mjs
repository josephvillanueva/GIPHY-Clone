import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Real Postgres permissions and RLS, with a minimal Supabase Auth fixture.
// Run: node --test tests/sql/favorites.test.mjs
const db = new PGlite();
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to authenticated;
  grant execute on function auth.uid() to authenticated;
  insert into auth.users values
    ('00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000002');
`);
const migrations = new URL('../../supabase/migrations/', import.meta.url);
for (const file of (await readdir(migrations)).filter(f => f.endsWith('.sql')).sort()) {
  await db.exec(await readFile(new URL(file, migrations), 'utf8'));
}
const a = '00000000-0000-0000-0000-000000000001';
const b = '00000000-0000-0000-0000-000000000002';
const login = async id => {
  await db.exec('reset role; set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
};
const count = async () => Number((await db.query('select count(*) as n from public.favorites')).rows[0].n);
try {
  await login(a);
  await db.query('insert into public.favorites(user_id, gif_id) values ($1, $2)', [a, 'Abc123']);
  await db.query('insert into public.favorites(user_id, gif_id) values ($1, $2) on conflict (user_id, gif_id) do nothing', [a, 'Abc123']);
  assert.equal(await count(), 1, 'duplicate favorite is idempotent without UPDATE privilege');
  assert.ok((await db.query('select created_at from public.favorites')).rows[0].created_at);
  for (const gif of ['', 'has-hyphen', 'x'.repeat(65), 'space id']) {
    await assert.rejects(db.query('insert into public.favorites(user_id, gif_id) values ($1, $2)', [a, gif]), e => e.code === '23514');
  }
  await assert.rejects(db.query('insert into public.favorites(user_id, gif_id) values ($1, $2)', [b, 'Forged']), e => e.code === '42501');
  await assert.rejects(db.exec("update public.favorites set gif_id = 'Changed'"), e => e.code === '42501');
  await login(b);
  assert.equal(await count(), 0, 'another user cannot read favorites');
  await db.exec('delete from public.favorites');
  await db.query('insert into public.favorites(user_id, gif_id) values ($1, $2)', [b, 'Abc123']);
  assert.equal(await count(), 1, 'same GIF can be saved by different users');
  await login(a);
  assert.equal(await count(), 1, 'cross-user delete leaves owner favorite intact');
  await db.exec('delete from public.favorites');
  assert.equal(await count(), 0, 'owner can delete favorite');
  await db.exec('reset role; set role anon');
  for (const sql of ['select * from public.favorites', 'delete from public.favorites', `insert into public.favorites(user_id,gif_id) values ('${a}', 'Anon')`]) {
    await assert.rejects(db.exec(sql), e => e.code === '42501');
  }
  await login('');
  assert.equal(await count(), 0, 'authenticated role without user identity sees nothing');
  await assert.rejects(db.query('insert into public.favorites(user_id,gif_id) values ($1,$2)', [a, 'NoIdentity']), e => e.code === '42501');
  await db.exec('reset role');
  await db.query('delete from auth.users where id = $1', [b]);
  assert.equal(await count(), 0, 'deleting auth user cascades favorites');
  console.log('Favorites permissions, RLS, validation, duplicate saves, and cascade checks passed.');
} finally {
  await db.close();
}
