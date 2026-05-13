import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saphe Dashboard",
  description: "Personligt arbejdsdashboard til Saphe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-background">
        <TooltipProvider>
          <div className="flex h-screen overflow-hidden bg-[#f5f5f3]">
            <AppSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <main className="flex-1 overflow-y-auto">
                <div className="px-8 py-8">{children}</div>
              </main>
            </div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
