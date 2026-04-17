import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EduDesk — Teacher Dashboard',
  description: 'Modern college teacher dashboard for managing students, attendance, grades & more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/sign-in">
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <head>
          {/* Theme initialization script to prevent hydration flash */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const stored = localStorage.getItem('theme');
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    const isDark = stored ? stored === 'dark' : prefersDark;
                    if (isDark) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  } catch (e) {
                    // Silently fail if localStorage is not available
                  }
                })();
              `,
            }}
          />
        </head>
        <body className="min-h-screen antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
