export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(pathname = "/") {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${siteUrl}${path}`;
}

export const defaultSeoKeywords = [
  "Amarargarh High School",
  "Amarargarh school",
  "school website",
  "school notices",
  "school events",
  "teachers corner",
  "student achievements",
  "school admissions",
];
