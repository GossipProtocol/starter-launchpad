import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon: a rocket on a sky clay circle. Replace with your own mark. */
export default async function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent" }}>
        <div style={{ width: 64, height: 64, borderRadius: 9999, background: "linear-gradient(145deg, #F2FAFF 0%, #C3E3F8 60%, #9BD2F4 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
          🚀
        </div>
      </div>
    ),
    { ...size, emoji: "noto" },
  );
}
