import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { Providers } from '@/components/providers';

export const metadata = {
  title: 'MACP Console',
  description: 'Execution orchestration and observability console for MACP.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
