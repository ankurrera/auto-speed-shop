import { useState, useEffect } from 'react';
import { 
  TelemetryData, 
  VehicleControls, 
  initialTelemetryData, 
  initialVehicleControls,
  generateRandomTelemetryUpdate 
} from '@/data/dashboard';

interface DashboardTelemetryHook {
  telemetryData: TelemetryData;
  vehicleControls: VehicleControls;
  updateVehicleControl: (key: keyof VehicleControls, value: boolean | number) => void;
  isConnected: boolean;
}

/**
 * Custom hook that provides mock streaming telemetry data for the automotive dashboard.
 * Updates telemetry data every 2 seconds with realistic variations.
 */
export const useDashboardTelemetry = (): DashboardTelemetryHook => {
  const [telemetryData, setTelemetryData] = useState<TelemetryData>(initialTelemetryData);
  const [vehicleControls, setVehicleControls] = useState<VehicleControls>(initialVehicleControls);
  const [isConnected, setIsConnected] = useState(true);

  // Update telemetry data every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryData(currentData => {
        // Simulate connection status (95% uptime)
        if (Math.random() < 0.05) {
          setIsConnected(false);
          return currentData;
        } else {
          setIsConnected(true);
          return generateRandomTelemetryUpdate(currentData);
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Function to update vehicle controls
  const updateVehicleControl = (key: keyof VehicleControls, value: boolean | number) => {
    setVehicleControls(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    telemetryData,
    vehicleControls,
    updateVehicleControl,
    isConnected
  };
};