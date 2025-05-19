import type { Metadata } from "next";
import "./globals.css";
import { courier } from '@/app/ui/fonts';
import TopNavBar from "@/app/ui/topnav";
import TopPadding from "@/app/ui/toppadding";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { MovieProvider } from "@/app/ui/movieContext";
config.autoAddCss = false;

export const metadata: Metadata = {
  title: "ClapperBoard",
  description: "Script planning made easy!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={courier.variable}>
      <body className={`${courier.variable} h-screen overflow-hidden bg-gray-100`}>
        <MovieProvider>
        <TopNavBar />
        <TopPadding />
        <div id="app-root" className="w-full overflow-y-auto">
          {children}
        </div>
        </MovieProvider>
      </body>
    </html>
  );
}
