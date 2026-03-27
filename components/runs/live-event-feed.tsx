'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { CanonicalEvent } from '@/lib/types';
import { formatDateTime, titleCase, truncate } from '@/lib/utils/format';

export function LiveEventFeed({
  events,
  title = 'Live event rail',
  description = 'Streaming canonical events, tool calls, and decision transitions.'
}: {
  events: CanonicalEvent[];
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="timeline-list">
          {events.length === 0 ? (
            <div className="empty-state compact">
              <h4>No events yet</h4>
              <p>Once the control plane publishes normalized events they will appear here.</p>
            </div>
          ) : (
            events
              .slice()
              .reverse()
              .map((event) => (
                <div key={event.id} className="timeline-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <div className="list-item-title">{event.type}</div>
                    <Badge label={`seq:${event.seq}`} />
                  </div>
                  <div className="list-item-meta">
                    {formatDateTime(event.ts)} · {titleCase(event.source.kind)} / {event.source.name}
                  </div>
                  <div className="muted small">
                    {event.subject ? `${event.subject.kind}:${event.subject.id}` : 'No explicit subject'}
                  </div>
                  <div className="muted small">{truncate(JSON.stringify(event.data), 180)}</div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
