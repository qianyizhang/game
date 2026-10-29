import type { EnemyKind } from '../domain/content';

export type InhabitantKind = 'hero' | EnemyKind;

/** Shared board/inspector silhouettes; HTML owns names, life and announced attacks. */
export function InhabitantArt({ kind, className }: { kind: InhabitantKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`dc-inhabitant ${className ?? ''}`}
      data-inhabitant={kind}
      stroke="#14262d"
      strokeWidth="2.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {kind === 'hero' ? (
        <>
          <path d="m21 44-5 13h12l4-13M30 43l3 14h10l-7-17" fill="#243e42" />
          <path d="M24 24C16 26 16 40 8 49c9 6 21 7 32 1l-8-23Z" fill="#356b66" />
          <path d="M24 26c-1 11-5 18-9 23l14 3 4-22" fill="#7b9c81" stroke="none" />
          <path d="M17 24c-3-6 0-15 9-17 8 3 11 10 8 18l-8 7Z" fill="#315b58" />
          <path d="M22 17c4-2 7-1 10 1l-2 9h-6Z" fill="#e8d6a5" />
          <path d="m26 32 10 5 8-7" stroke="#e5d1a2" strokeWidth="6" />
          <path d="M43 29v-4c0-5 7-5 7 0v4" stroke="#263f40" />
          <path d="m40 29 13-1 3 17-15 1Z" fill="#e4b355" />
          <path d="m46 32 3 1 2 9-5 1Z" fill="#fff1b5" stroke="none" />
          <path d="m17 38 13 4" stroke="#c5ad75" />
        </>
      ) : kind === 'keeper' ? (
        <>
          <path d="m29 40-2 17h9l3-16M38 39l1 16h8l-4-19" fill="#574c47" />
          <path d="M25 25c8-7 20-5 26 3l-2 18-25 1-5-11Z" fill="#a16f59" />
          <path d="m37 25 1 18h10l1-13Z" fill="#d5a482" stroke="none" />
          <path d="M29 23V13l8-6 10 5 2 12-10 7Z" fill="#c1b296" />
          <path d="m30 17 18-1-2 9-8 4-8-5Z" fill="#51494a" />
          <path d="m35 20 8-1" stroke="#f2cf91" strokeWidth="3" />
          <path d="M51 10v39" stroke="#e3c08a" strokeWidth="4" />
          <path d="m49 13 4-10 7 11-7 6Z" fill="#b9c2b3" />
          <path d="m9 27 13-5 13 7-3 18-12 9L9 45Z" fill="#704d45" />
          <path d="m13 30 9-3 8 4-2 14-8 6-7-8Z" fill="#bd8b70" stroke="none" />
          <path d="m21 29-1 20" stroke="#e4c5a0" strokeWidth="3" />
        </>
      ) : kind === 'archer' ? (
        <>
          <path d="m33 39-4 18h10l5-17" fill="#405854" />
          <path d="M34 23c10-2 15 6 14 15l6 12c-8 5-18 5-27 1l5-14Z" fill="#d3c6a1" />
          <path d="M43 27c-1 10-4 16-6 23l11-1-3-14Z" fill="#8e9f85" stroke="none" />
          <path d="M30 22c-1-8 3-14 13-17l9 17-11 9Z" fill="#708f7b" />
          <path d="m34 18 12-2-2 10-6 1Z" fill="#ead9ae" />
          <path d="m31 30-7 7-10-4M41 31l-10 7" stroke="#ead9ae" strokeWidth="5" />
          <path d="M15 9C2 24 4 42 18 55" stroke="#d7ab6d" strokeWidth="4" />
          <path d="m15 10 7 23-4 21" stroke="#e5d2a4" strokeWidth="1.5" />
          <path d="M5 32h29m-28 0 5-4m-5 4 5 4" stroke="#f3dfb3" />
          <path d="m42 10 2 5" stroke="#b7c5a6" strokeWidth="2" />
        </>
      ) : kind === 'crawler' ? (
        <>
          <path d="M32 29C39 12 52 24 56 9c8 18-2 26-16 29Z" fill="#6c8193" />
          <path
            d="M14 36C6 35 3 43 7 51l9-7c-1 10 5 15 12 11l-1-9c7 9 15 10 20 5l-7-8c12 4 17 0 18-7l-12-3Z"
            fill="#344c62"
          />
          <path d="M12 36c0-12 9-20 20-18 11 1 17 10 14 22-10 8-25 10-34-4Z" fill="#8b9ba3" />
          <path d="M13 32c6 7 19 10 33 3l-1 7c-12 8-27 5-33-5Z" fill="#526a80" stroke="none" />
          <path d="M17 28c4-5 10-5 13 0l-1 6c-5 3-10 2-12-1Z" fill="#f5dfb3" />
          <path d="m24 27-1 6" stroke="#14262d" strokeWidth="3.5" />
          <path d="m34 39 4-1" stroke="#d4c7af" strokeWidth="2" />
        </>
      ) : kind === 'bomber' ? (
        <>
          <path
            d="M28 24c-11-6-10-15-1-21-2 8 12 7 12 15 0 5-5 8-10 8"
            fill="#a8b9a3"
            stroke="none"
          />
          <path d="M29 20c-5-6 3-9 3-14" stroke="#e0d5aa" strokeWidth="3" />
          <path d="m31 23-17 16m18-16 16 13M31 25l1 17" stroke="#e2bd82" strokeWidth="2" />
          <path d="M9 37c11-8 29-10 44-2l-5 14c-8 8-24 8-33 0Z" fill="#ac7652" />
          <path d="M14 40c11 4 23 3 34-2l-3 9c-7 5-18 5-26 0Z" fill="#e0ad64" stroke="none" />
          <path d="M10 36c11 4 28 4 43-1l-1 6c-12 5-29 6-41 1Z" fill="#d9bb89" />
          <path d="m27 53 1 5h10l-1-5" fill="#c0a17b" />
          <path d="m22 44 1 4m8-3v5m8-6-1 4" stroke="#573f37" strokeWidth="3" />
          <path d="M27 27c-5 3-4 7 1 8 4 0 6-4 3-7" fill="#ffe0a0" stroke="none" />
        </>
      ) : kind === 'king' ? (
        <>
          <path d="M23 23C10 27 15 42 4 52l15-2 5 8 10-7 10 5 7-7-9-24Z" fill="#75647d" />
          <path d="M29 28c-3 9-6 17-12 23l11-1 8-14 4 18 8-6-10-23Z" fill="#b5a2ad" stroke="none" />
          <path d="m21 15 3 13 10 7 10-12-4-12Z" fill="#283b47" />
          <path d="m17 6 10 7 5-10 6 10 10-5-6 14-18 1Z" fill="#e4c585" />
          <path d="m28 26 9-2" stroke="#f6dec1" strokeWidth="3" />
          <path d="m34 36 9 2 9-8" stroke="#d0bdaf" strokeWidth="5" />
          <path d="m45 51 7-35" stroke="#d4b882" strokeWidth="3" />
          <path d="M51 20c-5-9-2-14 9-17 0 10-3 16-9 17Z" fill="#e9ddbc" />
          <path d="m55 10-4 10" stroke="#8c8d80" strokeWidth="1.5" />
          <path d="m22 36 7 3-7 8" fill="#d9cbaa" />
        </>
      ) : null}
    </svg>
  );
}
