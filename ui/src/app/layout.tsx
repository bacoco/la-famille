import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "La Famille — AgentUI",
  description: "Chat with your AI family",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'bg-card text-card-foreground border-border',
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
