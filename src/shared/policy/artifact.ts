/** A lossless storage container, independent of rollout schema and native identity. */
export const MAX_ARTIFACT_BYTES = 150_000_000;
export type RolloutFormat = 'json' | 'gzip';
export function rolloutFormat(value = 'gzip'): RolloutFormat {
  if (value !== 'json' && value !== 'gzip') throw new Error('Use --rollout-format json|gzip.');
  return value;
}
export function isGzip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x1f && bytes[1] === 0x8b;
}
/** Remote gzip filenames promise a container. Fetch may remove it, even without exposing a header. */
export function assertFetchedArtifact(
  bytes: Uint8Array,
  pathname: string,
  contentEncoding: string | null,
): void {
  if (!/\.(?:gz|gzip)$/i.test(pathname) || isGzip(bytes)) return;
  if (contentEncoding?.split(',').some((encoding) => encoding.trim().toLowerCase() === 'gzip'))
    throw new Error(
      'The server decoded this gzip file during transfer, so its original compressed bytes are unavailable. Open the original local file below, or use a .json.gzip artifact link.',
    );
  throw new Error(
    'This gzip artifact URL returned non-gzip bytes. The server may have decoded it or the file may be misnamed. Open the original local file below to inspect its actual bytes.',
  );
}
/** Both inspectors enforce the same origin, size and original-container contract. */
export async function fetchArtifact(
  path: string,
  signal: AbortSignal,
): Promise<Uint8Array<ArrayBuffer>> {
  const url = new URL(path, location.href);
  if (url.origin !== location.origin)
    throw new Error('Rollout links must use this site. Open a local file below.');
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Rollout file unavailable. Open a local file below.');
  if (!response.body) throw new Error('Rollout response has no readable body.');
  const original = await readArtifactStream(response.body);
  assertFetchedArtifact(original, url.pathname, response.headers.get('content-encoding'));
  return original;
}
function byteLimit(maxBytes: number) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_ARTIFACT_BYTES)
    throw new Error('Invalid rollout byte limit.');
}
/** Stop reading before retaining an oversized encoded response. Also handles absent Content-Length. */
export async function readArtifactStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes = MAX_ARTIFACT_BYTES,
): Promise<Uint8Array<ArrayBuffer>> {
  byteLimit(maxBytes);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new Error('Rollout exceeds its byte limit.');
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  } finally {
    reader.releaseLock();
  }
}
/** Bound decoded bytes before assembling text. Invalid UTF-8 and corrupt gzip fail closed. */
export async function decodeArtifact(
  bytes: Uint8Array<ArrayBuffer>,
  maxBytes = MAX_ARTIFACT_BYTES,
): Promise<string> {
  byteLimit(maxBytes);
  if (bytes.byteLength > maxBytes) throw new Error('Rollout exceeds its byte limit.');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  if (!isGzip(bytes)) return decoder.decode(bytes);
  const input = new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  const reader = input.pipeThrough(new DecompressionStream('gzip')).getReader();
  const chunks: string[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new Error('Decoded rollout exceeds its byte limit.');
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join('');
  } finally {
    reader.releaseLock();
  }
}
