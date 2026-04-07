import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

function Scoreboard({ roomId }) {
  const [scores, setScores] = useState({});

  useEffect(() => {
    const roomRef = doc(db, "rooms", roomId);

    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setScores(data.scores || {});
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  return (
    <div>
      <h2>Scoreboard</h2>
      {Object.entries(scores).map(([uid, score]) => (
        <p key={uid}>
          {uid}: {score}
        </p>
      ))}
    </div>
  );
}

export default Scoreboard;