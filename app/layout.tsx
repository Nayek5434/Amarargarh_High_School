import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Poppins } from "next/font/google";
import "@/app/globals.css";
import { ensureDefaults } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { NavLinks } from "@/app/_components/nav-links";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { CursorGlow } from "@/app/_components/cursor-glow";
import { GlobalRouteLoader } from "@/app/_components/loading-overlay";
import { defaultSeoKeywords, siteUrl } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Amarargarh High School",
    template: "%s | Amarargarh High School",
  },
  description: "Official website of Amarargarh High School with notices, events, admissions, teachers, achievements, and contact information.",
  keywords: defaultSeoKeywords,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Amarargarh High School",
    description: "Official website of Amarargarh High School with notices, events, admissions, teachers, and achievements.",
    url: "/",
    siteName: "Amarargarh High School",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amarargarh High School",
    description: "Official website of Amarargarh High School with notices, events, admissions, teachers, and achievements.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await ensureDefaults();
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const schoolJsonLd = {
    "@context": "https://schema.org",
    "@type": "School",
    name: settings?.schoolName ?? "Amarargarh High School",
    description: settings?.tagline ?? "Official school information portal",
    url: siteUrl,
    telephone: settings?.phone ?? undefined,
    email: settings?.email ?? undefined,
    address: settings?.address
      ? {
          "@type": "PostalAddress",
          streetAddress: settings.address,
          addressCountry: "IN",
        }
      : undefined,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var key='amarargarh-theme';var maxAge=31536000;var root=document.documentElement;var readCookie=function(){var cookie=document.cookie.split(';').map(function(part){return part.trim();}).find(function(part){return part.indexOf(key+'=')===0;});if(!cookie){return null;}var value=cookie.slice(key.length+1);return(value==='light'||value==='dark')?value:null;};var getSavedTheme=function(){try{var local=localStorage.getItem(key);if(local==='light'||local==='dark'){return local;}}catch(e){}return readCookie();};var saveTheme=function(theme){try{localStorage.setItem(key,theme);}catch(e){}document.cookie=key+'='+theme+'; path=/; max-age='+maxAge+'; samesite=lax';};var applyTheme=function(theme){if(theme==='light'){root.classList.add('light');root.style.colorScheme='light';root.setAttribute('data-theme','light');}else{root.classList.remove('light');root.style.colorScheme='dark';root.setAttribute('data-theme','dark');}var icon=document.querySelector('[data-theme-icon]');var label=document.querySelector('[data-theme-label]');if(icon){icon.textContent=theme==='dark'?'🌙':'☀️';}if(label){label.textContent=theme==='dark'?'Dark':'Light';}};var saved=getSavedTheme();var systemLight=window.matchMedia('(prefers-color-scheme: light)').matches;var initialTheme=saved?saved:(systemLight?'light':'dark');applyTheme(initialTheme);document.addEventListener('click',function(event){var target=event.target;if(!(target instanceof Element)){return;}var button=target.closest('[data-theme-toggle]');if(!button){return;}var nextTheme=root.classList.contains('light')?'dark':'light';applyTheme(nextTheme);saveTheme(nextTheme);},{capture:true});})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable}`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <GlobalRouteLoader />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolJsonLd) }}
        />
        <CursorGlow />
        <header className="sticky top-0 z-30 border-b border-slate-700/70 bg-slate-950/85 backdrop-blur-xl">
          <div className="container-main flex flex-wrap items-center justify-between gap-4 py-3">
            <div className="min-w-[220px]">
              <Link href="/" className="brand-title text-xl sm:text-2xl">
                {settings?.schoolName}
              </Link>
              <p className="text-sm text-slate-300">{settings?.tagline}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NavLinks />
            </div>
          </div>
        </header>
        <main id="main-content" className="container-main page-enter py-8 lg:py-10">
          {children}
        </main>
        <footer className="mt-12 border-t border-slate-700/70 bg-slate-950/70">
          <div className="container-main grid gap-4 py-7 text-sm text-slate-300 md:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-100">{settings?.schoolName}</p>
              <p>{settings?.address}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <Link href="/privacy" className="hover:text-slate-100">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-slate-100">
                  Terms of Use
                </Link>
              </div>
            </div>
            <div className="md:text-right">
              <p>Phone: {settings?.phone}</p>
              <p>Email: {settings?.email}</p>
              <p className="mt-1 text-xs text-slate-400">© {new Date().getFullYear()} All rights reserved</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
