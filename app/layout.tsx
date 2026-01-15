'use client';
import './globals.css';
import { usePathname } from 'next/navigation';
import Sidebar from './components/Sidebar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="pt-BR">
      <body>
        {isLoginPage ? (
          <>{children}</>
        ) : (
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '2rem', background: 'var(--bg-body)', overflowY: 'auto' }}>
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  );
}
