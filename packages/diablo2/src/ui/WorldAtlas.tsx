import type { Content, State } from '../domain/types';
export function WorldAtlas({ state, content }: { state: State; content: Content }) {
  return (
    <div className="ew-atlas">
      {content.acts.map((act, i) => (
        <article className="ew-journal-act" key={act.id}>
          <span className="ew-kicker">
            {act.subtitle} ·{' '}
            {i > state.unlocked
              ? 'SEALED'
              : state.worlds[act.bossRegion].bossDefeated
                ? 'CLEARED'
                : 'OPEN'}
          </span>
          <h3>{act.name}</h3>
          <p>{act.introduction}</p>
          <strong>{act.objective}</strong>
          <ul className="ew-region-list">
            {content.regions
              .filter((r) => r.act === act.id)
              .map((region) => (
                <li key={region.id} className={state.region === region.id ? 'current' : ''}>
                  <strong>
                    {region.name}
                    {region.floor ? ` · floor ${region.floor}` : ''}
                  </strong>
                  <span>
                    {state.region === region.id
                      ? 'You are here'
                      : state.worlds[region.id].visited
                        ? 'Explored'
                        : 'Undiscovered'}
                    {region.ward ? (state.worlds[region.id].ward ? ' · Ward lit' : ' · Ward') : ''}
                    {region.boss ? ' · Final boss' : ''}
                    {state.worlds[region.id].waypoint ? ' · Waypoint attuned' : ''}
                  </span>
                  <small>
                    {region.portals
                      .map(
                        (p) =>
                          `${p.name}${p.requires === 'wards' ? ' (both wards)' : p.requires === 'boss' ? ' (boss)' : ''}`,
                      )
                      .join(' ↔ ')}
                  </small>
                </li>
              ))}
          </ul>
          {state.worlds[act.bossRegion].bossDefeated && <p>{act.conclusion}</p>}
        </article>
      ))}
    </div>
  );
}
