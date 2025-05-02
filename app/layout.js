import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/sidebar";
import { AccountsProvider } from '@/lib/accounts-context';
import { cn } from '@/lib/utils';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MasterTrader - Gestión de Cuentas de Trading",
  description: "Plataforma para gestionar tus cuentas de trading",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", geistSans.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AccountsProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-[240px]">
                <Toaster />
                {children}
              </main>
            </div>
          </AccountsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
