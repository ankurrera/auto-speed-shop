Ankur's Team

## Dashboard Scaffold

This project includes an initial automotive dashboard implementation that provides a foundation for vehicle monitoring and control features.

### Features

The dashboard includes the following components:

- **12-Column Responsive Grid Layout**: CSS grid system that adapts to different screen sizes
- **Real-time Telemetry Display**: Mock streaming data that updates every 2 seconds
- **Interactive Gauges**: Circular gauges for speed, RPM, battery level, and fuel
- **Vehicle Controls**: Quick controls for lock/unlock, lights, and climate with live state
- **Battery Status Card**: Shows battery percentage with visual indicators and charging status
- **Car Details Card**: Static vehicle information including VIN, model, odometer reading
- **Media Player**: Current track display with play/pause controls and progress tracking
- **Assistant Tasks**: Maintenance reminders and task management
- **Map Placeholder**: Reserved area for future navigation integration

### Accessing the Dashboard

The dashboard is accessible at `/dashboard` and can be reached:

1. Directly via URL: `http://localhost:8081/dashboard`
2. From the Account area: Login to your account and click the "Dashboard" button in the header

### Extension Guide

The dashboard is designed to be easily extensible. Here are the recommended next steps:

#### 1. Map Integration
- Replace `MapPlaceholderCard` with a real mapping service (Google Maps, Mapbox, etc.)
- Add real-time vehicle location tracking
- Implement route planning and navigation features
- Add charging station locator for electric vehicles

#### 2. Real Telemetry Integration
- Replace `useDashboardTelemetry` hook with actual vehicle API connections
- Implement WebSocket connections for real-time data streaming
- Add data validation and error handling for sensor readings
- Integrate with OBD-II port readers or vehicle telematics systems

#### 3. Authentication Gating
- Add route protection to require user authentication
- Implement role-based access (user vs admin dashboards)
- Add vehicle ownership validation
- Create user-specific dashboard configurations

#### 4. Additional Features
- Add more vehicle sensors (tire pressure, engine temperature, etc.)
- Implement push notifications for critical alerts
- Add historical data tracking and analytics
- Create customizable dashboard layouts
- Integrate with smart home systems
- Add voice control capabilities

### Technical Implementation

- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom dashboard grid system
- **Components**: Shadcn/ui component library for consistent design
- **State Management**: React hooks for local state, custom hooks for telemetry
- **Data**: Mock data constants with realistic vehicle information
- **Accessibility**: ARIA labels on interactive controls for screen readers

### File Structure

```
src/
├── pages/Dashboard.tsx                    # Main dashboard layout
├── components/dashboard/
│   ├── Gauge.tsx                         # Circular gauge component
│   └── cards/
│       ├── BatteryCard.tsx               # Battery status display
│       ├── QuickControlsCard.tsx         # Vehicle controls
│       ├── MapPlaceholderCard.tsx        # Future map integration
│       ├── AssistantTasksCard.tsx        # Task management
│       ├── CarDetailsCard.tsx            # Vehicle information
│       └── MediaCard.tsx                 # Media player controls
├── hooks/useDashboardTelemetry.ts        # Mock telemetry data hook
├── data/dashboard.ts                     # Mock data constants
└── styles/dashboard.css                  # Dashboard-specific styles
```

### Development

To run the dashboard in development mode:

```bash
npm run dev
```

Navigate to `http://localhost:8081/dashboard` to view the dashboard.
