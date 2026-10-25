import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { validateState } from '../storage.js';

const base = process.env.TEST_URL || 'http://127.0.0.1:8788';
if (!['localhost','127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Tests only run against a local Worker');
const fixture = validateState(JSON.parse(await fs.readFile(new URL('../data/personal-lmu-laptimes-2026-10-25.json', import.meta.url), 'utf8')));
const get = async () => { const response = await fetch(base + '/api/state'); assert.equal(response.status, 200); return response.json(); };
const put = (state, revision, headers = {}) => fetch(base + '/api/state', { method: 'PUT', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify({ state, revision }) });

const html = await fetch(base);
assert.equal(html.status, 200);
assert.match(await html.text(), /data-cloud-storage="d1"/);
assert.match(html.headers.get('content-security-policy'), /connect-src 'self'/);
assert.match(html.headers.get('cache-control'), /no-store/);

let current = await get();
let response = await put(fixture, current.revision);
assert.equal(response.status, 200, await response.text());
current = await get();
assert.equal(current.state.laps.length, 56);
assert.equal(current.state.custom.lmu.cars[0].n, 'Lexus RC F GT3');
assert.ok(current.state.laps.every(lap => lap.date === '' && lap.cond === 'Not recorded'));

response = await put(fixture, current.revision - 1);
assert.equal(response.status, 409);
assert.equal((await get()).revision, current.revision);
response = await put(fixture, current.revision, { origin: 'https://unrelated.example' });
assert.equal(response.status, 403);
assert.equal((await get()).revision, current.revision);

const broken = structuredClone(fixture);
broken.laps[0].date = '2026-02-30';
response = await put(broken, current.revision);
assert.equal(response.status, 400);
assert.equal((await get()).revision, current.revision);
assert.throws(() => validateState({ ...fixture, laps: [fixture.laps[0], fixture.laps[0]] }), /Duplicate/);

const left = structuredClone(fixture), right = structuredClone(fixture);
left.laps[0].notes = 'Concurrent writer A';
right.laps[0].notes = 'Concurrent writer B';
right.laps.pop();
right.custom.lmu.cars = [];
const race = await Promise.all([put(left, current.revision), put(right, current.revision)]);
assert.deepEqual(race.map(result => result.status).sort(), [200,409]);
const winner = await get();
assert.equal(winner.revision, current.revision + 1);
const expected = race[0].status === 200 ? left : right;
assert.equal(winner.state.laps.length, expected.laps.length);
assert.equal(winner.state.laps.find(lap => lap.id === fixture.laps[0].id).notes, expected.laps[0].notes);
assert.deepEqual(winner.state.custom, expected.custom);

const sqlLike = structuredClone(fixture);
sqlLike.laps[0].notes = "A quote: '); DROP TABLE laps; --";
response = await put(sqlLike, winner.revision);
assert.equal(response.status, 200);
current = await get();
assert.equal(current.state.laps.length, 56);
assert.equal(current.state.laps.find(lap => lap.id === fixture.laps[0].id).notes, sqlLike.laps[0].notes);
response = await put(fixture, current.revision);
assert.equal(response.status, 200);
console.log('PASS: private HTML headers, 56-lap round trip, unknown metadata, validation, cross-origin rejection, stale writes, concurrent writes, deletion isolation, parameter binding and fixture restore');
