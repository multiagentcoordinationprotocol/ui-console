import './globals.css';
import { DM_Sans, Inter, JetBrains_Mono, Syne } from 'next/font/google';
import { AppShell } from '@/components/layout/app-shell';
import { Providers } from '@/components/providers';

/**
 * R2.2 — self-host Inter via next/font/google.
 *
 * Before: `font-family: Inter, ui-sans-serif, system-ui, ...` relied on Inter
 * being installed on the OS. On bare Linux / CI runners without Inter,
 * rendering silently fell back to the next item in the stack.
 *
 * Now: Inter is bundled + served from the same origin and exposed as the
 * `--font-inter` CSS variable. The fallback chain in globals.css still
 * applies (defense in depth — if next/font fails for any reason).
 */
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter'
});

/**
 * R3.2 — v2 design-system fonts (Syne, DM Sans, JetBrains Mono).
 *
 * Loaded unconditionally so CSS using `var(--font-syne)` etc. works
 * whenever the `data-design='v2'` flag is active. With the flag off,
 * these variables exist but no rule reads them — no visual impact.
 *
 * Typography role matrix (enforced in v2 primitives during R4):
 *   Syne          → display / headings / brand mark / KPI values
 *   DM Sans       → body text / buttons / nav / UI labels
 *   JetBrains Mono → numerics / env labels / timestamps / code / kbd
 *
 * `display: 'swap'` avoids FOIT; fonts flash on second paint rather than
 * blocking rendering.
 */
const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-syne'
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-dm-sans'
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-jetbrains-mono'
});

export const metadata = {
  title: 'MACP Console',
  description: 'Execution orchestration and observability console for MACP.',
  icons: {
    icon: '/logo-mark.svg',
    apple: '/logo-mark.svg'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontClasses = [inter.variable, syne.variable, dmSans.variable, jetBrainsMono.variable].join(' ');

  return (
    <html lang="en" suppressHydrationWarning className={fontClasses}>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
