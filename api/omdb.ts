import { createOmdbProxy, parseKeys } from './_lib/omdbProxy.js';

// Created once per warm function instance, so the in-memory cache and
// key bench survive between requests on the same instance.
const handle = createOmdbProxy({ keys: parseKeys(process.env.OMDB_API_KEYS) });

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const result = await handle(searchParams);
  return new Response(JSON.stringify(result.body), { status: result.status, headers: result.headers });
}
