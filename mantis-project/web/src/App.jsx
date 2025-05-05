import { useEffect, useState } from "react";

const COLORS = ["pink", "orange", "blue", "purple", "red", "green", "yellow"];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const generateDeck = () => {
  const deck = [];
  for (let i = 0; i < 105; i++) {
    const front = COLORS[i % COLORS.length];
    const otherColors = shuffle(COLORS.filter(c => c !== front)).slice(0, 2);
    const back = shuffle([front, ...otherColors]);
    deck.push({ id: i, front, back });
  }
  return shuffle(deck);
};

export default function App() {
  const [deck, setDeck] = useState(generateDeck());
  const [players, setPlayers] = useState([
    { id: 1, name: "Player 1", tank: {}, score: 0 },
    { id: 2, name: "CPU 1", tank: {}, score: 0 },
    { id: 3, name: "CPU 2", tank: {}, score: 0 },
    { id: 4, name: "CPU 3", tank: {}, score: 0 },
  ]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [winner, setWinner] = useState(null);
  const [stealTargetMode, setStealTargetMode] = useState(false);
  const [logMessage, setLogMessage] = useState("");
  const [flipping, setFlipping] = useState(false);
  const [flippingCard, setFlippingCard] = useState(null);


  useEffect(() => {
    if (deck.length > 0 && players.every(p => Object.keys(p.tank).length === 0)) {
      const newDeck = [...deck];
      const newPlayers = [...players];
      newPlayers.forEach((player, idx) => {
        const tank = {};
        for (let i = 0; i < 4; i++) {
          const card = newDeck.pop();
          tank[card.front] = (tank[card.front] || 0) + 1;
        }
        newPlayers[idx] = { ...player, tank };
      });
      setPlayers(newPlayers);
      setDeck(newDeck);
    }
  }, []);

  useEffect(() => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer.name.startsWith("CPU") || deck.length === 0 || winner) return;
  
    const timeout = setTimeout(() => {
      const topCard = deck[deck.length - 1];
      const canScore = topCard.back.some(color => currentPlayer.tank[color]);
      const willScore = Math.random() < 0.80; // 80% chance to score
  
      if (canScore && willScore) {
        handleScore();
      } else {
        const color = topCard.front;
        const targets = players.map((_, i) => i).filter(i => i !== currentPlayerIndex);
  
        // Steal from the target with the most of the front color
        let bestTarget = null;
        let maxCount = 0;
        targets.forEach(i => {
          const count = players[i].tank[color] || 0;
          if (count > maxCount) {
            bestTarget = i;
            maxCount = count;
          }
        });
  
        if (bestTarget === null) {
          bestTarget = targets[Math.floor(Math.random() * targets.length)];
        }
  
        handleSteal(bestTarget);
      }
    }, 2000);
  
    return () => clearTimeout(timeout);
  }, [currentPlayerIndex, deck, players, winner]);
  

  const drawCard = () => {
    const card = deck[deck.length - 1];
    if (!card) return null;
    setDeck(deck.slice(0, -1));
    return card;
  };

  const updatePlayer = (index, updates) => {
    setPlayers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const nextTurn = () => {
    setCurrentPlayerIndex((i) => (i + 1) % players.length);
  };

  const checkWin = (score, name) => {
    if (score >= 10) setWinner(name);
  };

  const animateFlip = async () => {
    setFlipping(true);
    await new Promise((res) => setTimeout(res, 500));
    setFlipping(false);
  };

// --- SCORE -------------------------------------------------
const handleScore = () => {
  if (deck.length === 0) return;

  const top = deck[deck.length - 1];          // don’t remove yet
  setFlippingCard(top);                       // show this card’s front
  setFlipping(true);                          // start the flip

  setTimeout(() => {
    const card = drawCard();                  // now remove it
    const current = players[currentPlayerIndex];
    const tank    = { ...current.tank };
    let   newScore = current.score;

    if (tank[card.front]) {
      const stolen = tank[card.front];
      delete tank[card.front];
      newScore += stolen + 1;                 // + drawn card
      setLogMessage(`${current.name} scored ${stolen + 1} ${card.front} cards!`);
    } else {
      tank[card.front] = 1;
      setLogMessage(`${current.name} missed and added a ${card.front} card.`);
    }

    updatePlayer(currentPlayerIndex, { tank, score: newScore });
    checkWin(newScore, current.name);

    // reset flip state and advance turn
    setFlipping(false);
    setFlippingCard(null);
    nextTurn();
  }, 1000);                                   // match flip duration
};

// --- STEAL -------------------------------------------------
const handleSteal = (targetIndex) => {
  if (deck.length === 0) return;

  const top = deck[deck.length - 1];
  setFlippingCard(top);
  setFlipping(true);

  setTimeout(() => {
    const card   = drawCard();
    const current = players[currentPlayerIndex];
    const target  = players[targetIndex];
    const color   = card.front;

    const newTank    = { ...current.tank };
    const targetTank = { ...target.tank };

    if (targetTank[color]) {
      const stolen = targetTank[color];
      newTank[color] = (newTank[color] || 0) + stolen + 1;
      delete targetTank[color];
      setLogMessage(`${current.name} stole ${stolen} ${color} cards from ${target.name}!`);
    } else {
      targetTank[color] = 1;
      setLogMessage(`${current.name} failed to steal. Drew a ${color} card instead.`);
    }

    const upd = [...players];
    upd[currentPlayerIndex].tank = newTank;
    upd[targetIndex].tank        = targetTank;
    setPlayers(upd);

    setFlipping(false);
    setFlippingCard(null);
    setStealTargetMode(false);
    nextTurn();
  }, 1000);
};

  
const resetGame = () => {
  const newDeck = generateDeck();
  const newPlayers = players.map(player => ({
    ...player,
    tank: {},
    score: 0,
  }));

  // Deal 4 cards to each player
  newPlayers.forEach((player, idx) => {
    const tank = {};
    for (let i = 0; i < 4; i++) {
      const card = newDeck.pop();
      tank[card.front] = (tank[card.front] || 0) + 1;
    }
    newPlayers[idx].tank = tank;
  });

  setDeck(newDeck);
  setPlayers(newPlayers);
  setCurrentPlayerIndex(0);
  setWinner(null);
  setLogMessage("");
  setStealTargetMode(false);
  setFlipping(false);
};

  

return (
  <div
    className="
      min-h-screen w-full bg-gradient-to-tr from-yellow-100 to-purple-100
      font-sans p-4
      flex flex-col gap-4
      lg:grid lg:grid-cols-[300px_1fr_300px] lg:grid-rows-[150px_1fr_150px] lg:gap-2
    "
  >
    {/* ------------ CPU 1 (index 1) ------------ */}
    <div
      className="
        order-1 flex justify-center
        lg:order-none lg:row-start-2 lg:col-start-1 lg:items-center lg:transform lg:-rotate-90
      "
    >
      <PlayerTank
        player={players[1]}
        onClick={() => stealTargetMode && handleSteal(1)}
        highlight={stealTargetMode}
        isActive={currentPlayerIndex === 1}
      />
    </div>

    {/* ------------ CPU 2 (index 2) ------------ */}
    <div
      className="
        order-2 flex justify-center
        lg:order-none lg:row-start-1 lg:col-span-3
      "
    >
      <PlayerTank
        player={players[2]}
        onClick={() => stealTargetMode && handleSteal(2)}
        highlight={stealTargetMode}
        isActive={currentPlayerIndex === 2}
      />
    </div>

    {/* ------------ CPU 3 (index 3) ------------ */}
    <div
      className="
        order-3 flex justify-center
        lg:order-none lg:row-start-2 lg:col-start-3 lg:items-center lg:transform lg:rotate-90
      "
    >
      <PlayerTank
        player={players[3]}
        onClick={() => stealTargetMode && handleSteal(3)}
        highlight={stealTargetMode}
        isActive={currentPlayerIndex === 3}
      />
    </div>

    {/* ------------ Card Zone + Buttons ------------ */}
    <div
      className="
        order-4 flex flex-col items-center justify-center gap-4 w-full max-w-md mx-auto
        lg:order-none lg:row-start-2 lg:col-start-2
      "
    >
      {/* --- Flipping Deck Card --- */}
      <div className="relative w-20 h-28 perspective">
        <div
          className={`
            w-full h-full transform-style-preserve-3d transition-transform
            duration-1000 ease-in-out ${flipping ? "rotate-y-180" : ""}
          `}
        >
          {/* Back (3 colors) */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-lg shadow p-2 flex flex-col items-center justify-center border">
            {deck.length > 0 &&
              (flippingCard ? flippingCard.back : deck[deck.length - 1].back).map((c, i) => (
                <div key={i} className="w-4 h-4 rounded-full my-[1px]" style={{ backgroundColor: c }} />
              ))}
          </div>
          {/* Front (1 color) */}
          <div className="absolute inset-0 rotate-y-180 backface-hidden bg-white rounded-lg shadow flex items-center justify-center border">
            {flippingCard && (
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: flippingCard.front }} />
            )}
          </div>
        </div>
      </div>

      {/* --- Buttons & Messages --- */}
      {winner ? (
        <>
          <div className="text-xl font-bold text-green-600">{winner} wins!</div>
          <button
            onClick={resetGame}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-400 shadow mt-2"
          >
            Reset Game
          </button>
        </>
      ) : currentPlayerIndex === 0 ? (
        <>
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={handleScore}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-400 shadow text-lg"
            >
              SCORE
            </button>
            <button
              onClick={() => setStealTargetMode(true)}
              className="bg-yellow-400 text-white px-4 py-2 rounded-lg hover:bg-yellow-300 shadow text-lg"
            >
              STEAL
            </button>
          </div>
          {stealTargetMode && (
            <div className="text-sm italic text-gray-700 mt-2">
              Tap a CPU to steal from
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-gray-500 italic">CPU is thinking...</div>
      )}

      {/* Log message */}
      {logMessage && (
        <div className="text-sm text-gray-800 mt-2 italic font-bold text-center max-w-sm">
          {logMessage}
        </div>
      )}

      {/* Always-visible reset (mobile & desktop) */}
      {!winner && (
        <button
          onClick={resetGame}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-400 shadow mt-4"
        >
          Reset Game
        </button>
      )}
    </div>

    {/* ------------ Player 1 ------------ */}
    <div
      className="
        order-5 w-full max-w-md mx-auto
        lg:order-none lg:row-start-3 lg:col-start-2
      "
    >
      <PlayerTank
        player={players[0]}
        isActive={currentPlayerIndex === 0}
      />
    </div>
  </div>
);




}

function PlayerTank({ player, rotate, onClick, highlight, isActive }) {
  return (
    <div
      onClick={onClick}
      className={`
        text-center ${rotate ? "w-32" : "w-full"} p-1 rounded-lg
        ${highlight ? "cursor-pointer ring-2 ring-yellow-400 ring-offset-2 transition-transform hover:scale-105" : ""}
        ${isActive ? "ring-4 ring-purple-400 ring-offset-2 bg-purple-100/40" : ""}
      `}
    >
      {!rotate && (
        <h2 className="text-lg font-semibold mb-1">
          {player.name} ({player.score})
        </h2>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {Object.entries(player.tank).map(([color, count]) => (
          <div
            key={color}
            className="w-12 h-16 rounded shadow-md flex flex-col items-center justify-center text-white text-xs font-bold"
            style={{
              backgroundColor: color,
              textShadow: "0 0 3px rgba(0,0,0,0.5)",
            }}
          >
            <div className="capitalize">{color}</div>
            <div className="text-base">{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


