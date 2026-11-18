import { ImageResponse } from "next/og";

import { MdpMark } from "@/components/app-logo";

export function createAppIcon(size: number) {
  const w = size * 0.8;
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "white",
      }}
    >
      <MdpMark width={w} height={w * (172 / 200)} />
    </div>,
    { width: size, height: size },
  );
}
