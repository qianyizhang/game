import { isRecord } from '../../../src/shared/json.ts';

/** Validate the JSONL envelope. Game adapters still own step/action rejection semantics. */
export function requestFromLine(
  line: string,
  idError: string,
): Record<string, unknown> & { id: string | undefined } {
  if (Buffer.byteLength(line) > 65536) throw new Error('Request exceeds 64 KiB.');
  const request: unknown = JSON.parse(line);
  if (!isRecord(request)) throw new Error('Expected a request object.');
  if (request.id !== undefined && (typeof request.id !== 'string' || request.id.length > 100))
    throw new Error(idError);
  return { ...request, id: request.id };
}
