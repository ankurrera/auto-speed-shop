import React from 'react';
import { Car, Gauge as GaugeIcon, Fuel, Calendar, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CarDetails } from '@/data/dashboard';

interface CarDetailsCardProps {
  carDetails: CarDetails;
  className?: string;
}

/**
 * Car details card showing static vehicle information like VIN, model, odometer
 */
const CarDetailsCard: React.FC<CarDetailsCardProps> = ({
  carDetails,
  className = ''
}) => {
  const formatOdometer = (miles: number) => {
    return new Intl.NumberFormat('en-US').format(miles);
  };

  const formatVin = (vin: string) => {
    // Display VIN with spacing for readability
    return vin.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Car className="h-4 w-4" />
          Vehicle Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Vehicle Model and Year */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Model</span>
              <Badge variant="secondary" className="font-medium">
                {carDetails.year} {carDetails.model}
              </Badge>
            </div>
          </div>

          {/* Engine and Fuel Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Fuel className="h-3 w-3" />
                <span>Fuel Type</span>
              </div>
              <div className="text-sm font-medium">{carDetails.fuelType}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <GaugeIcon className="h-3 w-3" />
                <span>Engine</span>
              </div>
              <div className="text-sm font-medium">{carDetails.engineSize}</div>
            </div>
          </div>

          {/* Odometer */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <GaugeIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Odometer</div>
                  <div className="text-lg font-bold">
                    {formatOdometer(carDetails.odometer)}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">miles</div>
            </div>
          </div>

          {/* VIN Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span>Vehicle Identification Number</span>
            </div>
            <div className="bg-muted rounded p-2">
              <div className="text-xs font-mono tracking-wider">
                {formatVin(carDetails.vin)}
              </div>
            </div>
          </div>

          {/* Vehicle Age */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Vehicle Age</span>
            </div>
            <span className="font-medium">
              {new Date().getFullYear() - carDetails.year} year{new Date().getFullYear() - carDetails.year !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="pt-3 border-t">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {(carDetails.odometer / (new Date().getFullYear() - carDetails.year + 1)).toFixed(0)}K
                </div>
                <div className="text-muted-foreground">miles/year</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {carDetails.fuelType === 'Electric' ? '0' : 'N/A'}
                </div>
                <div className="text-muted-foreground">emissions</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarDetailsCard;