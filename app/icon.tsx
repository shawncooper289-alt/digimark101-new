import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0b0d0e",
          color: "#cbb082",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          letterSpacing: "-0.04em",
        }}
      >
        101
      </div>
    ),
    { ...size },
  )
}
