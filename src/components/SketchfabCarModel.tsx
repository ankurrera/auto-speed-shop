import React, { useState, useEffect } from 'react';

interface SketchfabCarModelProps {
  className?: string;
  width?: number;
  height?: number;
}

const SketchfabCarModel: React.FC<SketchfabCarModelProps> = ({ 
  className = "", 
  width = 800, 
  height = 600 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleMouseDown = () => {
    setIsGrabbing(true);
  };

  const handleMouseUp = () => {
    setIsGrabbing(false);
  };

  useEffect(() => {
    // Set a timeout to handle cases where the iframe doesn't load
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setHasError(true);
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  return (
    <div className={`sketchfab-embed-wrapper relative ${className}`}>
      {/* Loading indicator */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <div className="text-white text-lg font-semibold">Loading 3D Model...</div>
          </div>
        </div>
      )}
      
      {/* Fallback gradient background when iframe fails */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-orange-900/20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/80">
              <div className="text-6xl mb-4">🚗</div>
              <div className="text-lg">Interactive 3D Model</div>
              <div className="text-sm opacity-75">Coming Soon</div>
            </div>
          </div>
        </div>
      )}
      
      <iframe
        title="FREE Concept Car 004 - public domain (CC0)"
        className={`w-full h-full transition-all duration-200 ${
          isGrabbing ? 'cursor-grabbing' : 'cursor-grab'
        } ${hasError ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          border: 'none',
          minHeight: `${height}px`,
          filter: isLoading ? 'blur(2px)' : 'none'
        }}
        allowFullScreen
        allow="autoplay; fullscreen; xr-spatial-tracking"
        width={width}
        height={height}
        src="https://sketchfab.com/models/4cba124633eb494eadc3bb0c4660ad7e/embed?autostart=0&preload=1&ui_theme=dark&dnt=1&camera=0&ui_animations=0&ui_stop=0&ui_watermark=0"
        loading="eager"
        onLoad={handleLoad}
        onError={handleError}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Attribution - Hidden by default but accessible */}
      <div className="sr-only">
        <p>
          <a 
            href="https://sketchfab.com/3d-models/free-concept-car-004-public-domain-cc0-4cba124633eb494eadc3bb0c4660ad7e?utm_medium=embed&utm_campaign=share-popup&utm_content=4cba124633eb494eadc3bb0c4660ad7e" 
            target="_blank" 
            rel="nofollow noopener noreferrer"
          > 
            FREE Concept Car 004 - public domain (CC0) 
          </a> 
          by{" "}
          <a 
            href="https://sketchfab.com/unityfan777?utm_medium=embed&utm_campaign=share-popup&utm_content=4cba124633eb494eadc3bb0c4660ad7e" 
            target="_blank" 
            rel="nofollow noopener noreferrer"
          > 
            Unity Fan youtube channel 
          </a> 
          on{" "}
          <a 
            href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=4cba124633eb494eadc3bb0c4660ad7e" 
            target="_blank" 
            rel="nofollow noopener noreferrer"
          >
            Sketchfab
          </a>
        </p>
      </div>
    </div>
  );
};

export default SketchfabCarModel;