import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type CardProps = HTMLAttributes<HTMLElement> & { className?: string; children: React.ReactNode };

export function Card({ className, children, ...props }: CardProps) {
  return (
    <section className={cn('card', className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <header className={cn('card-header', className)} {...props}>
      {children}
    </header>
  );
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3 className={cn('card-title', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: CardProps) {
  return (
    <p className={cn('card-description', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('card-content', className)} {...props}>
      {children}
    </div>
  );
}
