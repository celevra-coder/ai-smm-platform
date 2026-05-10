import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI SMM Studio",
  description: "AI платформа за съдържание, видео, визии и SMM за твоя бизнес.",
  openGraph: {
    title: "AI SMM Studio",
    description: "Създавай съдържание, видеа и рекламни визии с AI.",
    url: "https://www.aismmstudio.com",
    siteName: "AI SMM Studio",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI SMM Studio",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI SMM Studio",
    description: "AI платформа за съдържание, видео, визии и SMM.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html
    lang="en"
    className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
  >
    <head>
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-KP686DHVTF"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KP686DHVTF');
          `,
        }}
      />
    </head>

    <body>
        <AppShell>
          {children}
        </AppShell>
        <Footer />
      </body>
    </html>
  );
}
