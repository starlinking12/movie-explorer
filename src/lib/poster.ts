/**
 * OMDb posters are Amazon image URLs whose suffix controls the size,
 * e.g. "..._V1_SX300.jpg". Rewriting the suffix gives a sharper image for big layouts.
 */
export function posterAt(url: string | undefined, width: number): string | undefined {
  if (!url || url === 'N/A') return undefined;
  return url.replace(/\._V1_.*\.(jpg|png)$/i, `._V1_SX${width}.$1`);
}
