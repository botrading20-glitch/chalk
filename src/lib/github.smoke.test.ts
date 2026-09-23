// Opt-in check of the sync engine against the real GitHub API. Point it at a
// private repository you don't mind receiving (and then losing) a data/ folder:
//   CHALK_SMOKE_REPO=owner/name CHALK_SMOKE_TOKEN=<token> npx vitest run github.smoke
import { afterAll, describe, expect, it } from 'vitest';
import { githubRemote, type RepoRef } from './github';
import { recKey, SyncConflict, syncOnce, type LocalStore, type Rec, type SyncState } from './syncCore';

const token = process.env.CHALK_SMOKE_TOKEN;
const [owner, repo] = (process.env.CHALK_SMOKE_REPO ?? '/').split('/');
const ref: RepoRef = { owner, repo, token: token ?? '' };

class Device implements LocalStore {
  recs = new Map<string, Rec>();
  state?: SyncState;
  async read() {
    return new Map([...this.recs].map(([k, v]) => [k, structuredClone(v)]));
  }
  async apply(puts: Map<string, Rec>, deletes: string[]) {
    puts.forEach((r, k) => this.recs.set(k, structuredClone(r)));
    deletes.forEach((k) => this.recs.delete(k));
  }
  async sync() {
    const res = await syncOnce(this, githubRemote(ref), this.state, 'Smoke test');
    this.state = res.state;
    return res;
  }
}

describe.skipIf(!token)('GitHub sync (live)', () => {
  afterAll(async () => {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
    const list = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data`, { headers });
    if (!list.ok) return;
    for (const f of (await list.json()) as { path: string; sha: string }[]) {
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${f.path}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ message: 'Remove smoke-test data', sha: f.sha }),
      });
    }
  });

  it('round-trips data between two devices', { timeout: 120_000 }, async () => {
    const phone = new Device();
    for (let i = 0; i < 20; i++) {
      phone.recs.set(recKey('workouts', `w${i}`), {
        id: `w${i}`,
        title: i === 0 ? 'Séance pectoraux 💪' : `Workout ${i}`,
        startTime: 1_700_000_000_000 + i * 86_400_000,
        endTime: 1_700_000_000_000 + i * 86_400_000 + 3_600_000,
        exercises: [],
        exerciseIds: [],
      });
    }
    phone.recs.set(recKey('settings', 'settings'), { id: 'settings', weightUnit: 'kg' });
    const first = await phone.sync();
    expect(first.pushed).toBeGreaterThan(5);

    const pc = new Device();
    const pulled = await pc.sync();
    expect(pulled.received).toBe(21);
    expect(pc.recs.get(recKey('workouts', 'w0'))?.title).toBe('Séance pectoraux 💪');

    pc.recs.set(recKey('workouts', 'w1'), { ...pc.recs.get(recKey('workouts', 'w1'))!, title: 'Edited on PC' });
    pc.recs.delete(recKey('workouts', 'w2'));
    expect((await pc.sync()).pushed).toBeGreaterThan(0);
    expect((await phone.sync()).received).toBe(2);
    expect(phone.recs.get(recKey('workouts', 'w1'))?.title).toBe('Edited on PC');
    expect(phone.recs.has(recKey('workouts', 'w2'))).toBe(false);

    expect(await phone.sync()).toMatchObject({ received: 0, pushed: 0 });
  });

  it('reports stale writes as conflicts', { timeout: 60_000 }, async () => {
    const remote = githubRemote(ref);
    const listing = await remote.list();
    const shard = [...listing.keys()][0];
    await expect(remote.write(shard, '{}', '0000000000000000000000000000000000000000', 'stale')).rejects.toBeInstanceOf(SyncConflict);
    await expect(remote.write(shard, '{}', undefined, 'missing sha')).rejects.toBeInstanceOf(SyncConflict);
  });
});
