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
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased theme-dark`}
      >
        {children}
        <Toaster position="bottom-center" theme="dark" />
      </body>
    </html>
  );
}
