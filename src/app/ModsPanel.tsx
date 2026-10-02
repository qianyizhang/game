import type { ContentPack, ContentPin } from '../shared/contentPack';

interface Preview {
  id: string;
  name: string;
  text?: string;
  description?: string;
  cost?: number;
  price?: number;
  hp?: number;
  attack?: number;
  health?: number;
  tier?: number;
  kind?: string;
  upgradeText?: string;
}
export function ModsPanel({
  packs,
  pinned,
}: {
  packs: readonly ContentPack<unknown>[];
  pinned: readonly ContentPin[];
}) {
  return (
    <section className="mods-panel">
      <p className="eyebrow">TRUSTED LOCAL TYPESCRIPT</p>
      <h2>Content packs</h2>
      <p>
        Edit an example’s source, set <code>enabled: true</code>, then start a fresh run. Data
        validates when loaded. Change the pack version when changing a hook’s behavior.
      </p>
      <p className="muted">
        Enabled packs get separate saves. A replay needs matching rules, pack versions, and content
        data. Imports never execute code.
      </p>
      {packs.map((pack) => (
        <article key={pack.id} className="pack-card">
          <header>
            <h3>{pack.name}</h3>
            <strong>{pack.enabled ? 'Enabled' : 'Example · disabled'}</strong>
          </header>
          <p>{pack.description}</p>
          <p>
            <code>{pack.source}</code> · {pack.id} · v{pack.version}
          </p>
          <div className="mod-previews">
            {Object.entries(pack.content as Record<string, Preview[]>).flatMap(([kind, entries]) =>
              entries.map((entry) => (
                <article key={`${kind}-${entry.id}`} className="mod-preview">
                  <span className="eyebrow">
                    {kind}{' '}
                    {entry.cost !== undefined
                      ? `· Cost ${entry.cost}`
                      : entry.price !== undefined
                        ? `· $${entry.price}`
                        : ''}
                  </span>
                  <h4>{entry.name}</h4>
                  <p>{entry.text ?? entry.description}</p>
                  {entry.upgradeText && (
                    <p>
                      <strong>Upgrade:</strong> {entry.upgradeText}
                    </p>
                  )}
                  {entry.hp && <p>♥ {entry.hp}</p>}
                  {entry.attack !== undefined && (
                    <p>
                      Tier {entry.tier} · {entry.attack} Attack / {entry.health} Health
                    </p>
                  )}
                  <code>{entry.id}</code>
                </article>
              )),
            )}
          </div>
        </article>
      ))}
      <h3>This run’s compatibility manifest</h3>
      <table className="lab-comparison">
        <thead>
          <tr>
            <th>Pack</th>
            <th>Version</th>
            <th>Data checksum</th>
          </tr>
        </thead>
        <tbody>
          {pinned.map((pin) => (
            <tr key={pin.id}>
              <td>{pin.id}</td>
              <td>{pin.version}</td>
              <td>
                <code>{pin.digest}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Use a custom practice scenario to try an enabled card, relic, enemy, or hero immediately.
        Read <code>docs/modding.md</code> for the lifecycle and effect examples.
      </p>
    </section>
  );
}
