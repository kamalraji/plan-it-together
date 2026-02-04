import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  bgGradient: string;
  ctaText: string;
}

const PROMO_BANNERS: BannerSlide[] = [
  {
    id: '1',
    title: 'Flat 20% Off on Photography',
    subtitle: 'Book verified photographers for your events. Limited time offer!',
    bgGradient: 'from-blue-600 via-blue-700 to-indigo-800',
    ctaText: 'Book Now',
  },
  {
    id: '2', 
    title: 'Premium Venues Available',
    subtitle: 'Exclusive venues for weddings, conferences & more',
    bgGradient: 'from-emerald-600 via-teal-700 to-cyan-800',
    ctaText: 'Explore',
  },
  {
    id: '3',
    title: 'New Vendors This Week',
    subtitle: '50+ verified vendors joined our marketplace',
    bgGradient: 'from-purple-600 via-violet-700 to-fuchsia-800',
    ctaText: 'Discover',
  },
];

export const PromoBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + PROMO_BANNERS.length) % PROMO_BANNERS.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % PROMO_BANNERS.length);

  return (
    <div className="relative w-full h-32 sm:h-40 md:h-48 rounded-xl overflow-hidden group">
      {/* Slides */}
      <div 
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {PROMO_BANNERS.map((banner) => (
          <div
            key={banner.id}
            className={cn(
              'min-w-full h-full flex items-center px-6 sm:px-10 md:px-16',
              'bg-gradient-to-r',
              banner.bgGradient
            )}
          >
            <div className="text-white max-w-xl">
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 drop-shadow-lg">
                {banner.title}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-white/90 mb-3 sm:mb-4 line-clamp-2">
                {banner.subtitle}
              </p>
              <button className="px-4 py-1.5 sm:px-6 sm:py-2 bg-card text-foreground font-medium text-xs sm:text-sm rounded-lg hover:bg-card/90 transition-colors shadow-lg">
                {banner.ctaText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-card/20 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card/30"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-card/20 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card/30"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {PROMO_BANNERS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              currentSlide === idx ? 'bg-card w-6' : 'bg-card/50 hover:bg-card/70'
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default PromoBanner;
