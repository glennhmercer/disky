import React from "react";
import { useAudio } from "../../lib/stores/useAudio";
import { Volume2, VolumeX } from "lucide-react";

interface GameUIProps {
  score: number;
  targetsRemaining: number;
}

const GameUI: React.FC<GameUIProps> = ({ score, targetsRemaining }) => {
  const { isMuted, toggleMute } = useAudio();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top UI */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
          <div className="text-sm">Score</div>
          <div className="text-2xl font-bold">{score}</div>
        </div>
        
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
          <div className="text-sm">Targets Left</div>
          <div className="text-2xl font-bold">{targetsRemaining}</div>
        </div>
        
        <button
          onClick={toggleMute}
          className="bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-70 transition-colors pointer-events-auto"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
        <div className="text-sm">
          <div>🎯 Click and drag to aim</div>
          <div>🥏 Release to throw disc</div>
          <div>🎮 Use curved trajectories around obstacles</div>
        </div>
      </div>
    </div>
  );
};

export default GameUI;
