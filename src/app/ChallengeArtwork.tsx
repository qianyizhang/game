import { ChallengeSymbol, type ChallengeSymbolKind } from '../shared/art/ChallengeArt';

const statusSymbols: Record<string, ChallengeSymbolKind> = {
  'New puzzle': 'new',
  Cleared: 'cleared',
  'In progress': 'active',
  'Not yet': 'retry',
  'Saved progress needs attention': 'attention',
};

export function ChallengeStatus({ label }: { label: string }) {
  const kind = statusSymbols[label];
  return (
    <span className="challenge-illustrated-status">
      {kind && <ChallengeSymbol kind={kind} />}
      {label}
    </span>
  );
}
