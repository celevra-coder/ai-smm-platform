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
  {/* Google Analytics */}
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

    {/* Microsoft Clarity */}
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "worqtob2f2");
      `,
    }}
  />

  {/* Meta Pixel */}
  <script
    dangerouslySetInnerHTML={{
      __html: `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '303219624047671');
        fbq('track', 'PageView');
      `,
    }}
  />
</head>

        <body>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=303219624047671&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        <AppShell>
          {children}
        </AppShell>
        <Footer />
      </body>
    </html>
  );
}
