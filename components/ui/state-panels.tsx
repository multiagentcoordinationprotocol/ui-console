import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function LoadingPanel({
  title = 'Loading',
  description = 'Fetching the latest run metadata and observability data.'
}: {
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
        <div className="empty-state compact">
          <h4>One moment</h4>
          <p>Data is being prepared.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ErrorPanel({
  title = 'Something went wrong',
  message,
  actionHref,
  actionLabel = 'Go back'
}: {
  title?: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="empty-state compact">
          <h4>Unable to render this view</h4>
          <p>{message}</p>
          {actionHref ? (
            <Link href={actionHref} className="button button-secondary">
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyPanel({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <h4>{title}</h4>
      <p>{message}</p>
      {action}
    </div>
  );
}
