import React from 'react';
import { Car, Zap, Thermometer, Gauge as GaugeIcon } from 'lucide-react';
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry';
import { 
  mockCarDetails, 
  mockAssistantTasks, 
  mockMediaTrack 
} from '@/data/dashboard';

// Import dashboard components
import Gauge from '@/components/dashboard/Gauge';
import BatteryCard from '@/components/dashboard/cards/BatteryCard';
import QuickControlsCard from '@/components/dashboard/cards/QuickControlsCard';
import MapPlaceholderCard from '@/components/dashboard/cards/MapPlaceholderCard';
import AssistantTasksCard from '@/components/dashboard/cards/AssistantTasksCard';
import CarDetailsCard from '@/components/dashboard/cards/CarDetailsCard';
import MediaCard from '@/components/dashboard/cards/MediaCard';

// Import styles
import '@/styles/dashboard.css';

/**
 * Automotive Dashboard - Main dashboard layout with 12-column responsive grid
 * and various dashboard cards for vehicle monitoring and control
 */
const Dashboard: React.FC = () => {
  const { telemetryData, vehicleControls, updateVehicleControl, isConnected } = useDashboardTelemetry();

  const handleTaskToggle = (taskId: string) => {
    // In a real application, this would update the task status
    console.log('Task toggled:', taskId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                <Car className="h-8 w-8 text-primary" />
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Vehicle monitoring and control center
              </p>
            </div>
            
            {/* Connection Status */}
            <div className={`status-indicator ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
              <div className="w-2 h-2 rounded-full bg-current" />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          {/* Vehicle Info Bar */}
          <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">{mockCarDetails.year} {mockCarDetails.model}</h2>
                <p className="text-sm text-muted-foreground">
                  {mockCarDetails.odometer.toLocaleString()} miles • {mockCarDetails.fuelType}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>{Math.round(telemetryData.batteryPercent)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span>{Math.round(telemetryData.outsideTemp)}°F</span>
              </div>
              <div className="flex items-center gap-1">
                <GaugeIcon className="h-4 w-4 text-green-500" />
                <span>{Math.round(telemetryData.speed)} mph</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Row 1: Main Gauges */}
          <div className="col-12 lg:col-3 md:col-6 sm:col-12">
            <div className="dashboard-card h-full flex items-center justify-center">
              <Gauge 
                value={telemetryData.speed}
                max={120}
                label="Speed"
                unit="mph"
                color="hsl(var(--primary))"
              />
            </div>
          </div>
          
          <div className="col-12 lg:col-3 md:col-6 sm:col-12">
            <div className="dashboard-card h-full flex items-center justify-center">
              <Gauge 
                value={telemetryData.engineRpm}
                max={7000}
                label="RPM"
                unit="rpm"
                color="hsl(var(--warning))"
              />
            </div>
          </div>

          <div className="col-12 lg:col-3 md:col-6 sm:col-12">
            <BatteryCard 
              batteryPercent={telemetryData.batteryPercent}
              isCharging={false}
            />
          </div>

          <div className="col-12 lg:col-3 md:col-6 sm:col-12">
            <div className="dashboard-card h-full flex items-center justify-center">
              <Gauge 
                value={telemetryData.fuelLevel}
                max={100}
                label="Fuel"
                unit="%"
                color="hsl(var(--success))"
              />
            </div>
          </div>

          {/* Row 2: Controls and Quick Info */}
          <div className="col-12 lg:col-4 md:col-12 sm:col-12">
            <QuickControlsCard 
              controls={vehicleControls}
              onControlChange={updateVehicleControl}
            />
          </div>

          <div className="col-12 lg:col-4 md:col-6 sm:col-12">
            <CarDetailsCard carDetails={mockCarDetails} />
          </div>

          <div className="col-12 lg:col-4 md:col-6 sm:col-12">
            <MediaCard track={mockMediaTrack} />
          </div>

          {/* Row 3: Map and Tasks */}
          <div className="col-12 lg:col-8 md:col-12 sm:col-12">
            <MapPlaceholderCard />
          </div>

          <div className="col-12 lg:col-4 md:col-12 sm:col-12">
            <AssistantTasksCard 
              tasks={mockAssistantTasks}
              onTaskToggle={handleTaskToggle}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Dashboard updates every 2 seconds • 
            Last updated: {telemetryData.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;