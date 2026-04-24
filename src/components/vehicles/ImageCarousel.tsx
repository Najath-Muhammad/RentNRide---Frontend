import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[] | undefined; // Allow undefined
  brand: string;
  model: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images = [], brand, model }) => {
  // Default to empty array if images is undefined/null
  const safeImages = Array.isArray(images) ? images : [];
  
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index if currentIndex is out of bounds (e.g. after images change)
  React.useEffect(() => {
    if (safeImages.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= safeImages.length) {
      setCurrentIndex(safeImages.length - 1);
    }
  }, [safeImages.length, currentIndex]);

  const prev = () => {
    setCurrentIndex((i) => (i === 0 ? safeImages.length - 1 : i - 1));
  };

  const next = () => {
    setCurrentIndex((i) => (i === safeImages.length - 1 ? 0 : i + 1));
  };

  // If no images at all
  if (safeImages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={safeImages[currentIndex]}
          alt={`${brand} ${model} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {safeImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="grid grid-cols-3 gap-4">
          {safeImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Thumbnail ${i + 1} of ${brand} ${model}`}
              onClick={() => setCurrentIndex(i)}
              className={`h-32 object-cover rounded-lg cursor-pointer border-4 transition-all ${
                i === currentIndex
                  ? 'border-emerald-600 opacity-100'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;