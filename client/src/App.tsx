import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAudio } from "./lib/stores/useAudio";
import { useEffect } from "react";
import DiscThrowingGame from "./components/Game/DiscThrowingGame";

const queryClient = new QueryClient();

function App() {
  const { setHitSound, setSuccessSound } = useAudio();

  useEffect(() => {
    // Load game sounds
    const hitSound = new Audio("/sounds/hit.mp3");
    const successSound = new Audio("/sounds/success.mp3");
    
    setHitSound(hitSound);
    setSuccessSound(successSound);
  }, [setHitSound, setSuccessSound]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-blue-600 overflow-hidden">
        <DiscThrowingGame />
      </div>
    </QueryClientProvider>
  );
}

export default App;
