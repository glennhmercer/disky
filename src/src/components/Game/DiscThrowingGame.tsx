import React, { useState, useCallback, useEffect, useMemo } from "react";
import GameCanvas from "./GameCanvas";
import { useLayoutManager } from "../../hooks/useLayoutManager";
import GameUI from "./GameUI";
import { useGame } from "../../lib/stores/useGame";
import { useAudio } from "../../lib/stores/useAudio";
import type { GameObject, Target, Obstacle } from "../../lib/gameTypes";
import { generateSingleTarget, generateObstacles } from "../../lib/gameUtils";

const DiscThrowingGame: React.FC = () => {
  const { phase, start, restart, end } = useGame();
  const { playHit, playSuccess } = useAudio();
  const { width, height } = useLayoutManager();
  
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [targets, setTargets] = useState<Target[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [targetHit, setTargetHit] = useState(false);

  useEffect(() => {
    if (phase === "ready") {
      const newTarget = generateSingleTarget(level);
      setTargets([newTarget]);
      
      // Add obstacles at higher levels - start with 1 obstacle at level 2
      const obstacleCount = Math.max(0, level - 1);
      const newObstacles = generateObstacles(obstacleCount);
      setObstacles(newObstacles);
      
      if (level === 1) {
        setScore(0);
      }
      setGameStarted(false);
      setTargetHit(false);
    }
  }, [phase, level]);

  const handleStartGame = useCallback(() => {
    start();
    setGameStarted(true);
  }, [start]);

  const handleRestartGame = useCallback(() => {
    restart();
  }, [restart]);

  const handleTargetHit = useCallback((targetId: string) => {
    setTargets(prev => prev.map(target => 
      target.id === targetId 
        ? { ...target, isHit: true }
        : target
    ));
    setScore(prev => prev + 100 * level);
    setTargetHit(true);
    playSuccess();
    
    // Move to next level after hitting target
    setTimeout(() => {
      setLevel(prev => prev + 1);
      restart(); // This will trigger the next level
    }, 1500);
  }, [level, playSuccess, restart]);

  const handleObstacleHit = useCallback(() => {
    playHit();
  }, [playHit]);


  if (phase === "ready" && !gameStarted) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Disc Hunt</h1>
          <p className="text-xl text-white mb-6">
            Duck Hunt style disc throwing! Hit targets while avoiding obstacles.
          </p>
          <div className="text-white mb-8">
            <p className="mb-2">🎯 Step 1: Click to set throwing direction</p>
            <p className="mb-2">🥏 Step 2: Tilt left/right to curve the disc</p>
            <p className="mb-2">🎮 Each level has one target to hit</p>
            <p className="mb-2">🚧 Obstacles appear at higher levels</p>
          </div>
          <button
            onClick={handleStartGame}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold text-xl hover:bg-gray-100 transition-colors"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (phase === "ended") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Game Complete!</h1>
          <p className="text-2xl text-white mb-6">Final Score: {score}</p>
          <button
            onClick={handleRestartGame}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold text-xl hover:bg-gray-100 transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      <div style={{ width, height }} className="relative">
        <GameCanvas
          targets={targets}
          obstacles={obstacles}
          onTargetHit={handleTargetHit}
          onObstacleHit={handleObstacleHit}
          width={width}
          height={height}
        />
        <GameUI score={score} level={level} targetHit={targetHit} />
      </div>
    </div>
  );
};

export default DiscThrowingGame;
