import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "/",
    "/about",
    "/admissions",
    "/academics",
    "/contact",
    "/teachers",
    "/achievements",
    "/events",
    "/notices",
    "/magazine",
    "/privacy",
    "/terms",
  ];

  return routes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "/" ? 1 : 0.8,
  }));
}
