import type { Metadata } from 'next';
import './globals.css';
import { Inter, Anton } from 'next/font/google';
import Navigation from '@/components/Navigation';
import ChatBot from '@/components/ChatBot';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton' });

export const metadata: Metadata = {
  title: 'Civic Issue Resolution',
  description: 'A platform to report and resolve local public grievances.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${anton.variable}`}>
        <div className="app-container">
          <Navigation />
          <main className="main-content">
            {children}
          </main>
          <ChatBot />
        </div>
      </body>
    </html>
  );
}
