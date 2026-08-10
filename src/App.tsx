import React, { useState } from 'react';
import { AspectContainer } from './components/AspectContainer';
import { StartMenu } from './components/StartMenu';
import { GameCanvas } from './components/GameCanvas';
import { GameMode, VehicleType } from './types';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('warfare');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('apex_gt');
  const [paintHex, setPaintHex] = useState<number>(0xd62828);

  const handleStartGame = (mode: GameMode, vehicle: VehicleType, colorHex: number) => {
    setGameMode(mode);
    setSelectedVehicle(vehicle);
    setPaintHex(colorHex);
    setGameStarted(true);
  };

  return (
    <AspectContainer title="Jungle Warfare & Pro Driving (9:16)">
      {!gameStarted ? (
        <StartMenu onStartGame={handleStartGame} />
      ) : (
        <GameCanvas
          gameMode={gameMode}
          selectedVehicleType={selectedVehicle}
          paintHex={paintHex}
        />
      )}
    </AspectContainer>
  );
}
