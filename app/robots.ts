import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.AUTH_URL ?? "https://messflow.pro";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal/", "/mess/", "/dashboard/", "/super-admin/", "/member/", "/admin/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
