import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContexts";
import { ThemeProvider } from "@/context/ThemeProvider";
import ToasterClient from "@/components/ToasterClient";
import { CelebrationProvider } from "@/context/CelebrationContext";
import CelebrationClient from "@/components/CelebrationClient";

export const metadata: Metadata = {
  title: "GrowPro",
  description: "Next.js based education growth platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CelebrationProvider>
            <AuthProvider>
              <ToasterClient />
              <CelebrationClient />
              <Header />
              <main className="pt-20">{children}</main>
              <Footer />
            </AuthProvider>
          </CelebrationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
