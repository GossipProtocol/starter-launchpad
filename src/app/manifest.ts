import type { MetadataRoute } from "next";

/** Web app manifest: "Add to Home Screen" on iOS installs the app as a standalone app with the sky icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "launch lab",
    short_name: "launch lab",
    description: "pick an emoji. pick a stock. launch.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#DCEEFB",
    theme_color: "#DCEEFB",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
