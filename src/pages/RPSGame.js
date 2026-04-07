import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc, onSnapshot, getDoc } from "firebase/firestore";
import GameLayout from "./GameLayout";
import WaitingRoom from "../components/WaitingRoom";
import winMp3 from "../sounds/win.mp3";
import clickMp3 from "../sounds/click.mp3";
import gameoverMp3 from "../sounds/gameover.mp3";
import Confetti from "../components/Confetti";

function getPersonalResult(result, name) {
  if (!result) return null;
  if (result === "Draw!") return { text: "🤝 It's a Draw!", color: "white", glow: false };
  const winner = result.replace("Winner: ", "");
  if (winner === name) return { text: "🏆 You Won!", color: "gold", glow: true };
  return { text: "😔 You Lost!", color: "#aaa", glow: false };
}

export default function RPSGame() {
  const navigate = useNavigate();
  const roomId = sessionStorage.getItem("roomId");
  const name = sessionStorage.getItem("playerName");

  const [players, setPlayers] = useState([]);
  const [moves, setMoves] = useState({});
  const [result, setResult] = useState("");
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameOverPlayed, setGameOverPlayed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  //
  const revealAnim = useref(null);

  const winSound = useRef(null);
  const clickSound = useRef(null);
  const gameOverSound = useRef(null);

  const playSound = useCallback((ref) => {
    if (ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); }
  }, []);

  useEffect(() => {
    if (!roomId) { navigate("/"); return; }
    const unsub = onSnapshot(doc(db, "rooms", roomId), snap => {
      if (snap.exists()) {
        const d = snap.data();
        setPlayers(d.players || []);
        setMoves(d.moves || {});
        setResult(d.result || "");
        setRound(d.round || 1);
      }
    });
    return () => unsub();
  }, [roomId, navigate]);

  const nextRound = useCallback(async () => {
    await updateDoc(doc(db, "rooms", roomId), {
      moves: {}, result: "", round: round + 1,
    });
    setTimeLeft(15);
    setGameOverPlayed(false);
    setShowConfetti(false);
    setRevealAnim(false);
  }, [roomId, round]);

  useEffect(() => {
    if (players.length < 2) return;
    if (timeLeft === 0) {
      if (!gameOverPlayed) { playSound(gameOverSound); setGameOverPlayed(true); }
      return;
    }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameOverPlayed, playSound, players]);

  const updateResult = useCallback(async (winnerName) => {
    const snap = await getDoc(doc(db, "rooms", roomId));
    if (!snap.exists() || snap.data().result) return;
    const data = snap.data();
    const updated = winnerName === "Draw"
      ? data.players
      : data.players.map(p => p.name === winnerName ? { ...p, score: p.score + 1 } : p);
    await updateDoc(doc(db, "rooms", roomId), {
      result: winnerName === "Draw" ? "Draw!" : `Winner: ${winnerName}`,
      players: updated,
    });
    setRevealAnim(true);
    if (winnerName !== "Draw" && winnerName === name) {
      playSound(winSound);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
    setTimeout(nextRound, 3000);
  }, [roomId, nextRound, playSound, name]);

  useEffect(() => {
    const keys = Object.keys(moves);
    if (keys.length === 2 && !result) {
      const [p1, p2] = keys;
      const m1 = moves[p1], m2 = moves[p2];
      const winner = m1 === m2 ? "Draw"
        : (m1==="rock"&&m2==="scissors")||(m1==="paper"&&m2==="rock")||(m1==="scissors"&&m2==="paper") ? p1 : p2;
      updateResult(winner);
    }
  }, [moves, result, updateResult]);

  const playMove = async (move) => {
    playSound(clickSound);
    await updateDoc(doc(db, "rooms", roomId), { moves: { ...moves, [name]: move } });
  };

  const myMove = moves[name];
  const personal = getPersonalResult(result, name);
  const choices = [
    { id: "rock",     label: "Rock",     icon: "🪨" },
    { id: "paper",    label: "Paper",    icon: "📄" },
    { id: "scissors", label: "Scissors", icon: "✂️" },
  ];

  if (players.length < 2) {
    return (
      <GameLayout title="Rock Paper Scissors" emoji="✊" accentColor="#f72585" players={players} round={round}>
        <WaitingRoom roomId={roomId} players={players} accentColor="#f72585" gameEmoji="✊" gameName="Rock Paper Scissors" />
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Rock Paper Scissors" emoji="✊" accentColor="#f72585" players={players} round={round}>
      <Confetti active={showConfetti} />
      <audio ref={winSound} src={winMp3} preload="auto" />
      <audio ref={clickSound} src={clickMp3} preload="auto" />
      <audio ref={gameOverSound} src={gameoverMp3} preload="auto" />

      <style>{`
        @keyframes selectBounce {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.22) rotate(-4deg); }
          65%  { transform: scale(0.95) rotate(2deg); }
          100% { transform: scale(1.08) rotate(0deg); }
        }
        @keyframes revealSlide {
          0%   { transform: translateY(20px) scale(0.85); opacity: 0; }
          60%  { transform: translateY(-4px) scale(1.05); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes resultPop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes timerPulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.08); }
        }
      `}</style>

      {/* Timer */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{
          display: "inline-block", padding: "8px 24px", borderRadius: "30px",
          background: timeLeft <= 3 ? "#2a0a1a" : "#1a1a2e",
          border: `1.5px solid ${timeLeft <= 3 ? "#f72585" : "#2a2a4a"}`,
          color: timeLeft <= 3 ? "#f72585" : "#aaa",
          fontSize: "15px", fontWeight: "600",
          transition: "all 0.3s",
          animation: timeLeft <= 3 && timeLeft > 0 ? "timerPulse 0.5s ease infinite" : "none",
        }}>
          ⏱ {timeLeft}s
        </div>
      </div>

      {/* Move buttons */}
      {!result && (
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
          {choices.map(c => {
            const isSelected = myMove === c.id;
            return (
              <button
                key={c.id}
                onClick={() => !myMove && playMove(c.id)}
                style={{
                  width: "120px", height: "120px", borderRadius: "20px",
                  background: isSelected ? "#2a0a1a" : "#1a1a2e",
                  border: `2px solid ${isSelected ? "#f72585" : "#2a2a4a"}`,
                  color: "white", fontSize: "42px",
                  cursor: myMove ? "default" : "pointer",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: "6px",
                  transition: "border-color 0.18s, background 0.18s",
                  animation: isSelected ? "selectBounce 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
                  boxShadow: isSelected ? "0 0 20px #f7258540" : "none",
                }}
                onMouseEnter={e => { if (!myMove) { e.currentTarget.style.borderColor = "#f72585"; e.currentTarget.style.transform = "translateY(-6px) scale(1.05)"; }}}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#2a2a4a"; e.currentTarget.style.transform = "scale(1)"; }}}
              >
                <span>{c.icon}</span>
                <span style={{ fontSize: "12px", color: "#aaa" }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Status / Result */}
      <div style={{ textAlign: "center" }}>
        {!result && myMove && (
          <p style={{ color: "#06d6a0", fontSize: "15px", animation: "revealSlide 0.4s ease forwards" }}>
            You picked {choices.find(c => c.id === myMove)?.icon} — waiting for opponent...
          </p>
        )}
        {!result && !myMove && (
          <p style={{ color: "#aaa", fontSize: "15px" }}>Choose your move!</p>
        )}
        {result && personal && (
          <div style={{ animation: "resultPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
            <h2 style={{
              fontSize: "36px", fontWeight: "800",
              color: personal.color,
              marginBottom: "8px",
              textShadow: personal.glow ? "0 0 24px gold" : "none",
            }}>
              {personal.text}
            </h2>
            {Object.keys(moves).length === 2 && (
              <p style={{ color: "#aaa", fontSize: "16px", animation: "revealSlide 0.4s 0.15s ease both" }}>
                {Object.entries(moves).map(([p, m]) =>
                  `${p}: ${choices.find(c => c.id === m)?.icon}`
                ).join("  vs  ")}
              </p>
            )}
          </div>
        )}
      </div>
    </GameLayout>
  );
}
