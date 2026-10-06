import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #F2FAFF 0%, #C3E3F8 60%, #9BD2F4 100%)", fontSize: 100 }}>
        🚀
      </div>
    ),
    { ...size, emoji: "noto" },
  );
}
