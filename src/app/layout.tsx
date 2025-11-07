import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContexts";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/context/ThemeProvider";

export const metadata: Metadata = {
  title: "GrowPro v2.0",
  description: "Next.js based education growth platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="pt-20">{children}</main>
            <Footer />
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
