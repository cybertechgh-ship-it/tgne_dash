import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/toaster';
import { SavingIndicator } from '@/components/saving-indicator';

export const metadata: Metadata = {
  title: 'TGNE | Premium Web Dev Dashboard',
  description: 'Manage your web development clients, credentials, and projects with ease.',
  icons: {
    icon:     'https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776598078/download_kangs7.png',
    shortcut: 'https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776598078/download_kangs7.png',
    apple:    'https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776598078/download_kangs7.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
         * Dark-mode flash fix — runs inline BEFORE first paint.
         * Reads localStorage theme or OS preference and applies .dark
         * to <html> synchronously, preventing the white flash on load.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && sysDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <QueryProvider>
          <AppProvider>
            <SavingIndicator />
            {children}
            <Toaster />
          </AppProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
