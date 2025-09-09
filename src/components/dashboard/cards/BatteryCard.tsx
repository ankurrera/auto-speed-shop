import React from 'react';
import { Battery, BatteryLow, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BatteryCardProps {
  batteryPercent: number;
  isCharging?: boolean;
  className?: string;
}

/**
 * Battery status card showing percentage and charging status
 */
const BatteryCard: React.FC<BatteryCardProps> = ({
  batteryPercent,
  isCharging = false,
  className = ''
}) => {
  const getBatteryStatus = () => {
    if (isCharging) return 'Charging';
    if (batteryPercent > 80) return 'Full';
    if (batteryPercent > 60) return 'Good';
    if (batteryPercent > 30) return 'Medium';
    if (batteryPercent > 15) return 'Low';
    return 'Critical';
  };

  const getBatteryColor = () => {
    if (isCharging) return 'hsl(var(--info))';
    if (batteryPercent > 60) return 'hsl(var(--success))';
    if (batteryPercent > 30) return 'hsl(var(--warning))';
    return 'hsl(0 84% 60%)';
  };

  const getBatteryIcon = () => {
    if (isCharging) return <Zap className="h-5 w-5" />;
    if (batteryPercent <= 15) return <BatteryLow className="h-5 w-5" />;
    return <Battery className="h-5 w-5" />;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Battery</CardTitle>
        <div style={{ color: getBatteryColor() }}>
          {getBatteryIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Battery percentage */}
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold">
              {Math.round(batteryPercent)}%
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: getBatteryColor() }}
            >
              {getBatteryStatus()}
            </div>
          </div>
          
          {/* Battery visual indicator */}
          <div className="relative">
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 ease-in-out rounded-full"
                style={{
                  width: `${Math.max(batteryPercent, 0)}%`,
                  backgroundColor: getBatteryColor()
                }}
              />
            </div>
            
            {/* Charging animation overlay */}
            {isCharging && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            )}
          </div>
          
          {/* Status message */}
          <div className="text-xs text-muted-foreground">
            {isCharging ? (
              'Vehicle is charging'
            ) : batteryPercent <= 15 ? (
              'Low battery - charge soon'
            ) : batteryPercent <= 30 ? (
              'Consider charging'
            ) : (
              'Battery level optimal'
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatteryCard;