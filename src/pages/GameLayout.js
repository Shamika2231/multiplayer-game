import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function FloatingBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function rnd(a, b) { return a + Math.random() * (b - a); }

    const palette = [
      { top: "#a78bfa", left: "#4c1d95", right: "#6d28d9", dot: "#fde68a" },
      { top: "#67e8f9", left: "#0e7490", right: "#0891b2", dot: "#fbbf24" },
      { top: "#86efac", left: "#065f46", right: "#059669", dot: "#f472b6" },
      { top: "#fca5a5", left: "#7f1d1d", right: "#b91c1c", dot: "#a5f3fc" },
      { top: "#fcd34d", left: "#78350f", right: "#b45309", dot: "#c4b5fd" },
      { top: "#f9a8d4", left: "#831843", right: "#be185d", dot: "#bbf7d0" },
    ];

    const brightCols = [
      "#a78bfa","#67e8f9","#86efac","#fca5a5",
      "#fcd34d","#f9a8d4","#fb923c","#38bdf8",
      "#4ade80","#e879f9",
    ];

    function draw3DDice(x, y, s, rot, alpha, face, pal) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(rot);
      const iso = s * 0.52;
      ctx.beginPath(); ctx.moveTo(0,-iso); ctx.lineTo(iso,-iso*0.5); ctx.lineTo(0,0); ctx.lineTo(-iso,-iso*0.5); ctx.closePath();
      ctx.fillStyle = pal.top; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 0.7; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-iso,-iso*0.5); ctx.lineTo(0,0); ctx.lineTo(0,iso); ctx.lineTo(-iso,iso*0.5); ctx.closePath();
      ctx.fillStyle = pal.left; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(iso,-iso*0.5); ctx.lineTo(0,0); ctx.lineTo(0,iso); ctx.lineTo(iso,iso*0.5); ctx.closePath();
      ctx.fillStyle = pal.right; ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.fill(); ctx.stroke();
      ctx.fillStyle = pal.dot;
      const dotR = s * 0.058;
      const dots = {
        1:[[0,0]], 2:[[-0.14,-0.14],[0.14,0.14]], 3:[[-0.16,-0.14],[0,0],[0.16,0.14]],
        4:[[-0.14,-0.15],[0.14,-0.15],[-0.14,0.15],[0.14,0.15]],
        5:[[-0.14,-0.15],[0.14,-0.15],[0,0],[-0.14,0.15],[0.14,0.15]],
        6:[[-0.14,-0.16],[0.14,-0.16],[-0.14,0],[0.14,0],[-0.14,0.16],[0.14,0.16]],
      };
      const cx = iso * 0.38, cy = iso * 0.22;
      (dots[face] || dots[1]).forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.arc(cx+dx*s, cy+dy*s, dotR, 0, Math.PI*2); ctx.fill();
      });
      const tf = (face % 6) + 1;
      (dots[tf] || dots[1]).forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(dx*s*0.42 - dy*s*0.22, -iso*0.58 + dy*s*0.26 + dx*s*0.14, dotR*0.82, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.restore();
    }

    function drawController(x, y, s, rot, alpha, col) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = col + "33"; ctx.strokeStyle = col; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(0,0,s,s*0.6,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-s*0.62,s*0.38,s*0.3,s*0.45,-0.3,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s*0.62,s*0.38,s*0.3,s*0.45,0.3,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1;
      const dp = s * 0.16;
      ctx.beginPath(); ctx.moveTo(-s*0.5,-dp); ctx.lineTo(-s*0.5,dp); ctx.moveTo(-s*0.5-dp,0); ctx.lineTo(-s*0.5+dp,0); ctx.stroke();
      const bcols = ["#f87171","#60a5fa","#34d399","#fbbf24"];
      [[s*0.46,-s*0.1],[s*0.6,0],[s*0.46,s*0.1],[s*0.32,0]].forEach(([bx,by],i) => {
        ctx.fillStyle = bcols[i]; ctx.beginPath(); ctx.arc(bx,by,s*0.09,0,Math.PI*2); ctx.fill();
      });
      ctx.restore();
    }

    function drawCard(x, y, s, rot, alpha, col, suit) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y); ctx.rotate(rot);
      const w = s * 0.65, h = s;
      ctx.fillStyle = "#0f0f2a"; ctx.strokeStyle = col; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(-w/2,-h/2,w,h,s*0.09); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col;
      ctx.font = `bold ${s*0.38}px sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(suit, 0, 0);
      ctx.restore();
    }

    function drawChip(x, y, s, rot, alpha, col) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = "#111128"; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(0,0,s*0.68,0,Math.PI*2); ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + rot;
        ctx.fillStyle = i % 2 === 0 ? col + "99" : col + "33";
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*s*0.68, Math.sin(a)*s*0.68);
        ctx.arc(0, 0, s, a, a + Math.PI/4);
        ctx.lineTo(Math.cos(a+Math.PI/4)*s*0.68, Math.sin(a+Math.PI/4)*s*0.68);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawStar(x, y, r, rot, alpha, col) {
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x,y); ctx.rotate(rot);
      ctx.fillStyle = col; ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
        const ia = a + 2 * Math.PI / 5;
        i === 0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
        ctx.lineTo(Math.cos(ia)*r*0.4, Math.sin(ia)*r*0.4);
      }
      ctx.closePath(); ctx.fill(); ctx.restore();
    }

    const suits = ["♠","♥","♦","♣"];
    const objects = [];

    for (let i = 0; i < 14; i++) {
      const pal = palette[Math.floor(rnd(0, palette.length))];
      objects.push({ type:"dice", x:rnd(30,window.innerWidth-30), y:rnd(30,window.innerHeight-30), s:rnd(26,50), vx:rnd(-0.14,0.14), vy:rnd(-0.1,0.1), rot:rnd(0,Math.PI*2), rotV:rnd(-0.004,0.004), alpha:rnd(0.6,0.92), face:Math.ceil(rnd(1,6)), pal });
    }
    for (let i = 0; i < 8; i++) {
      const col = brightCols[Math.floor(rnd(0, brightCols.length))];
      objects.push({ type:"controller", x:rnd(30,window.innerWidth-30), y:rnd(30,window.innerHeight-30), s:rnd(18,32), vx:rnd(-0.11,0.11), vy:rnd(-0.09,0.09), rot:rnd(-0.5,0.5), rotV:rnd(-0.003,0.003), alpha:rnd(0.5,0.82), col });
    }
    for (let i = 0; i < 8; i++) {
      const col = brightCols[Math.floor(rnd(0, brightCols.length))];
      objects.push({ type:"card", x:rnd(30,window.innerWidth-30), y:rnd(30,window.innerHeight-30), s:rnd(24,40), vx:rnd(-0.1,0.1), vy:rnd(-0.08,0.08), rot:rnd(-0.6,0.6), rotV:rnd(-0.003,0.003), alpha:rnd(0.5,0.8), col, suit:suits[Math.floor(rnd(0,4))] });
    }
    for (let i = 0; i < 6; i++) {
      const col = brightCols[Math.floor(rnd(0, brightCols.length))];
      objects.push({ type:"chip", x:rnd(30,window.innerWidth-30), y:rnd(30,window.innerHeight-30), s:rnd(12,22), vx:rnd(-0.1,0.1), vy:rnd(-0.08,0.08), rot:rnd(0,Math.PI*2), rotV:rnd(-0.005,0.005), alpha:rnd(0.45,0.75), col });
    }
    for (let i = 0; i < 9; i++) {
      const col = brightCols[Math.floor(rnd(0, brightCols.length))];
      objects.push({ type:"star", x:rnd(30,window.innerWidth-30), y:rnd(30,window.innerHeight-30), s:rnd(8,18), vx:rnd(-0.09,0.09), vy:rnd(-0.07,0.07), rot:rnd(0,Math.PI*2), rotV:rnd(-0.006,0.006), alpha:rnd(0.4,0.7), col });
    }

    const bgStars = Array.from({ length: 80 }, () => ({
      x: rnd(0, window.innerWidth), y: rnd(0, window.innerHeight),
      r: rnd(0.4, 1.6), t: rnd(0, Math.PI * 2),
    }));

    function frame() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      bgStars.forEach(s => {
        s.t += 0.018;
        ctx.globalAlpha = 0.15 + 0.15 * Math.sin(s.t);
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      objects.forEach(o => {
        if (o.type === "dice") draw3DDice(o.x, o.y, o.s, o.rot, o.alpha, o.face, o.pal);
        else if (o.type === "controller") drawController(o.x, o.y, o.s, o.rot, o.alpha, o.col);
        else if (o.type === "card") drawCard(o.x, o.y, o.s, o.rot, o.alpha, o.col, o.suit);
        else if (o.type === "chip") drawChip(o.x, o.y, o.s, o.rot, o.alpha, o.col);
        else if (o.type === "star") drawStar(o.x, o.y, o.s, o.rot, o.alpha, o.col);
        o.x += o.vx; o.y += o.vy; o.rot += o.rotV;
        if (o.x < -70) o.x = w + 70; if (o.x > w + 70) o.x = -70;
        if (o.y < -70) o.y = h + 70; if (o.y > h + 70) o.y = -70;
      });

      animId = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 0,
      }}
    />
  );
}

export default function GameLayout({ children, title, emoji, accentColor, players, round }) {
  const navigate = useNavigate();

  const getAvatar = (playerUid) => {
    try {
      const myUid = sessionStorage.getItem("playerUid");
      const myAvatar = JSON.parse(sessionStorage.getItem("playerAvatar"));
      if (myUid && myAvatar && playerUid === myUid) return myAvatar.emoji;
    } catch {}
    return null;
  };

  const getPlayerAvatar = (player) => {
    if (player.avatar) return player.avatar;
    return getAvatar(player.uid);
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#08081a",
      color: "white",
      fontFamily: "'Segoe UI', sans-serif",
      padding: "20px",
      position: "relative",
    }}>
      <FloatingBackground />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Top bar */}
        <div style={{
          maxWidth: "700px", margin: "0 auto 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "12px",
        }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none", border: "none", color: "#666",
              cursor: "pointer", fontSize: "14px",
              padding: 0, display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            ← Games
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>{emoji}</span>
            <span style={{ fontWeight: "700", fontSize: "18px" }}>{title}</span>
          </div>

          <div style={{ fontSize: "14px", color: "#666" }}>
            Round {round}
          </div>
        </div>

        {/* Players scoreboard */}
        {players && players.length > 0 && (
          <div style={{
            maxWidth: "700px", margin: "0 auto 24px",
            display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap",
          }}>
            {players.map(p => (
              <div key={p.uid} style={{
                padding: "8px 20px", borderRadius: "30px",
                background: "rgba(26,26,46,0.85)",
                backdropFilter: "blur(8px)",
                border: `1.5px solid ${accentColor}30`,
                fontSize: "14px", fontWeight: "600",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <span style={{
                  fontSize: "22px", width: "32px", height: "32px",
                  borderRadius: "50%", background: "#0f0f1a",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  border: `1.5px solid ${accentColor}40`, flexShrink: 0,
                }}>
                  {getPlayerAvatar(p) || "🐾"}
                </span>
                <span>{p.name}</span>
                <span style={{ color: accentColor, marginLeft: "4px" }}>{p.score} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* Game content */}
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
