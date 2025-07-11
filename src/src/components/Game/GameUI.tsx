import React from "react";
import { useAudio } from "../../lib/stores/useAudio";
import { Volume2, VolumeX } from "lucide-react";

interface GameUIProps {
  score: number;
  level: number;
  targetHit: boolean;
}

const GameUI: React.FC<GameUIProps> = ({ score, level, targetHit }) => {
  const { isMuted, toggleMute } = useAudio();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top UI */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap justify-between items-center gap-2">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-center">
          <div className="text-sm">Score</div>
          <div className="text-2xl font-bold">{score}</div>
        </div>

        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-center">
          <div className="text-sm">Level</div>
          <div className="text-2xl font-bold">{level}</div>
        </div>
        
        <button
          onClick={toggleMute}
          className="bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-70 transition-colors pointer-events-auto"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {/* Target Hit Indicator */}
      {targetHit && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-green-500 text-white px-8 py-4 rounded-lg text-2xl font-bold">
            TARGET HIT!
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
        <div className="text-sm">
          <div>🎯 Step 1: Click to set direction</div>
          <div>🥏 Step 2: Tilt left/right to curve</div>
          <div>🎮 Hit the target to advance</div>
        </div>
      </div>
    </div>
  );
};

export default GameUI;
