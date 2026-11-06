/** Audited standalone deliveries. Unknown files and consumers retain broad coverage. */
export const movieRoot = 'docs/art/movie-experiments/';
export const movies = {
  'haunted-island': { files: ['README.md', 'haunted-island.gif'], browser: [] },
  'little-haunt': { files: ['README.md', 'little-haunt.gif'], browser: [] },
  'lantern-keep': {
    files: ['README.md', 'lantern-keep.html', 'lantern-keep.gif'],
    browser: ['tests/browser/lantern-keep.spec.ts'],
  },
  'golden-claw': {
    files: [
      'README.md',
      'creation-journey.md',
      'film.html',
      'golden-claw.gif',
      'golden-claw.mp4',
      'hero-front.webp',
      'hero-back.webp',
      'opening.jpg',
      'action.jpg',
      'baseline-opening.jpg',
      'baseline-action.jpg',
      'contact-review.jpg',
    ],
    browser: ['tests/browser/golden-claw.spec.ts'],
  },
} satisfies Record<string, { files: string[]; browser: string[] }>;

export function movieOwner(path: string): string | undefined {
  for (const [id, movie] of Object.entries(movies))
    if (
      movie.browser.some((file) => file === path) ||
      movie.files.some((file) => path === `${movieRoot}${id}/${file}`)
    )
      return id;
  return path === `${movieRoot}README.md` ? 'index' : undefined;
}
export const movieConsumers = new Set([
  ...Object.values(movies).flatMap((movie) => movie.browser),
  'packages/workshop-tools/art/golden-claw.test.ts',
  'packages/workshop-tools/art/movies.test.ts',
]);
