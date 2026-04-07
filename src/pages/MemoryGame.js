import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc, onSnapshot, getDoc } from "firebase/firestore";
import GameLayout from "./GameLayout";
import WaitingRoom from "../components/WaitingRoom";
import winMp3 from "../sounds/win.mp3";
import clickMp3 from "../sounds/click.mp3";
import Confetti from "../components/Confetti";

const CARD_EMOJIS = ["🍎","🍕","🚗","🐶","⭐","🔥","🎮","🏀"];
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPersonalResult(result, name) {
  if (!result) return null;
  if (result === "Draw!") return { text: "🤝 It's a Draw!", color: "white", glow: false };
  const winner = result.replace("Winner: ", "");
  if (winner === name) return { text: "🏆 You Won!", color: "gold", glow: true };
  return { text: "😔 You Lost!", color: "#aaa", glow: false };
}

export default function MemoryGamePage() {
  const navigate = useNavigate();
  const roomId = sessionStorage.getItem("roomId");
  const name = sessionStorage.getItem("playerName");

  const [players, setPlayers] = useState([]);
  const [memCards, setMemCards] = useState([]);
  const [memFlipped, setMemFlipped] = useState([]);
  const [memMatched, setMemMatched] = useState([]);
  const [memTurn, setMemTurn] = useState("");
  const [memScores, setMemScores] = useState({});
  const [memResult, setMemResult] = useState("");
  const [round, setRound] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [justMatched, setJustMatched] = useState([]);
  const [mismatch, setMismatch] = useState([]);
  const [animKeys, setAnimKeys] = useState({});

  const winSound = useRef(null);
  const clickSound = useRef(null);

  const playSound = useCallback((ref) => {
    if (ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); }
  }, []);

  useEffect(() => {
    if (!roomId) { navigate("/"); return; }
    const unsub = onSnapshot(doc(db, "rooms", roomId), snap => {
      if (snap.exists()) {
        const d = snap.data();
        setPlayers(d.players || []);
        setMemCards(d.memCards || []);
        setMemFlipped(d.memFlipped || []);
        setMemMatched(d.memMatched || []);
        setMemTurn(d.memTurn || "");
        setMemScores(d.memScores || {});
        setMemResult(d.memResult || "");
        setRound(d.round || 1);
      }
    });
    return () => unsub();
  }, [roomId, navigate]);

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
    if (winnerName !== "Draw" && winnerName === name) {
      playSound(winSound);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [roomId, playSound, name]);

  const isMyTurn = memTurn === name;
  const flipped = memFlipped || [];
  const matched = memMatched || [];
  const personal = getPersonalResult(memResult, name);

  const handleFlip = async (index) => {
    if (!isMyTurn) return;
    if (flipped.length >= 2) return;
    if (flipped.includes(index)) return;
    if (matched.includes(index)) return;
    if (memResult) return;

    playSound(clickSound);
    setAnimKeys(prev => ({ ...prev, [index]: (prev[index] || 0) + 1 }));

    const newFlipped = [...flipped, index];
    const ref = doc(db, "rooms", roomId);

    if (newFlipped.length === 2) {
      const [a, b] = newFlipped;
      const isMatch = memCards[a] === memCards[b];
      await updateDoc(ref, { memFlipped: newFlipped });

      if (isMatch) {
        setJustMatched([a, b]);
        setTimeout(() => setJustMatched([]), 700);
        const newMatched = [...matched, a, b];
        const newScores = { ...(memScores || {}) };
        newScores[name] = (newScores[name] || 0) + 1;
        const allMatched = newMatched.length === memCards.length;
        let winner = "";
        if (allMatched) {
          const scores = players.map(p => ({ name: p.name, score: newScores[p.name] || 0 }));
          scores.sort((a, b) => b.score - a.score);
          winner = scores[0].score === scores[1]?.score ? "Draw" : scores[0].name;
        }
        setTimeout(async () => {
          await updateDoc(ref, {
            memFlipped: [],
            memMatched: newMatched,
            memScores: newScores,
            memTurn: name,
            memResult: allMatched ? (winner === "Draw" ? "Draw!" : `Winner: ${winner}`) : "",
          });
          if (allMatched) updateResult(winner === "Draw" ? "Draw" : winner);
        }, 700);
      } else {
        setMismatch([a, b]);
        setTimeout(() => setMismatch([]), 600);
        setTimeout(async () => {
          const nextTurn = players.find(p => p.name !== name)?.name || name;
          await updateDoc(ref, { memFlipped: [], memTurn: nextTurn });
        }, 1000);
      }
    } else {
      await updateDoc(ref, { memFlipped: newFlipped });
    }
  };

  const resetMemory = async () => {
    playSound(clickSound);
    const newCards = shuffle([...CARD_EMOJIS, ...CARD_EMOJIS]);
    setAnimKeys({});
    await updateDoc(doc(db, "rooms", roomId), {
      memCards: newCards, memFlipped: [], memMatched: [],
      memTurn: players[0]?.name || "",
      memScores: {}, memResult: "", result: "",
      round: round + 1,
    });
    setShowConfetti(false);
  };

  if (players.length < 2) {
    return (
      <GameLayout title="Memory Match" emoji="🃏" accentColor="#06d6a0" players={players} round={round}>
        <WaitingRoom roomId={roomId} players={players} accentColor="#06d6a0" gameEmoji="🃏" gameName="Memory Match" />
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Memory Match" emoji="🃏" accentColor="#06d6a0" players={players} round={round}>
      <Confetti active={showConfetti} />
      <audio ref={winSound} src={winMp3} preload="auto" />
      <audio ref={clickSound} src={clickMp3} preload="auto" />

      <style>{`
        @keyframes cardReveal {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);  opacity: 1; }
        }
        @keyframes matchBounce {
          0%   { transform: scale(1); }
          25%  { transform: scale(1.35); }
          50%  { transform: scale(0.9); }
          75%  { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes mismatchShake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-6px); }
          40%,80% { transform: translateX(6px); }
        }
        @keyframes resultPop {
          0%   { transform: scale(0.4); opacity: 0; }
          65%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1);  opacity: 1; }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 10px #06d6a060; }
          50%     { box-shadow: 0 0 22px #06d6a0cc; }
        }
        .mem-card:hover.clickable {
          transform: scale(1.08) translateY(-3px);
          border-color: #06d6a0 !important;
        }
      `}</style>

      <div style={{ textAlign: "center" }}>
        {!memResult && (
          <p style={{ color: isMyTurn ? "#06d6a0" : "#aaa", marginBottom: "12px", fontSize: "15px", fontWeight: "600" }}>
            {isMyTurn ? "Your turn — pick a card!" : `Waiting for ${memTurn}...`}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          {players.map(p => (
            <div key={p.name} style={{
              padding: "6px 18px", borderRadius: "20px",
              background: memTurn === p.name && !memResult ? "#001a14" : "#1a1a2e",
              border: `1.5px solid ${memTurn === p.name && !memResult ? "#06d6a0" : "#2a2a4a"}`,
              fontSize: "14px", color: "white", fontWeight: "600",
              transition: "all 0.3s",
            }}>
              {p.avatar || "🐾"} {p.name}: <span style={{ color: "#06d6a0" }}>{memScores?.[p.name] || 0} pairs</span>
            </div>
          ))}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 82px)",
          gap: "12px",
          justifyContent: "center",
          margin: "0 auto 28px",
        }}>
          {(memCards || []).map((emoji, i) => {
            const isFlipped = flipped.includes(i);
            const isMatched = matched.includes(i);
            const revealed = isFlipped || isMatched;
            const clickable = isMyTurn && !revealed && !memResult && flipped.length < 2;
            const isJustMatched = justMatched.includes(i);
            const isMismatch = mismatch.includes(i);

            let animation = "none";
            if (isJustMatched) animation = "matchBounce 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards";
            else if (isMismatch) animation = "mismatchShake 0.5s ease forwards";
            else if (revealed) animation = "cardReveal 0.3s ease forwards";

            return (
              <div
                key={`card-${i}-${animKeys[i] || 0}`}
                className={`mem-card${clickable ? " clickable" : ""}`}
                onClick={() => handleFlip(i)}
                style={{
                  width: "82px", height: "82px", borderRadius: "14px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "34px",
                  cursor: clickable ? "pointer" : "default",
                  background: isMatched ? "#001a14" : revealed ? "#0a1a2e" : "#1a1a2e",
                  border: `2px solid ${isMatched ? "#06d6a0" : revealed ? "#3a86ff" : "#2a2a4a"}`,
                  animation: isMatched ? "glowPulse 2s ease infinite" : animation,
                  userSelect: "none",
                  opacity: isMatched ? 0.7 : 1,
                  transition: "background 0.2s, border-color 0.2s",
                }}
              >
                {revealed ? emoji : "❓"}
              </div>
            );
          })}
        </div>

        {personal && (
          <div style={{ animation: "resultPop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
            <h2 style={{
              fontSize: "36px", fontWeight: "800",
              color: personal.color,
              marginBottom: "6px",
              textShadow: personal.glow ? "0 0 24px gold" : "none",
            }}>
              {personal.text}
            </h2>
            {memResult.startsWith("Winner") && (
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
                {memResult.replace("Winner: ", "")} wins this round
              </p>
            )}
            <button onClick={resetMemory} style={{
              padding: "12px 28px", borderRadius: "12px",
              background: "#06d6a020", border: "1.5px solid #06d6a050",
              color: "#06d6a0", fontWeight: "700", fontSize: "15px", cursor: "pointer",
            }}>
              🔄 Play Again
            </button>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
