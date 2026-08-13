import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/ui/Sidebar';

export const metadata: Metadata = {
  title: {
    template: '%s | GraphScope',
    default: 'GraphScope — Service Dependency Explorer',
  },
  description:
    'Explore your microservice architecture, trace dependencies, and analyze blast radius with a graph database.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main
            style={{
              flex: 1,
              marginLeft: '220px',
              padding: '32px 40px',
              minHeight: '100vh',
              background: 'var(--bg-base)',
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
