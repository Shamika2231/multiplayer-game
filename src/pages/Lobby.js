import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AVATARS = [
  { id: "lion",    emoji: "🦁", name: "Lion" },
  { id: "fox",     emoji: "🦊", name: "Fox" },
  { id: "penguin", emoji: "🐧", name: "Penguin" },
  { id: "panda",   emoji: "🐼", name: "Panda" },
  { id: "tiger",   emoji: "🐯", name: "Tiger" },
  { id: "koala",   emoji: "🐨", name: "Koala" },
  { id: "frog",    emoji: "🐸", name: "Frog" },
  { id: "rabbit",  emoji: "🐰", name: "Rabbit" },
  { id: "bear",    emoji: "🐻", name: "Bear" },
  { id: "monkey",  emoji: "🐵", name: "Monkey" },
  { id: "cat",     emoji: "🐱", name: "Cat" },
  { id: "dog",     emoji: "🐶", name: "Dog" },
];

const games = [
  {
    id: "rps",
    emoji: "✊",
    title: "Rock Paper Scissors",
    description: "Classic hand battle. Pick your move and outsmart your opponent in real time.",
    color: "#f72585",
    bg: "#2a0a1a",
    border: "#f7258540",
    players: "2 Players",
    time: "~1 min",
  },
  {
    id: "emoji",
    emoji: "😀",
    title: "Emoji Guess",
    description: "Race to guess the emoji before the timer runs out. Speed wins!",
    color: "#ffbe0b",
    bg: "#2a1f00",
    border: "#ffbe0b40",
    players: "2 Players",
    time: "10 sec",
  },
  {
    id: "ttt",
    emoji: "⭕",
    title: "Tic Tac Toe",
    description: "Three in a row takes it all. Strategy meets simplicity.",
    color: "#3a86ff",
    bg: "#0a1a2a",
    border: "#3a86ff40",
    players: "2 Players",
    time: "~2 min",
  },
  {
    id: "memory",
    emoji: "🃏",
    title: "Memory Match",
    description: "Flip cards, find pairs, beat your opponent's memory in a 4×4 grid.",
    color: "#06d6a0",
    bg: "#001a14",
    border: "#06d6a040",
    players: "2 Players",
    time: "~3 min",
  },
];

export default function Lobby() {
  const navigate = useNavigate();

  const getSavedAvatar = () => {
    try { return JSON.parse(sessionStorage.getItem("playerAvatar")); }
    catch { return null; }
  };

  const [selectedAvatar, setSelectedAvatar] = useState(getSavedAvatar);
  const [showPicker, setShowPicker] = useState(false);
  const [noAvatarWarning, setNoAvatarWarning] = useState(false);

  const handleSelectAvatar = (avatar) => {
    setSelectedAvatar(avatar);
    sessionStorage.setItem("playerAvatar", JSON.stringify(avatar));
    setShowPicker(false);
    setNoAvatarWarning(false);
  };

  const handleGameClick = (game) => {
    if (!selectedAvatar) {
      setNoAvatarWarning(true);
      setShowPicker(true);
      return;
    }
    navigate(`/setup/${game.id}`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0f0f1a",
      color: "white",
      fontFamily: "'Segoe UI', sans-serif",
      padding: "40px 20px",
    }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎮</div>
          <h1 style={{
            fontSize: "42px", fontWeight: "800", margin: "0 0 10px",
            background: "linear-gradient(90deg, #f72585, #3a86ff, #06d6a0)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Game Hub
          </h1>
          <p style={{ color: "#888", fontSize: "16px", margin: 0 }}>
            Pick a game, share your Room ID, and play with a friend!
          </p>
        </div>

        {/* Avatar Section */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          marginBottom: "40px", gap: "10px",
        }}>
          {selectedAvatar ? (
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "#1a1a2e", border: "2px solid #3a86ff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "34px",
              }}>
                {selectedAvatar.emoji}
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "16px" }}>{selectedAvatar.name}</div>
                <button
                  onClick={() => setShowPicker(true)}
                  style={{
                    background: "none", border: "none", color: "#3a86ff",
                    cursor: "pointer", fontSize: "13px", padding: 0,
                  }}
                >
                  Change avatar
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowPicker(true)}
                style={{
                  padding: "12px 28px", borderRadius: "30px",
                  background: "linear-gradient(90deg, #f72585, #3a86ff)",
                  border: "none", color: "white", fontWeight: "700",
                  fontSize: "15px", cursor: "pointer",
                }}
              >
                🐾 Pick Your Avatar to Play
              </button>
              {noAvatarWarning && (
                <p style={{ color: "#f72585", fontSize: "13px", margin: 0 }}>
                  Please pick an avatar first!
                </p>
              )}
            </>
          )}
        </div>

        {/* Avatar Picker Modal */}
        {showPicker && (
          <div
            onClick={() => setShowPicker(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#1a1a2e", borderRadius: "20px",
                padding: "28px", maxWidth: "420px", width: "90%",
                border: "1.5px solid #3a86ff40",
              }}
            >
              <h2 style={{ margin: "0 0 20px", textAlign: "center", fontSize: "20px" }}>
                Choose Your Avatar
              </h2>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px",
              }}>
                {AVATARS.map((avatar) => (
                  <div
                    key={avatar.id}
                    onClick={() => handleSelectAvatar(avatar)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: "6px", padding: "12px 6px", borderRadius: "14px",
                      cursor: "pointer",
                      background: selectedAvatar?.id === avatar.id ? "#3a86ff20" : "#0f0f1a",
                      border: selectedAvatar?.id === avatar.id ? "1.5px solid #3a86ff" : "1.5px solid #ffffff10",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#3a86ff"}
                    onMouseLeave={e => {
                      if (selectedAvatar?.id !== avatar.id)
                        e.currentTarget.style.borderColor = "#ffffff10";
                    }}
                  >
                    <span style={{ fontSize: "30px" }}>{avatar.emoji}</span>
                    <span style={{ fontSize: "11px", color: "#aaa" }}>{avatar.name}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowPicker(false)}
                style={{
                  marginTop: "20px", width: "100%", padding: "10px",
                  borderRadius: "10px", background: "#ffffff10",
                  border: "none", color: "#aaa", cursor: "pointer", fontSize: "14px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Game Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: "20px",
        }}>
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => handleGameClick(game)}
              style={{
                background: game.bg,
                border: `1.5px solid ${game.border}`,
                borderRadius: "20px",
                padding: "28px",
                cursor: "pointer",
                transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 40px ${game.border}`;
                e.currentTarget.style.borderColor = game.color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = game.border;
              }}
            >
              <div style={{
                position: "absolute", top: "-30px", right: "-30px",
                width: "120px", height: "120px", borderRadius: "50%",
                background: game.color, opacity: 0.08, filter: "blur(30px)",
                pointerEvents: "none",
              }} />

              <div style={{ display: "flex", alignItems: "flex-start", gap: "18px" }}>
                <div style={{
                  width: "64px", height: "64px", borderRadius: "16px",
                  background: `${game.color}18`,
                  border: `1.5px solid ${game.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "30px", flexShrink: 0,
                }}>
                  {game.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: "700", color: "white" }}>
                    {game.title}
                  </h2>
                  <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#999", lineHeight: "1.5" }}>
                    {game.description}
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[game.players, game.time].map(tag => (
                      <span key={tag} style={{
                        fontSize: "12px", padding: "4px 10px", borderRadius: "20px",
                        background: `${game.color}15`, color: game.color,
                        border: `1px solid ${game.color}30`, fontWeight: "500",
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <span style={{
                  fontSize: "13px", fontWeight: "600", color: game.color,
                  display: "flex", alignItems: "center", gap: "4px",
                }}>
                  Play Now →
                </span>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", color: "#444", fontSize: "13px", marginTop: "48px" }}>
          All games are real-time multiplayer via Firebase 🔥
        </p>
      </div>
    </div>
  );
}
