export function OgCard({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0b0d0e",
        color: "#eae4d7",
        padding: "68px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 34 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#cbb082",
              color: "#14110c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            101
          </div>
          <span>DigiMark101</span>
        </div>
        <div style={{ width: 28, height: 28, background: "#cbb082" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", color: "#cbb082" }}>{kicker}</div>
        <div style={{ marginTop: 18, fontSize: 68, lineHeight: 0.95, letterSpacing: "-0.04em", maxWidth: 980 }}>{title}</div>
      </div>
      <div style={{ fontSize: 26, color: "#bbb8b0" }}>Marketing, built as a system. With Ava Skye.</div>
    </div>
  )
}
