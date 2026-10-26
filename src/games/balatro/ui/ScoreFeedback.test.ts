import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ScoreFeedback } from './ScoreFeedback';

describe('unillustrated scoring sources', () => {
  it('keeps blocked and unfamiliar effects explicit without inventing a portrait or a positive change', () => {
    for (const source of ['The Lock', 'Held steel A', 'Spark · unknown extension']) {
      const html = renderToStaticMarkup(
        createElement(ScoreFeedback, {
          step: { source, detail: 'No scoring effect', chips: 0, mult: 0, cash: 0 },
        }),
      );
      expect(html).toContain(source);
      expect(html).toContain('No scoring effect');
      expect(html).not.toContain('<svg');
      expect(html).not.toContain('is-updated');
    }
  });
});
