import type { MetadataRoute } from "next";

const baseUrl = process.env.AUTH_URL ?? "https://messflow.pro";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "", "/features", "/pricing", "/about", "/contact", "/faq", "/blog", "/privacy", "/terms",
    "/login", "/register",
  ];

  const locales = ["en", "bn"];

  return locales.flatMap((locale) =>
    routes.map((route) => ({
      url: `${baseUrl}/${locale === "en" ? "" : locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    }))
  );
}
