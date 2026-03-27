export function JsonViewer({ value, maxHeight = 320 }: { value: unknown; maxHeight?: number }) {
  return (
    <pre className="json-viewer" style={{ maxHeight }}>
      <code>{JSON.stringify(value, null, 2)}</code>
    </pre>
  );
}
