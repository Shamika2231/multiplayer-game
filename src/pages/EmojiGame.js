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

const emojiList = [
  { emoji: "🍎", answer: "apple" }, { emoji: "🍕", answer: "pizza" },
  { emoji: "🍔", answer: "burger" }, { emoji: "🍟", answer: "fries" },
  { emoji: "🍩", answer: "donut" }, { emoji: "🍫", answer: "chocolate" },
  { emoji: "🍦", answer: "icecream" }, { emoji: "🍌", answer: "banana" },
  { emoji: "🍇", answer: "grapes" }, { emoji: "🍉", answer: "watermelon" },
  { emoji: "🚗", answer: "car" }, { emoji: "🏍️", answer: "bike" },
  { emoji: "✈️", answer: "airplane" }, { emoji: "🚂", answer: "train" },
  { emoji: "🚢", answer: "ship" }, { emoji: "🏠", answer: "house" },
  { emoji: "🏫", answer: "school" }, { emoji: "💻", answer: "computer" },
  { emoji: "📱", answer: "mobile" }, { emoji: "🎧", answer: "headphones" },
  { emoji: "📷", answer: "camera" }, { emoji: "🎮", answer: "game" },
  { emoji: "⚽", answer: "football" }, { emoji: "🏀", answer: "basketball" },
  { emoji: "🎾", answer: "tennis" }, { emoji: "🏏", answer: "cricket" },
  { emoji: "🐶", answer: "dog" }, { emoji: "🐱", answer: "cat" },
  { emoji: "🐼", answer: "panda" }, { emoji: "🐵", answer: "monkey" },
  { emoji: "🦁", answer: "lion" }, { emoji: "🐯", answer: "tiger" },
  { emoji: "🧠", answer: "brain" }, { emoji: "❤️", answer: "heart" },
  { emoji: "🔥", answer: "fire" }, { emoji: "🌧️", answer: "rain" },
  { emoji: "☀️", answer: "sun" }, { emoji: "🌙", answer: "moon" },
  { emoji: "⭐", answer: "star" }, { emoji: "🌍", answer: "earth" },
  { emoji: "🎂", answer: "cake" }, { emoji: "🍿", answer: "popcorn" },
  { emoji: "🎁", answer: "gift" }, { emoji: "🎈", answer: "balloon" },
  { emoji: "🕹️", answer: "joystick" }, { emoji: "📚", answer: "books" },
];

function getPersonalResult(result, name) {
  if (!result) return null;
  if (result === "Draw!") return { text: "🤝 It's a Draw!", color: "white", glow: false };
  const winner = result.replace("Winner: ", "");
  if (winner === name) return { text: "🏆 You Won!", color: "gold", glow: true };
  return { text: "😔 You Lost!", color: "#aaa", glow: false };
}

export default function EmojiGame() {
  const navigate = useNavigate();
  const roomId = sessionStorage.getItem("roomId");
  const name = sessionStorage.getItem("playerName");

  const [players, setPlayers] = useState([]);
  const [emoji, setEmoji] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState("");
  const [round, setRound] = useState(1);
  const [guess, setGuess] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameOverPlayed, setGameOverPlayed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [emojiKey, setEmojiKey] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);

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
        setEmoji(d.emoji || "");
        setAnswer(d.answer || "");
        setResult(d.result || "");
        setRound(d.round || 1);
        if (d.emoji) setEmojiKey(k => k + 1);
      }
    });
    return () => unsub();
  }, [roomId, navigate]);

  const nextRound = useCallback(async () => {
    await updateDoc(doc(db, "rooms", roomId), {
      moves: {}, result: "", emoji: "", answer: "", round: round + 1,
    });
    setTimeLeft(10);
    setGameOverPlayed(false);
    setShowConfetti(false);
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
    if (winnerName !== "Draw" && winnerName === name) {
      playSound(winSound);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
    setTimeout(nextRound, 3000);
  }, [roomId, nextRound, playSound, name]);

  const generateEmoji = async () => {
    playSound(clickSound);
    const r = emojiList[Math.floor(Math.random() * emojiList.length)];
    await updateDoc(doc(db, "rooms", roomId), { emoji: r.emoji, answer: r.answer, result: "" });
    setTimeLeft(10);
    setGameOverPlayed(false);
  };

  const submitGuess = () => {
    if (guess.trim().toLowerCase() === answer.toLowerCase()) {
      updateResult(name);
    } else {
      setShake(true);
      setWrongFlash(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setWrongFlash(false), 400);
    }
    setGuess("");
  };

  const personal = getPersonalResult(result, name);

  if (players.length < 2) {
    return (
      <GameLayout title="Emoji Guess" emoji="😀" accentColor="#ffbe0b" players={players} round={round}>
        <WaitingRoom roomId={roomId} players={players} accentColor="#ffbe0b" gameEmoji="😀" gameName="Emoji Guess" />
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Emoji Guess" emoji="😀" accentColor="#ffbe0b" players={players} round={round}>
      <Confetti active={showConfetti} />
      <audio ref={winSound} src={winMp3} preload="auto" />
      <audio ref={clickSound} src={clickMp3} preload="auto" />
      <audio ref={gameOverSound} src={gameoverMp3} preload="auto" />

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-8px); }
          40%,80% { transform: translateX(8px); }
        }
        @keyframes emojiBounceIn {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          55%  { transform: scale(1.3) rotate(6deg);  opacity: 1; }
          75%  { transform: scale(0.9) rotate(-2deg); }
          100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
        }
        @keyframes wrongFlash {
          0%,100% { background: transparent; }
          50%     { background: #2a0a1a; }
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

      <div style={{ textAlign: "center" }}>
        {/* Timer */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{
            display: "inline-block", padding: "8px 24px", borderRadius: "30px",
            background: timeLeft <= 3 ? "#2a1f00" : "#1a1a2e",
            border: `1.5px solid ${timeLeft <= 3 ? "#ffbe0b" : "#2a2a4a"}`,
            color: timeLeft <= 3 ? "#ffbe0b" : "#aaa",
            fontSize: "15px", fontWeight: "600",
            transition: "all 0.3s",
            animation: timeLeft <= 3 && timeLeft > 0 ? "timerPulse 0.5s ease infinite" : "none",
          }}>
            ⏱ {timeLeft}s
          </div>
        </div>

        {/* Emoji display */}
        <div style={{
          fontSize: "96px", lineHeight: 1, marginBottom: "28px",
          minHeight: "110px", display: "flex", alignItems: "center", justifyContent: "center",
          animation: wrongFlash ? "wrongFlash 0.4s ease" : "none",
          borderRadius: "20px", padding: "10px",
        }}>
          {emoji
            ? <span key={emojiKey} style={{ display: "inline-block", animation: "emojiBounceIn 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>{emoji}</span>
            : <span style={{ fontSize: "32px", color: "#444" }}>Press "New Emoji" to start</span>
          }
        </div>

        <button
          onClick={generateEmoji}
          style={{
            padding: "10px 28px", borderRadius: "12px",
            background: "#ffbe0b20", border: "1.5px solid #ffbe0b50",
            color: "#ffbe0b", fontWeight: "600", fontSize: "15px",
            cursor: "pointer", marginBottom: "28px",
            transition: "transform 0.15s, background 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.background = "#ffbe0b30"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "#ffbe0b20"; }}
        >
          🔀 New Emoji
        </button>

        {/* Guess input */}
        {emoji && !result && (
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <input
              value={guess}
              onChange={e => setGuess(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitGuess()}
              placeholder="Type your guess..."
              style={{
                padding: "12px 18px", borderRadius: "12px",
                border: `1.5px solid ${shake ? "#f72585" : "#2a2a4a"}`,
                background: "#1a1a2e", color: "white", fontSize: "15px",
                outline: "none", width: "220px",
                animation: shake ? "shake 0.4s ease" : "none",
                transition: "border-color 0.2s",
              }}
            />
            <button
              onClick={submitGuess}
              style={{
                padding: "12px 24px", borderRadius: "12px",
                background: "#ffbe0b", border: "none",
                color: "#0f0f1a", fontWeight: "700", fontSize: "15px",
                cursor: "pointer", transition: "transform 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Guess!
            </button>
          </div>
        )}

        {result && personal && (
          <div style={{ animation: "resultPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards", marginTop: "20px" }}>
            <h2 style={{
              fontSize: "36px", fontWeight: "800",
              color: personal.color,
              marginBottom: "6px",
              textShadow: personal.glow ? "0 0 24px gold" : "none",
            }}>
              {personal.text}
            </h2>
            {result.startsWith("Winner") && (
              <p style={{ color: "#666", fontSize: "14px" }}>
                {result.replace("Winner: ", "")} guessed it first!
              </p>
            )}
          </div>
        )}
      </div>
    </GameLayout>
  );
}
