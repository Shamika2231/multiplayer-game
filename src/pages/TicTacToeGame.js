import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc, onSnapshot, getDoc } from "firebase/firestore";
import GameLayout from "./GameLayout";
import WaitingRoom from "../components/WaitingRoom";
import winMp3 from "../sounds/win.mp3";
import clickMp3 from "../sounds/click.mp3";
import Confetti from "../components/Confetti";

function getPersonalResult(result, name) {
  if (!result) return null;
  if (result === "Draw!") return { text: "🤝 It's a Draw!", color: "white", glow: false };
  const winner = result.replace("Winner: ", "");
  if (winner === name) return { text: "🏆 You Won!", color: "gold", glow: true };
  return { text: "😔 You Lost!", color: "#aaa", glow: false };
}

export default function TicTacToeGame() {
  const navigate = useNavigate();
  const roomId = sessionStorage.getItem("roomId");
  const name = sessionStorage.getItem("playerName");

  const [players, setPlayers] = useState([]);
  const [board, setBoard] = useState(Array(9).fill(""));
  const [tttTurn, setTttTurn] = useState("");
  const [tttResult, setTttResult] = useState("");
  const [round, setRound] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastPlaced, setLastPlaced] = useState(null);
  const [animatedCells, setAnimatedCells] = useState([]);

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
        setBoard(d.tttBoard || Array(9).fill(""));
        setTttTurn(d.tttTurn || "");
        setTttResult(d.tttResult || "");
        setRound(d.round || 1);
      }
    });
    return () => unsub();
  }, [roomId, navigate]);

  const myMark = players[0]?.name === name ? "X" : "O";
  const isMyTurn = tttTurn === name;
  const personal = getPersonalResult(tttResult, name);

  const checkWinner = (b) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let [a, b2, c] of lines) {
      if (b[a] && b[a] === b[b2] && b[a] === b[c]) return b[a];
    }
    return null;
  };

  const getWinLine = (b) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let line of lines) {
      const [a, b2, c] = line;
      if (b[a] && b[a] === b[b2] && b[a] === b[c]) return line;
    }
    return [];
  };

  const winLine = getWinLine(board);

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

  const handleClick = async (index) => {
    if (!isMyTurn || board[index] !== "" || tttResult) return;
    playSound(clickSound);
    setLastPlaced(index);
    setAnimatedCells(prev => [...prev, index]);
    setTimeout(() => setLastPlaced(null), 400);
    const newBoard = [...board];
    newBoard[index] = myMark;
    const winner = checkWinner(newBoard);
    const isDraw = !winner && newBoard.every(c => c !== "");
    const nextTurn = players.find(p => p.name !== name)?.name || name;
    await updateDoc(doc(db, "rooms", roomId), {
      tttBoard: newBoard,
      tttTurn: nextTurn,
      tttResult: winner ? `Winner: ${name}` : isDraw ? "Draw!" : "",
    });
    if (winner) updateResult(name);
    if (isDraw) updateResult("Draw");
  };

  const resetBoard = async () => {
    playSound(clickSound);
    setAnimatedCells([]);
    await updateDoc(doc(db, "rooms", roomId), {
      tttBoard: Array(9).fill(""),
      tttTurn: players[0]?.name || "",
      tttResult: "", result: "",
      round: round + 1,
    });
    setShowConfetti(false);
  };

  if (players.length < 2) {
    return (
      <GameLayout title="Tic Tac Toe" emoji="⭕" accentColor="#3a86ff" players={players} round={round}>
        <WaitingRoom roomId={roomId} players={players} accentColor="#3a86ff" gameEmoji="⭕" gameName="Tic Tac Toe" />
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Tic Tac Toe" emoji="⭕" accentColor="#3a86ff" players={players} round={round}>
      <Confetti active={showConfetti} />
      <audio ref={winSound} src={winMp3} preload="auto" />
      <audio ref={clickSound} src={clickMp3} preload="auto" />

      <style>{`
        @keyframes markPop {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          60%  { transform: scale(1.3) rotate(5deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
        }
        @keyframes winPulse {
          0%,100% { box-shadow: 0 0 10px #3a86ff, 0 0 20px #3a86ff40; border-color: #3a86ff; }
          50%     { box-shadow: 0 0 24px #3a86ff, 0 0 48px #3a86ff80; border-color: #7cb4ff; }
        }
        @keyframes cellBounce {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.12); }
          70%  { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
        @keyframes resultPop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
          You are{" "}
          <strong style={{ color: myMark === "X" ? "#f72585" : "#3a86ff", fontSize: "16px" }}>
            {myMark}
          </strong>
        </p>

        {!tttResult && (
          <p style={{ color: isMyTurn ? "#06d6a0" : "#aaa", marginBottom: "20px", fontSize: "15px", fontWeight: "600" }}>
            {isMyTurn ? `Your turn (${myMark})` : `Waiting for ${tttTurn}...`}
          </p>
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 100px)",
          gap: "10px",
          justifyContent: "center",
          margin: "0 auto 28px",
        }}>
          {board.map((cell, i) => {
            const isWin = winLine.includes(i);
            const isNew = lastPlaced === i;
            const wasAnimated = animatedCells.includes(i);
            return (
              <button
                key={i}
                onClick={() => handleClick(i)}
                style={{
                  width: "100px", height: "100px",
                  fontSize: "40px", fontWeight: "bold",
                  background: isWin ? "#0a1a2e" : "#1a1a2e",
                  color: cell === "X" ? "#f72585" : "#3a86ff",
                  border: `2px solid ${isWin ? "#3a86ff" : "#2a2a4a"}`,
                  borderRadius: "16px",
                  cursor: isMyTurn && !cell && !tttResult ? "pointer" : "default",
                  transition: "border-color 0.2s, background 0.2s",
                  animation: isWin ? "winPulse 1.2s ease-in-out infinite" : isNew ? "cellBounce 0.35s ease" : "none",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={e => { if (isMyTurn && !cell && !tttResult) e.currentTarget.style.borderColor = "#3a86ff"; }}
                onMouseLeave={e => { if (!isWin) e.currentTarget.style.borderColor = "#2a2a4a"; }}
              >
                <span style={{
                  display: "inline-block",
                  animation: wasAnimated && cell ? "markPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
                }}>
                  {cell}
                </span>
              </button>
            );
          })}
        </div>

        {personal && (
          <div style={{ animation: "resultPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
            <h2 style={{
              fontSize: "36px", fontWeight: "800",
              color: personal.color,
              marginBottom: "6px",
              textShadow: personal.glow ? "0 0 24px gold" : "none",
            }}>
              {personal.text}
            </h2>
            {tttResult.startsWith("Winner") && (
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
                {tttResult.replace("Winner: ", "")} wins this round
              </p>
            )}
            <button onClick={resetBoard} style={{
              padding: "12px 28px", borderRadius: "12px",
              background: "#3a86ff20", border: "1.5px solid #3a86ff50",
              color: "#3a86ff", fontWeight: "700", fontSize: "15px", cursor: "pointer",
            }}>
              🔄 Play Again
            </button>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
