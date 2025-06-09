"use client";
import React, { forwardRef, useState, useEffect } from 'react'; // Added useEffect

interface TrashCanProps {
  isVisible: boolean;
  onDeleteBlock: (instanceId: string) => void;
  draggingBlockInstanceId: string | null;
}

const TrashCan = forwardRef<HTMLDivElement, TrashCanProps>(
  ({ isVisible, onDeleteBlock, draggingBlockInstanceId }, ref) => {
    const [isHot, setIsHot] = useState(false); // True if mouse is over AND a block is being dragged

    useEffect(() => {
      // If no block is being dragged, the trash can cannot be "hot"
      if (!draggingBlockInstanceId) {
        setIsHot(false);
      }
    }, [draggingBlockInstanceId]);

    const handleMouseEnter = () => {
      if (draggingBlockInstanceId) { // Only become hot if a block is being dragged over
        setIsHot(true);
      }
    };

    const handleMouseLeave = () => {
      setIsHot(false); // Always cool down when mouse leaves
    };

    const handleMouseUp = () => {
      if (isHot && draggingBlockInstanceId) { // isHot implies mouse is over and a block is being dragged
        onDeleteBlock(draggingBlockInstanceId);
      }
      setIsHot(false); // Reset hot state after action or if no action taken
    };

    return (
      <div
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        // Removed onDragOver, onDragEnter, onDragLeave, onDrop from original implementation
        className={`group fixed bottom-6 right-6 p-3 rounded-full shadow-xl transition-all duration-300 ease-in-out
                    ${isVisible && draggingBlockInstanceId ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-12 pointer-events-none'}
                    ${isHot ? 'bg-red-100' : 'bg-white hover:bg-gray-100'}`} // Use isHot for active state
        style={{ width: '68px', height: '68px', zIndex: 1000 }}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Lid part 1 (handle) */}
          <rect
            x="9" y="3" width="6" height="2" rx="1"
            className={`transition-all duration-200 ease-in-out ${isHot ? 'fill-red-600' : 'fill-gray-600'}`} // Use isHot
            style={{
              transformOrigin: '50% 100%',
              transform: isHot ? 'translateY(-2.5px) rotate(-50deg)' : 'translateY(0px) rotate(0deg)', // Use isHot
            }}
          />
          {/* Lid part 2 (main lid surface) */}
          <path
            d="M4 7V9H20V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7Z"
            className={`transition-all duration-200 ease-in-out ${isHot ? 'fill-red-600' : 'fill-gray-600'}`} // Use isHot
            style={{
              transformOrigin: 'center 9px',
              transform: isHot ? 'rotateX(-70deg) translateY(-2px)' : 'rotateX(0deg) translateY(0px)', // Use isHot
            }}
          />
          {/* Bin Body */}
          <path
            d="M6 10H18V20C18 21.1046 17.1046 22 16 22H8C6.89543 22 6 21.1046 6 20V10Z"
            className={`${isHot ? 'fill-red-500' : 'fill-gray-500'}`} // Use isHot
          />
          {/* Lines on the bin */}
          <path d="M10 12V19" stroke={isHot ? "#FCA5A5" : "#E5E7EB"} strokeOpacity="0.8" strokeWidth="1" strokeLinecap="round"/>
          <path d="M14 12V19" stroke={isHot ? "#FCA5A5" : "#E5E7EB"} strokeOpacity="0.8" strokeWidth="1" strokeLinecap="round"/>
        </svg>
        {isHot && ( // Use isHot for tooltip visibility
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 bg-gray-800 text-white text-sm rounded-md shadow-md">
            Relâcher pour supprimer
          </div>
        )}
      </div>
    );
  }
);

TrashCan.displayName = 'TrashCan';
export default TrashCan;
