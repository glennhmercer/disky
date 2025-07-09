import React, { useState, useCallback, useEffect, useMemo } from "react";
import GameCanvas from "./GameCanvas";
import GameUI from "./GameUI";
import { useGame } from "../../lib/stores/useGame";
import { useAudio } from "../../lib/stores/useAudio";
import { GameObject, Target, Obstacle } from "../../lib/gameTypes";
import { generateTargets, generateObstacles } from "../../lib/gameUtils";

const DiscThrowingGame: React.FC = () => {
  const { phase, start, restart, end } = useGame();
  const { playHit, playSuccess } = useAudio();
  
  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState<Target[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  // Pre-generate targets and obstacles to avoid Math.random() in render
  const initialTargets = useMemo(() => generateTargets(8), []);
  const initialObstacles = useMemo(() => generateObstacles(6), []);

  useEffect(() => {
    if (phase === "ready") {
      setTargets(initialTargets);
      setObstacles(initialObstacles);
      setScore(0);
      setGameStarted(false);
    }
  }, [phase, initialTargets, initialObstacles]);

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
    setScore(prev => prev + 100);
    playSuccess();
    
    // Check if all targets are hit
    const remainingTargets = targets.filter(t => !t.isHit && t.id !== targetId);
    if (remainingTargets.length === 0) {
      setTimeout(() => {
        end();
      }, 1000);
    }
  }, [targets, playSuccess, end]);

  const handleObstacleHit = useCallback(() => {
    playHit();
  }, [playHit]);

  if (phase === "ready" && !gameStarted) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Disc Throwing Game</h1>
          <p className="text-xl text-white mb-6">
            Throw discs to hit all targets! Use curved trajectories to get around obstacles.
          </p>
          <div className="text-white mb-8">
            <p className="mb-2">🎯 Click and drag to aim</p>
            <p className="mb-2">🥏 Release to throw disc</p>
            <p className="mb-2">🎮 Adjust angle for curved throws</p>
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
    <div className="w-full h-full relative">
      <GameCanvas
        targets={targets}
        obstacles={obstacles}
        onTargetHit={handleTargetHit}
        onObstacleHit={handleObstacleHit}
      />
      <GameUI score={score} targetsRemaining={targets.filter(t => !t.isHit).length} />
    </div>
  );
};

export default DiscThrowingGame;
