'use client';

interface PayloadDiffViewerProps {
  left: Record<string, unknown>;
  right: Record<string, unknown>;
  title?: string;
}

type DiffEntry = { key: string; type: 'unchanged' | 'added' | 'removed' | 'modified'; left?: unknown; right?: unknown };

function diffObjects(left: Record<string, unknown>, right: Record<string, unknown>): DiffEntry[] {
  const allKeys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
  return allKeys.map((key) => {
    const inLeft = key in left;
    const inRight = key in right;
    if (inLeft && !inRight) return { key, type: 'removed', left: left[key] };
    if (!inLeft && inRight) return { key, type: 'added', right: right[key] };
    const lv = JSON.stringify(left[key]);
    const rv = JSON.stringify(right[key]);
    if (lv === rv) return { key, type: 'unchanged', left: left[key] };
    return { key, type: 'modified', left: left[key], right: right[key] };
  });
}

const toneColors: Record<string, string> = {
  unchanged: 'var(--muted)',
  added: 'var(--success)',
  removed: 'var(--danger)',
  modified: 'var(--warning)'
};

export function PayloadDiffViewer({ left, right, title }: PayloadDiffViewerProps) {
  const diffs = diffObjects(left, right);
  const hasChanges = diffs.some((d) => d.type !== 'unchanged');

  return (
    <div>
      {title ? <h4 style={{ marginBottom: '0.75rem' }}>{title}</h4> : null}
      {!hasChanges ? (
        <p className="muted small">Payloads are identical.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Status</th>
                <th>Left</th>
                <th>Right</th>
              </tr>
            </thead>
            <tbody>
              {diffs.map((entry) => (
                <tr key={entry.key}>
                  <td style={{ fontFamily: 'monospace' }}>{entry.key}</td>
                  <td style={{ color: toneColors[entry.type] }}>{entry.type}</td>
                  <td
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      color: entry.type === 'removed' || entry.type === 'modified' ? 'var(--danger)' : undefined
                    }}
                  >
                    {entry.left !== undefined ? JSON.stringify(entry.left) : '—'}
                  </td>
                  <td
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      color: entry.type === 'added' || entry.type === 'modified' ? 'var(--success)' : undefined
                    }}
                  >
                    {entry.right !== undefined ? JSON.stringify(entry.right) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
