import { useEffect, useState } from 'react';
export type View = 'conversation' | 'events' | 'process' | 'story' | 'compare' | 'sources';
export interface ReviewState {
  view: View;
  thread: string;
  turn: string;
  query: string;
  turnPage: number;
  type: string;
  text: string;
  reviews: boolean;
  order: string;
  session: string;
  actionTurn: string;
  kind: string;
  signal: string;
  search: string;
  scope: string;
  evidenceRole: string;
  event: string;
  page: number;
  episode: string;
  stage: number;
  assessment: string;
  find: string;
  subject: string;
  lessons: boolean;
}
export function useReviewState(curated: boolean, firstThread: string) {
  const read = (): ReviewState => {
    const q = new URLSearchParams(location.hash.slice(1));
    const number = (key: string) => Math.max(0, Number(q.get(key)) || 0);
    const view = q.get('view') as View;
    return {
      view: [
        'conversation',
        'events',
        'sources',
        ...(curated ? ['process', 'story', 'compare'] : []),
      ].includes(view)
        ? view
        : curated
          ? 'story'
          : 'conversation',
      thread: q.get('thread') ?? firstThread,
      turn: q.get('turn') ?? '',
      query: q.get('query') ?? '',
      turnPage: number('turnPage'),
      type: q.get('type') ?? 'all',
      text: q.get('text') ?? 'rendered',
      reviews: q.get('reviews') === 'show',
      order: q.get('order') ?? 'session',
      session: q.get('session') ?? 'all',
      actionTurn: q.get('actionTurn') ?? 'all',
      kind: q.get('kind') ?? 'all',
      signal: q.get('signal') ?? 'all',
      search: q.get('search') ?? '',
      scope: q.get('scope') ?? 'all',
      evidenceRole: q.get('evidenceRole') ?? 'all',
      event: q.get('event') ?? '',
      page: number('page'),
      episode: q.get('episode') ?? '',
      stage: number('stage'),
      assessment: q.get('assessment') ?? '',
      find: q.get('find') ?? '',
      subject: q.get('subject') ?? 'all',
      lessons: q.get('lessons') === 'true',
    };
  };
  const [state, setState] = useState(read);
  useEffect(() => {
    const restore = () => setState(read());
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, [curated, firstThread]);
  const update = (patch: Partial<ReviewState>) =>
    setState((prior) => {
      const next = { ...prior, ...patch };
      const q = new URLSearchParams();
      for (const [key, value] of Object.entries(next)) {
        if (key === 'reviews') {
          if (value) q.set(key, 'show');
        } else if (
          value !== '' &&
          value !== false &&
          value !== 'all' &&
          value !== 0 &&
          value !== 'rendered'
        )
          q.set(key, String(value));
      }
      history.replaceState(null, '', '#' + q.toString());
      return next;
    });
  return [state, update] as const;
}
