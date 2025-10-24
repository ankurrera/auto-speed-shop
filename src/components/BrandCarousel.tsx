// src/components/BrandCarousel.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Import your logos
import audiLogo from '@/assets/logos/audi.png';
import bmwLogo from '@/assets/logos/bmw.png';
import chevroletLogo from '@/assets/logos/chevrolet.png';
import fordLogo from '@/assets/logos/ford.png';
import hondaLogo from '@/assets/logos/honda.png';
import mazdaLogo from '@/assets/logos/mazda.png';
import mercedesLogo from '@/assets/logos/mercedes.png';
import nissanLogo from '@/assets/logos/nissan.png';
import subaruLogo from '@/assets/logos/subaru.png';
import toyotaLogo from '@/assets/logos/toyota.png';

const logos = [
  { src: audiLogo, alt: 'Audi' },
  { src: bmwLogo, alt: 'BMW' },
  { src: chevroletLogo, alt: 'Chevrolet' },
  { src: fordLogo, alt: 'Ford' },
  { src: hondaLogo, alt: 'Honda' },
  { src: mazdaLogo, alt: 'Mazda' },
  { src: mercedesLogo, alt: 'Mercedes' },
  { src: nissanLogo, alt: 'Nissan' },
  { src: subaruLogo, alt: 'Subaru' },
  { src: toyotaLogo, alt: 'Toyota' },
];

const BrandCarousel: React.FC = () => {
  const navigate = useNavigate();

  const handleBrandClick = (brandName: string) => {
    navigate(`/shop?make=${brandName}`);
  };

  return (
    <div className="bg-background py-12">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Featured Brands</h2>
        <div className="scroll-container" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div className="scroll-content" style={{ display: 'inline-block' }}>
            {[...logos, ...logos].map((logo, index) => (
              <div
                key={index}
                className="inline-block flex-shrink-0 cursor-pointer transition-transform duration-300 hover:scale-110 mx-6"
                onClick={() => handleBrandClick(logo.alt)}
              >
                <img src={logo.src} alt={logo.alt} className="h-16" loading="lazy" decoding="async" height="64" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandCarousel;