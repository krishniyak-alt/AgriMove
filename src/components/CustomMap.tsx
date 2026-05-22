import React, { useEffect, useState } from "react";
import { MapPin, Navigation, Truck, Users } from "lucide-react";

interface Coordinate {
  lat: number;
  lng: number;
}

interface CustomMapProps {
  pickupCoords?: Coordinate;
  destinationCoords?: Coordinate;
  pickupName?: string;
  destinationName?: string;
  nearbyFarmers?: Array<{
    id: string;
    farmerName: string;
    pickupLocation: string;
    distanceKm: number;
    pickupCoords?: Coordinate;
  }>;
  isTransit?: boolean;
}

export const CustomMap: React.FC<CustomMapProps> = ({
  pickupCoords = { lat: 10.7870, lng: 79.1378 }, // Thanjavur
  destinationCoords = { lat: 13.0827, lng: 80.2707 }, // Chennai
  pickupName = "Thanjavur Farm",
  destinationName = "Koyambedu Market",
  nearbyFarmers = [],
  isTransit = false
}) => {
  // Translate GPS coords to SVG grid dimensions (500x400)
  // TN coords bound roughly: Lat 8 to 14, Lng 76 to 81
  const mapWidth = 500;
  const mapHeight = 400;

  const latMin = 8.0;
  const latMax = 14.0;
  const lngMin = 76.0;
  const lngMax = 81.0;

  const toXY = (lat: number, lng: number) => {
    // Invert Y because SVG coordinates start from top-left (0,0)
    const x = ((lng - lngMin) / (lngMax - lngMin)) * mapWidth;
    const y = mapHeight - ((lat - latMin) / (latMax - latMin)) * mapHeight;
    return { x, y };
  };

  const startXY = toXY(pickupCoords.lat, pickupCoords.lng);
  const endXY = toXY(destinationCoords.lat, destinationCoords.lng);

  // Animated truck position along the route
  const [progress, setProgress] = useState(0.2);

  useEffect(() => {
    if (isTransit) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 1 ? 0 : prev + 0.005));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isTransit]);

  const truckX = startXY.x + (endXY.x - startXY.x) * progress;
  const truckY = startXY.y + (endXY.y - startXY.y) * progress;

  // Major cities in Tamil Nadu to draw on background map
  const CITIES = [
    { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { name: "Madurai", lat: 9.9252, lng: 78.1198 },
    { name: "Trichy", lat: 10.7905, lng: 78.7047 },
    { name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
    { name: "Salem", lat: 11.6643, lng: 78.1460 },
    { name: "Thanjavur", lat: 10.7870, lng: 79.1378 },
    { name: "Tirunelveli", lat: 8.7139, lng: 77.7567 }
  ];

  return (
    <div className="relative glass-panel rounded-2xl p-4 overflow-hidden border border-zinc-800 bg-zinc-950/80 shadow-inner">
      <div className="absolute top-4 left-4 z-10 bg-zinc-900/90 border border-zinc-800 rounded-lg p-2.5 text-xs backdrop-blur-md">
        <h4 className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
          <Navigation className="h-3 w-3 animate-pulse" /> Live routing map
        </h4>
        <p className="text-zinc-400 font-mono">From: {pickupName}</p>
        <p className="text-zinc-400 font-mono">To: {destinationName}</p>
      </div>

      <svg
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="w-full h-auto bg-[#0a0a0c] rounded-xl border border-zinc-900/60"
        style={{ minHeight: "280px" }}
      >
        {/* Background Grid Lines */}
        <defs>
          <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(63, 63, 70, 0.15)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Outline representation of Tamil Nadu (approximate stylized polygon for UI design) */}
        <path
          d={`M ${toXY(13.5, 80.2).x} ${toXY(13.5, 80.2).y} 
             L ${toXY(12.5, 80.2).x} ${toXY(12.5, 80.2).y} 
             L ${toXY(11.0, 79.8).x} ${toXY(11.0, 79.8).y} 
             L ${toXY(10.3, 79.9).x} ${toXY(10.3, 79.9).y} 
             L ${toXY(9.2, 79.2).x} ${toXY(9.2, 79.2).y} 
             L ${toXY(9.0, 78.3).x} ${toXY(9.0, 78.3).y} 
             L ${toXY(8.1, 77.5).x} ${toXY(8.1, 77.5).y} 
             L ${toXY(8.5, 77.0).x} ${toXY(8.5, 77.0).y} 
             L ${toXY(9.8, 77.2).x} ${toXY(9.8, 77.2).y} 
             L ${toXY(10.5, 76.2).x} ${toXY(10.5, 76.2).y} 
             L ${toXY(11.5, 76.8).x} ${toXY(11.5, 76.8).y} 
             L ${toXY(12.5, 77.8).x} ${toXY(12.5, 77.8).y} 
             L ${toXY(13.0, 79.8).x} ${toXY(13.0, 79.8).y} Z`}
          fill="rgba(16, 185, 129, 0.02)"
          stroke="rgba(16, 185, 129, 0.08)"
          strokeWidth="2"
        />

        {/* Reference Cities */}
        {CITIES.map((city, idx) => {
          const xy = toXY(city.lat, city.lng);
          return (
            <g key={idx} opacity="0.35">
              <circle cx={xy.x} cy={xy.y} r="3" fill="#52525b" />
              <text x={xy.x + 6} y={xy.y + 3} fill="#a1a1aa" fontSize="8" fontFamily="Inter">
                {city.name}
              </text>
            </g>
          );
        })}

        {/* Active Route Path */}
        <line
          x1={startXY.x}
          y1={startXY.y}
          x2={endXY.x}
          y2={endXY.y}
          stroke="url(#routeGradient)"
          strokeWidth="3.5"
          strokeDasharray="4 3"
          filter="url(#glow)"
        />

        {/* Nearby Farmers (Proximity Clustering indicators) */}
        {nearbyFarmers.map((farmer, idx) => {
          const fCoords = farmer.pickupCoords || {
            lat: pickupCoords.lat + (Math.random() - 0.5) * 0.08,
            lng: pickupCoords.lng + (Math.random() - 0.5) * 0.08
          };
          const fXY = toXY(fCoords.lat, fCoords.lng);
          return (
            <g key={idx}>
              {/* Connection to Main Farmer Route */}
              <line
                x1={fXY.x}
                y1={fXY.y}
                x2={startXY.x}
                y2={startXY.y}
                stroke="#d97706"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                opacity="0.6"
              />
              <circle cx={fXY.x} cy={fXY.y} r="6" fill="#d97706" fillOpacity="0.4" />
              <circle cx={fXY.x} cy={fXY.y} r="3" fill="#f59e0b" />
              <text x={fXY.x + 8} y={fXY.y + 3} fill="#f59e0b" fontSize="8" fontWeight="bold">
                {farmer.farmerName} ({farmer.distanceKm}km)
              </text>
            </g>
          );
        })}

        {/* Source Pin */}
        <circle cx={startXY.x} cy={startXY.y} r="10" fill="#10b981" fillOpacity="0.25" className="animate-pulse" />
        <circle cx={startXY.x} cy={startXY.y} r="5" fill="#10b981" />

        {/* Destination Pin */}
        <circle cx={endXY.x} cy={endXY.y} r="12" fill="#3b82f6" fillOpacity="0.25" />
        <circle cx={endXY.x} cy={endXY.y} r="6" fill="#3b82f6" />

        {/* Transit Vehicle Animation */}
        {isTransit && (
          <g>
            <circle cx={truckX} cy={truckY} r="9" fill="#10b981" filter="url(#glow)" />
            <circle cx={truckX} cy={truckY} r="5" fill="#ffffff" />
          </g>
        )}
      </svg>

      {/* Map Legend */}
      <div className="flex items-center justify-between mt-3 text-xs border-t border-zinc-900 pt-3">
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
          <span className="text-zinc-400">Pickup</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
          <span className="text-zinc-400">Destination</span>
        </div>
        {nearbyFarmers.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-amber-400 font-semibold">Shared Groups Available</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default CustomMap;
