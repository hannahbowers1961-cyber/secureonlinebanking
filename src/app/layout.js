import { Analytics } from '@vercel/analytics/react';
import { DM_Sans } from 'next/font/google';
// import './globals.css'; <-- Uncomment this line if you have a globals.css file!

// Load the DM Sans font (Geometric/Circular style)
const dmSans = DM_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased ${dmSans.className}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}