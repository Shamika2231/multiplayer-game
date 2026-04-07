import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lobby from "./pages/Lobby";
import RoomSetup from "./pages/RoomSetup";
import RPSGame from "./pages/RPSGame";
import EmojiGame from "./pages/EmojiGame";
import TicTacToeGame from "./pages/TicTacToeGame";
import MemoryGame from "./pages/MemoryGame";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/setup/:gameId" element={<RoomSetup />} />
        <Route path="/play/rps" element={<RPSGame />} />
        <Route path="/play/emoji" element={<EmojiGame />} />
        <Route path="/play/ttt" element={<TicTacToeGame />} />
        <Route path="/play/memory" element={<MemoryGame />} />
      </Routes>
    </BrowserRouter>
  );
}
