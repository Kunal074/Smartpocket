import { Inter, Space_Grotesk } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata = {
  title: 'SmartPocket — Track every ₹, save smarter',
  description:
    'Modern Indian expense tracker. Guest mode in one tap. Budgets, recurring bills, and beautiful charts.',
};

export default function RootLayout({ children }) {
  // We apply the dark theme by default (for the fintech look)
  // Can be customized or toggled via next-themes later if needed
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        {children}
        <Toaster position="bottom-center" theme="dark" />
      </body>
    </html>
  );
}
