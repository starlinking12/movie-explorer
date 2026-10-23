import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearOmdbCache, getMovie, OmdbError, searchMovies, value } from './omdb';

const respond = (body: unknown, status = 200) =>
  vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

describe('omdb client', () => {
  beforeEach(() => clearOmdbCache());
  afterEach(() => vi.unstubAllGlobals());

  it('maps a search answer to movies + total', async () => {
    vi.stubGlobal(
      'fetch',
      respond({
        Response: 'True',
        totalResults: '42',
        Search: [{ imdbID: 'tt1', Title: 'A', Year: '2000', Type: 'movie', Poster: 'N/A' }],
      }),
    );
    const page = await searchMovies('  batman ');
    expect(page.total).toBe(42);
    expect(page.movies[0]?.Title).toBe('A');
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toBe('/api/omdb?s=batman&page=1');
  });

  it('turns "Movie not found!" into a not-found error', async () => {
    vi.stubGlobal('fetch', respond({ Response: 'False', Error: 'Movie not found!' }));
    await expect(searchMovies('zzzz')).rejects.toMatchObject({ kind: 'not-found' });
  });

  it('turns a 503 from the proxy into an unavailable error', async () => {
    vi.stubGlobal('fetch', respond({ Response: 'False', Error: 'Busy' }, 503));
    await expect(getMovie('tt1')).rejects.toBeInstanceOf(OmdbError);
    await expect(getMovie('tt1')).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it('reports network failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
    await expect(getMovie('tt1')).rejects.toMatchObject({ kind: 'network' });
  });

  it('caches successful answers', async () => {
    const fetchMock = respond({ Response: 'True', imdbID: 'tt1', Title: 'A' });
    vi.stubGlobal('fetch', fetchMock);
    await getMovie('tt1');
    await getMovie('tt1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('normalises N/A values', () => {
    expect(value('N/A')).toBeUndefined();
    expect(value('8.8')).toBe('8.8');
  });
});
