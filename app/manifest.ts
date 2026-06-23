import type { MetadataRoute } from "next";
import { MARKETING_COVER } from "@/lib/marketing-images";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BornoMess Manager",
    short_name: "BornoMess",
    description: "Smart mess & hostel management by BornoSoft",
    start_url: "/portal",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: MARKETING_COVER,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
