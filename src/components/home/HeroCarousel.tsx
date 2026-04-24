import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const carouselItems = [
    {
        image: '/assets/hero/hero1.png',
        title: 'Luxury Sports Cars',
        subtitle: 'Experience the thrill of high-performance driving.',
    },
    {
        image: '/assets/hero/hero2.png',
        title: 'Premium SUVs',
        subtitle: 'Comfort and space for your family adventures.',
    },
    {
        image: '/assets/hero/hero3.png',
        title: 'Precision Motorcycles',
        subtitle: 'Feel the wind on the open road with our elite bikes.',
    },
];

const HeroCarousel: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const nextSlide = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
        setTimeout(() => setIsAnimating(false), 500);
    }, [isAnimating]);

    const prevSlide = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentIndex((prevIndex) => (prevIndex - 1 + carouselItems.length) % carouselItems.length);
        setTimeout(() => setIsAnimating(false), 500);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    const scrollToExplore = () => {
        const element = document.getElementById('explore');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden rounded-3xl shadow-2xl group">
            {}
            {carouselItems.map((item, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-20" />
                    <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transform scale-105 transition-transform duration-[10s] ease-linear"
                        style={{
                            transform: index === currentIndex ? 'scale(1.1)' : 'scale(1.05)',
                        }}
                    />

                    {}
                    <div className={`absolute bottom-0 left-0 right-0 p-8 md:p-16 z-30 transition-all duration-700 transform ${index === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                        }`}>
                        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
                            {item.title}
                        </h2>
                        <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl drop-shadow-md">
                            {item.subtitle}
                        </p>
                        <button
                            onClick={scrollToExplore}
                            className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-xl"
                        >
                            Explore Now
                        </button>
                    </div>
                </div>
            ))}
            {}
            <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 active:scale-90"
            >
                <ChevronLeft className="w-8 h-8" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 active:scale-90"
            >
                <ChevronRight className="w-8 h-8" />
            </button>
            {}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex gap-3">
                {carouselItems.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-1.5 rounded-full transition-all duration-500 ${index === currentIndex ? 'w-12 bg-white' : 'w-3 bg-white/40 hover:bg-white/60'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroCarousel;
