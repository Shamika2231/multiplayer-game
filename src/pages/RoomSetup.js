import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
 
const GAME_META = {
  rps:    { label: "Rock Paper Scissors", emoji: "✊", color: "#f72585", path: "/play/rps" },
  emoji:  { label: "Emoji Guess",         emoji: "😀", color: "#ffbe0b", path: "/play/emoji" },
  ttt:    { label: "Tic Tac Toe",         emoji: "⭕", color: "#3a86ff", path: "/play/ttt" },
  memory: { label: "Memory Match",        emoji: "🃏", color: "#06d6a0", path: "/play/memory" },
};
 
const CARD_EMOJIS = ["🍎","🍕","🚗","🐶","⭐","🔥","🎮","🏀"];
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
 
export default function RoomSetup() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const meta = GAME_META[gameId] || GAME_META.rps;
 
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 
  // Get avatar from sessionStorage (picked on Lobby page)
  const getSavedAvatar = () => {
    try { return JSON.parse(sessionStorage.getItem("playerAvatar")); }
    catch { return null; }
  };
 
  const baseDoc = () => ({
    players: [],
    moves: {}, result: "", game: gameId, emoji: "", answer: "", round: 1,
    tttBoard: Array(9).fill(""), tttTurn: "", tttResult: "",
    memCards: [], memFlipped: [], memMatched: [],
    memTurn: "", memScores: {}, memResult: "",
  });
 
  const saveToSession = (roomId, name) => {
    sessionStorage.setItem("roomId", roomId);
    sessionStorage.setItem("playerName", name);
    sessionStorage.setItem("gameId", gameId);
  };
 
  const handleCreate = async () => {
    if (!roomId.trim() || !name.trim()) return setError("Please fill in both fields.");
    setLoading(true); setError("");
    try {
      const avatar = getSavedAvatar();
      const newCards = gameId === "memory" ? shuffle([...CARD_EMOJIS, ...CARD_EMOJIS]) : [];
      await setDoc(doc(db, "rooms", roomId), {
        ...baseDoc(),
        players: [{ 
          name: name.trim(), 
          uid: Date.now().toString(), 
          score: 0,
          avatar: avatar?.emoji || "🐾",
        }],
        tttTurn: name.trim(),
        memCards: newCards,
        memTurn: name.trim(),
      });
      saveToSession(roomId, name.trim());
      navigate(meta.path);
    } catch (e) {
      setError("Failed to create room. Try again.");
    }
    setLoading(false);
  };
 
  const handleJoin = async () => {
    if (!roomId.trim() || !name.trim()) return setError("Please fill in both fields.");
    setLoading(true); setError("");
    try {
      const snap = await getDoc(doc(db, "rooms", roomId));
      if (!snap.exists()) { setError("Room not found. Check the Room ID."); setLoading(false); return; }
      const avatar = getSavedAvatar();
      const exists = snap.data().players?.some(p => p.name === name.trim());
      if (!exists) {
        await updateDoc(doc(db, "rooms", roomId), {
          players: arrayUnion({ 
            name: name.trim(), 
            uid: Date.now().toString(), 
            score: 0,
            avatar: avatar?.emoji || "🐾",
          }),
        });
      }
      saveToSession(roomId, name.trim());
      navigate(meta.path);
    } catch (e) {
      setError("Failed to join room. Try again.");
    }
    setLoading(false);
  };
 
  // Get selected avatar to show preview
  const savedAvatar = getSavedAvatar();
 
  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#0f0f1a",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif", padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
 
        {/* Back */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none", border: "none", color: "#666",
            cursor: "pointer", fontSize: "14px", marginBottom: "28px",
            padding: 0, display: "flex", alignItems: "center", gap: "6px",
          }}
        >
          ← Back to games
        </button>
 
        {/* Card */}
        <div style={{
          background: "#1a1a2e",
          border: `1.5px solid ${meta.color}30`,
          borderRadius: "24px", padding: "36px",
          boxShadow: `0 0 60px ${meta.color}15`,
        }}>
          {/* Game badge */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "20px",
              background: `${meta.color}18`, border: `1.5px solid ${meta.color}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "34px", margin: "0 auto 14px",
            }}>
              {meta.emoji}
            </div>
            <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "700", color: "white" }}>
              {meta.label}
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
              Create a room or join an existing one
            </p>
          </div>
 
          {/* Avatar preview */}
          {savedAvatar && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "#0f0f1a", borderRadius: "12px",
              padding: "10px 14px", marginBottom: "16px",
              border: "1.5px solid #ffffff10",
            }}>
              <span style={{ fontSize: "26px" }}>{savedAvatar.emoji}</span>
              <div>
                <div style={{ fontSize: "13px", color: "#888" }}>Playing as</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "white" }}>{savedAvatar.name}</div>
              </div>
            </div>
          )}
 
          {/* Inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            <input
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Room ID (share with friend)"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              style={inputStyle}
            />
          </div>
 
          {error && (
            <p style={{ color: "#f72585", fontSize: "13px", marginBottom: "14px", textAlign: "center" }}>
              {error}
            </p>
          )}
 
          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleCreate}
              disabled={loading}
              style={{
                flex: 1, padding: "13px", borderRadius: "12px",
                background: meta.color, border: "none",
                color: "#0f0f1a", fontWeight: "700", fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "opacity 0.2s, transform 0.1s",
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              Create Room
            </button>
            <button
              onClick={handleJoin}
              disabled={loading}
              style={{
                flex: 1, padding: "13px", borderRadius: "12px",
                background: "transparent",
                border: `1.5px solid ${meta.color}60`,
                color: meta.color, fontWeight: "700", fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "opacity 0.2s, transform 0.1s",
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              Join Room
            </button>
          </div>
 
          <p style={{ textAlign: "center", color: "#444", fontSize: "12px", marginTop: "20px", marginBottom: 0 }}>
            Share the Room ID with your friend to play together
          </p>
        </div>
      </div>
    </div>
  );
}
 
const inputStyle = {
  width: "100%", padding: "13px 16px",
  borderRadius: "12px", border: "1.5px solid #2a2a4a",
  background: "#0f0f1a", color: "white",
  fontSize: "15px", outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};