export function JapaneseBorder() {
  return (
    <>
      <div style={{ position: "absolute", inset: "6px", border: "1px solid rgba(139,0,0,0.25)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: "10px", border: "1px solid rgba(201,163,78,0.15)", pointerEvents: "none", zIndex: 1 }} />
      {/* Gold L-corner brackets */}
      <div style={{ position: "absolute", top: "-2px", left: "-2px", width: "16px", height: "16px", border: "2px solid #8B0000", borderRight: 0, borderBottom: 0, zIndex: 10 }} aria-hidden="true" />
      <div style={{ position: "absolute", top: "-2px", right: "-2px", width: "16px", height: "16px", border: "2px solid #8B0000", borderLeft: 0, borderBottom: 0, zIndex: 10 }} aria-hidden="true" />
      <div style={{ position: "absolute", bottom: "-2px", left: "-2px", width: "16px", height: "16px", border: "2px solid #8B0000", borderRight: 0, borderTop: 0, zIndex: 10 }} aria-hidden="true" />
      <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "16px", height: "16px", border: "2px solid #8B0000", borderLeft: 0, borderTop: 0, zIndex: 10 }} aria-hidden="true" />
    </>
  );
}
