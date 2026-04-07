import React, { useState, useEffect } from "react";

export default function WaitingRoom({ roomId, players, accentColor, gameEmoji, gameName }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      textAlign: "center", gap: "24px",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* Game icon */}
      <div style={{
        width: "80px", height: "80px", borderRadius: "20px",
        background: `${accentColor}18`,
        border: `1.5px solid ${accentColor}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "36px",
      }}>
        {gameEmoji}
      </div>

      <div>
        <h2 style={{ color: "white", margin: "0 0 8px", fontSize: "22px", fontWeight: "700" }}>
          {gameName}
        </h2>
        <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>
          Share your Room ID with a friend to start
        </p>
      </div>

      {/* Room ID box */}
      <div style={{
        background: "#1a1a2e",
        border: `1.5px solid ${accentColor}40`,
        borderRadius: "16px",
        padding: "16px 32px",
      }}>
        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "1px" }}>
          Room ID
        </p>
        <p style={{
          color: accentColor, fontSize: "28px", fontWeight: "800",
          margin: 0, letterSpacing: "3px",
        }}>
          {roomId}
        </p>
      </div>

      {/* Players joined */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "280px" }}>
        {players.map(p => (
          <div key={p.uid} style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "#1a1a2e", border: "1.5px solid #2a2a4a",
            borderRadius: "12px", padding: "10px 16px",
          }}>
            <div style={{
              width: "10px", height: "10px", borderRadius: "50%",
              background: "#06d6a0", flexShrink: 0,
            }} />
            <span style={{ color: "white", fontSize: "15px", fontWeight: "600" }}>{p.name}</span>
            <span style={{ color: "#06d6a0", fontSize: "12px", marginLeft: "auto" }}>Joined ✓</span>
          </div>
        ))}

        {/* Empty slot */}
        {players.length < 2 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "#1a1a2e", border: "1.5px dashed #2a2a4a",
            borderRadius: "12px", padding: "10px 16px",
          }}>
            <div style={{
              width: "10px", height: "10px", borderRadius: "50%",
              background: "#333", flexShrink: 0,
            }} />
            <span style={{ color: "#444", fontSize: "15px" }}>
              Waiting for opponent{dots}
            </span>
          </div>
        )}
      </div>

      {players.length < 2 && (
        <p style={{ color: "#444", fontSize: "13px", margin: 0 }}>
          Game starts automatically when both players join
        </p>
      )}
    </div>
  );
}
