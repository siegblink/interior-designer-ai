import { useRef, useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface ExampleImagesProps {
  onImageSelect: (imageUrl: string) => void;
}

export function ExampleImages({ onImageSelect }: ExampleImagesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImages() {
      try {
        const response = await fetch('/api/list-examples');
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setImages(data.images);
      } catch (err) {
        console.error('Failed to fetch example images:', err);
        setError('Failed to load example images');
      } finally {
        setLoading(false);
      }
    }

    fetchImages();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLImageElement>, imageUrl: string) => {
    e.dataTransfer.setData('text/plain', imageUrl);
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-sm text-gray-400">Loading example images...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-sm text-red-400">{error}</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-sm text-gray-400">No example images found</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2 transform">
        <button
          onClick={() => scroll('left')}
          className="rounded-r bg-gray-800 p-2 text-white opacity-75 transition-opacity hover:opacity-100"
        >
          <FaChevronLeft className="h-6 w-6" />
        </button>
      </div>
      
      <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2 transform">
        <button
          onClick={() => scroll('right')}
          className="rounded-l bg-gray-800 p-2 text-white opacity-75 transition-opacity hover:opacity-100"
        >
          <FaChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div 
        ref={scrollContainerRef}
        className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth px-2 py-4"
      >
        {images.map((imageUrl, index) => (
          <div 
            key={index}
            className="relative flex-none"
          >
            <img
              src={imageUrl}
              alt={`Example ${index + 1}`}
              className="h-40 w-64 cursor-grab rounded-lg object-cover transition-transform hover:scale-105"
              draggable
              onDragStart={(e) => handleDragStart(e, imageUrl)}
              onClick={() => onImageSelect(imageUrl)}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 