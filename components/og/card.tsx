export function OgCard({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f6f1fb",
        color: "#35105d",
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
              background: "#35105d",
              color: "#f6f1fb",
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
        <div style={{ width: 28, height: 28, background: "#8738b9" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8738b9" }}>{kicker}</div>
        <div style={{ marginTop: 18, fontSize: 68, lineHeight: 0.95, letterSpacing: "-0.04em", maxWidth: 980 }}>{title}</div>
      </div>
      <div style={{ fontSize: 26, color: "#5a4570" }}>Marketing, built as a system. With Ava Skye.</div>
    </div>
  )
}
