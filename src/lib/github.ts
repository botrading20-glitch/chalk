// Minimal GitHub REST client for storing sync files in a private repository
// with a fine-grained personal access token (Contents: read & write).

import { SyncConflict, type RemoteStore } from './syncCore';

export interface RepoRef {
  owner: string;
  repo: string;
  token: string;
}

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const API = 'https://api.github.com';
const DIR = 'data';

async function call(ref: RepoRef, path: string, init: RequestInit & { accept?: string } = {}) {
  const { accept, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${API}/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}${path}`, {
      ...rest,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${ref.token}`,
        Accept: accept ?? 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch {
    throw new GitHubError("Couldn't reach GitHub. Check your connection.", 0);
  }
  return res;
}

function fail(res: Response): never {
  switch (res.status) {
    case 401:
      throw new GitHubError('GitHub rejected the access token. It may have expired or been revoked.', 401);
    case 403:
      if (res.headers.get('x-ratelimit-remaining') === '0') {
        throw new GitHubError('GitHub is rate-limiting requests. Sync will try again later.', 403);
      }
      throw new GitHubError('The access token can’t write to this repository. Give it “Contents: Read and write” access.', 403);
    case 404:
      throw new GitHubError('Repository not found, or the access token can’t see it.', 404);
    default:
      throw new GitHubError(`GitHub answered with error ${res.status}.`, res.status);
  }
}

export async function getRepo(ref: RepoRef) {
  const res = await call(ref, '');
  if (!res.ok) fail(res);
  const data = await res.json();
  return { fullName: data.full_name as string, isPrivate: Boolean(data.private) };
}

function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function githubRemote(ref: RepoRef): RemoteStore {
  return {
    async list() {
      const res = await call(ref, `/contents/${DIR}`);
      if (res.status === 404) {
        // Either the data folder doesn't exist yet or the repo is unreachable.
        await getRepo(ref);
        return new Map();
      }
      if (!res.ok) fail(res);
      const entries = (await res.json()) as { name: string; sha: string; type: string }[];
      return new Map(
        entries.filter((e) => e.type === 'file' && e.name.endsWith('.json')).map((e) => [e.name.slice(0, -5), e.sha]),
      );
    },

    async read(shard) {
      const res = await call(ref, `/contents/${DIR}/${shard}.json`, { accept: 'application/vnd.github.raw+json' });
      if (!res.ok) fail(res);
      return res.text();
    },

    async write(shard, text, sha, message) {
      const res = await call(ref, `/contents/${DIR}/${shard}.json`, {
        method: 'PUT',
        body: JSON.stringify({ message, content: toBase64(text), ...(sha ? { sha } : {}) }),
      });
      // 409: sha no longer current. 422: file appeared since we listed.
      if (res.status === 409 || res.status === 422) throw new SyncConflict();
      if (!res.ok) fail(res);
      return (await res.json()).content.sha as string;
    },
  };
}
