import React from 'react';
import { MapPin, Navigation, Route } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MapPlaceholderCardProps {
  className?: string;
}

/**
 * Map placeholder card reserved for future map integration
 */
const MapPlaceholderCard: React.FC<MapPlaceholderCardProps> = ({
  className = ''
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Navigation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="map-placeholder">
          <div className="relative z-10 text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-white/20 rounded-full p-4">
                <Navigation className="h-8 w-8" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Map Integration
              </h3>
              <p className="text-sm opacity-90 mb-4">
                Real-time navigation and location services will be integrated here
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2 text-xs">
                <Route className="h-3 w-3" />
                <span>GPS Ready</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs">
                <MapPin className="h-3 w-3" />
                <span>Location Services</span>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                variant="secondary" 
                size="sm" 
                disabled
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                Enable Navigation
              </Button>
            </div>
          </div>
        </div>

        {/* Current location mock */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <div>
              <div className="font-medium">Current Location</div>
              <div className="text-xs text-muted-foreground">
                San Francisco, CA • Parked
              </div>
            </div>
          </div>
        </div>

        {/* Future integration notes */}
        <div className="mt-3 text-xs text-muted-foreground">
          <p className="italic">
            Future features: Real-time traffic, route planning, charging station locations, 
            and vehicle tracking integration.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapPlaceholderCard;