import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/AuthProvider";
import { ConfirmationProvider } from "@/components/ConfirmationProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Wavo WhatsApp API",
  description: "Open-source, high-throughput, and easy to integrate WhatsApp API platform.",
  icons: {
    icon: "/img/logo/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark h-full", inter.variable, jetbrainsMono.variable)} suppressHydrationWarning style={{ backgroundColor: '#0a0a0c' }}>
      <body
        className="font-inter antialiased min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ConfirmationProvider>
              {children}
            </ConfirmationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

