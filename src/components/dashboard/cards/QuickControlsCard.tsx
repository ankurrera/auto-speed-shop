import React from 'react';
import { Lock, Unlock, Lightbulb, LightbulbOff, Snowflake, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VehicleControls } from '@/data/dashboard';

interface QuickControlsCardProps {
  controls: VehicleControls;
  onControlChange: (key: keyof VehicleControls, value: boolean | number) => void;
  className?: string;
}

/**
 * Quick controls card for Lock/Unlock, Lights toggle, and Climate control
 */
const QuickControlsCard: React.FC<QuickControlsCardProps> = ({
  controls,
  onControlChange,
  className = ''
}) => {
  const handleLockToggle = () => {
    onControlChange('isLocked', !controls.isLocked);
  };

  const handleLightsToggle = () => {
    onControlChange('lightsOn', !controls.lightsOn);
  };

  const handleClimateToggle = () => {
    onControlChange('climateOn', !controls.climateOn);
  };

  const handleTempChange = (increment: boolean) => {
    const newTemp = increment 
      ? Math.min(controls.climateTemp + 1, 85)
      : Math.max(controls.climateTemp - 1, 60);
    onControlChange('climateTemp', newTemp);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quick Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Lock/Unlock Control */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {controls.isLocked ? (
                <Lock className="h-4 w-4 text-red-500" />
              ) : (
                <Unlock className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm font-medium">
                {controls.isLocked ? 'Locked' : 'Unlocked'}
              </span>
            </div>
            <Button
              variant={controls.isLocked ? "destructive" : "default"}
              size="sm"
              onClick={handleLockToggle}
              aria-label={controls.isLocked ? "Unlock vehicle" : "Lock vehicle"}
            >
              {controls.isLocked ? 'Unlock' : 'Lock'}
            </Button>
          </div>

          {/* Lights Control */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {controls.lightsOn ? (
                <Lightbulb className="h-4 w-4 text-yellow-500" />
              ) : (
                <LightbulbOff className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                Lights {controls.lightsOn ? 'On' : 'Off'}
              </span>
            </div>
            <Button
              variant={controls.lightsOn ? "default" : "outline"}
              size="sm"
              onClick={handleLightsToggle}
              aria-label={controls.lightsOn ? "Turn lights off" : "Turn lights on"}
            >
              {controls.lightsOn ? 'Turn Off' : 'Turn On'}
            </Button>
          </div>

          {/* Climate Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Snowflake className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">
                  Climate {controls.climateOn ? 'On' : 'Off'}
                </span>
              </div>
              <Button
                variant={controls.climateOn ? "default" : "outline"}
                size="sm"
                onClick={handleClimateToggle}
                aria-label={controls.climateOn ? "Turn climate off" : "Turn climate on"}
              >
                {controls.climateOn ? 'Turn Off' : 'Turn On'}
              </Button>
            </div>

            {/* Temperature Control */}
            {controls.climateOn && (
              <div className="flex items-center justify-between bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Temperature</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTempChange(false)}
                    disabled={controls.climateTemp <= 60}
                    aria-label="Decrease temperature"
                  >
                    -
                  </Button>
                  <span className="text-lg font-semibold min-w-[3rem] text-center">
                    {controls.climateTemp}°F
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTempChange(true)}
                    disabled={controls.climateTemp >= 85}
                    aria-label="Increase temperature"
                  >
                    +
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickControlsCard;