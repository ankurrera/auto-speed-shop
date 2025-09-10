// Mock data constants for the automotive dashboard

export interface CarDetails {
  vin: string;
  model: string;
  year: number;
  odometer: number;
  fuelType: string;
  engineSize: string;
}

export interface AssistantTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface MediaTrack {
  title: string;
  artist: string;
  album: string;
  duration: string;
  currentTime: string;
}

export interface TelemetryData {
  batteryPercent: number;
  speed: number;
  outsideTemp: number;
  cabinTemp: number;
  fuelLevel: number;
  engineRpm: number;
  timestamp: Date;
}

export interface VehicleControls {
  isLocked: boolean;
  lightsOn: boolean;
  climateOn: boolean;
  climateTemp: number;
}

// Mock car details
export const mockCarDetails: CarDetails = {
  vin: "1HGBH41JXMN109186",
  model: "Model S Performance",
  year: 2023,
  odometer: 15420,
  fuelType: "Electric",
  engineSize: "Dual Motor AWD"
};

// Mock assistant tasks
export const mockAssistantTasks: AssistantTask[] = [
  {
    id: "1",
    title: "Oil Change Due",
    description: "Next oil change due in 500 miles",
    priority: "medium",
    completed: false
  },
  {
    id: "2",
    title: "Tire Rotation",
    description: "Schedule tire rotation appointment",
    priority: "low",
    completed: false
  },
  {
    id: "3",
    title: "Software Update",
    description: "Install latest vehicle software update",
    priority: "high",
    completed: true
  },
  {
    id: "4",
    title: "Insurance Renewal",
    description: "Auto insurance expires in 30 days",
    priority: "high",
    completed: false
  }
];

// Mock current media track
export const mockMediaTrack: MediaTrack = {
  title: "Drive My Car",
  artist: "The Beatles",
  album: "Rubber Soul",
  duration: "4:02",
  currentTime: "1:45"
};

// Initial telemetry data
export const initialTelemetryData: TelemetryData = {
  batteryPercent: 78,
  speed: 0,
  outsideTemp: 72,
  cabinTemp: 68,
  fuelLevel: 85,
  engineRpm: 0,
  timestamp: new Date()
};

// Initial vehicle controls state
export const initialVehicleControls: VehicleControls = {
  isLocked: true,
  lightsOn: false,
  climateOn: true,
  climateTemp: 72
};

// Utility function to generate random telemetry variations
export const generateRandomTelemetryUpdate = (currentData: TelemetryData): TelemetryData => {
  const batteryChange = (Math.random() - 0.5) * 2; // ±1%
  const speedChange = (Math.random() - 0.5) * 10; // ±5 mph
  const tempChange = (Math.random() - 0.5) * 2; // ±1°F
  const fuelChange = (Math.random() - 0.5) * 1; // ±0.5%
  const rpmChange = (Math.random() - 0.5) * 200; // ±100 rpm

  return {
    batteryPercent: Math.max(0, Math.min(100, currentData.batteryPercent + batteryChange)),
    speed: Math.max(0, Math.min(120, currentData.speed + speedChange)),
    outsideTemp: Math.max(-20, Math.min(120, currentData.outsideTemp + tempChange)),
    cabinTemp: Math.max(40, Math.min(90, currentData.cabinTemp + tempChange)),
    fuelLevel: Math.max(0, Math.min(100, currentData.fuelLevel + fuelChange)),
    engineRpm: Math.max(0, Math.min(7000, currentData.engineRpm + rpmChange)),
    timestamp: new Date()
  };
};