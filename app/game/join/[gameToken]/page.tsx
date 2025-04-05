"use client";

import { useParams } from 'next/navigation';
import '../../../styles/home.css';



export default function GameSessionPage() {
  const params = useParams();
  const gameToken = params?.gameToken;

  console.log('Game Session Page - Params:', params);
  console.log('Game Token:', gameToken);

  return (
    <div className="home-container">
      <div className="button-container">
        <h1 className="text-white text-2xl font-bold text-center mb-6">
          GAME SESSION: {gameToken}
        </h1>
        {/* Add your game session UI components here */}
      </div>
    </div>
  );
}


