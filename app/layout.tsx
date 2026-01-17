'use client';
import './globals.css';
import { usePathname } from 'next/navigation';
import Sidebar from './components/Sidebar';
import { ThemeProvider } from './context/ThemeContext';

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
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
