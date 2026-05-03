import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bro2Bro - Send A Bro',
  description: 'The viral social app for sending bros. One tap. Instant connection.',
  keywords: ['social', 'bros', 'viral', 'real-time', 'connect'],
  authors: [{ name: 'Bro2Bro' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Bro2Bro',
    description: 'Send A Bro. One tap. Instant connection.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f0f0f',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authConfig);

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-dark-bg text-dark-text min-h-screen`}>
        <SessionProvider session={session}>
          <AuthProvider>
            <SocketProvider>
              {children}
              <Toaster
                position="bottom-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1a1a1a',
                    color: '#f5f5f5',
                    border: '1px solid #2a2a2a',
                  },
                  success: {
                    iconTheme: {
                      primary: '#0ea5e9',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </SocketProvider>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
