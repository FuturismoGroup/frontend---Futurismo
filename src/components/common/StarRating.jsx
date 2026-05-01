import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

const StarRating = ({ 
  rating = 0, 
  maxRating = 5, 
  size = 'md', 
  interactive = false, 
  onChange,
  showValue = false,
  disabled = false,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  // Mobile-first responsive sizes
  const sizes = {
    xs: 'w-3 h-3 sm:w-3 sm:h-3',
    sm: 'w-4 h-4 sm:w-4 sm:h-4', 
    md: 'w-5 h-5 sm:w-5 sm:h-5',
    lg: 'w-6 h-6 sm:w-7 sm:h-7',
    xl: 'w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9'
  };

  const handleStarClick = (starValue) => {
    if (!interactive || disabled) return;
    
    setCurrentRating(starValue);
    if (onChange) {
      onChange(starValue);
    }
  };

  const handleStarHover = (starValue) => {
    if (!interactive || disabled) return;
    setHoverRating(starValue);
  };

  const handleMouseLeave = () => {
    if (!interactive || disabled) return;
    setHoverRating(0);
  };

  const getStarColor = (starIndex) => {
    const activeRating = interactive ? (hoverRating || currentRating) : rating;
    
    if (starIndex <= activeRating) {
      return 'text-yellow-400';
    }
    return 'text-gray-300';
  };

  const renderStar = (starIndex) => {
    const activeRating = interactive ? (hoverRating || currentRating) : rating;
    const isFilled = starIndex <= activeRating;
    
    return (
      <button
        key={starIndex}
        type="button"
        className={`
          ${interactive && !disabled ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
          ${disabled ? 'opacity-50' : ''}
          transition-all duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded
          touch-manipulation
          p-1
        `}
        onClick={() => handleStarClick(starIndex)}
        onMouseEnter={() => handleStarHover(starIndex)}
        onMouseLeave={handleMouseLeave}
        disabled={disabled || !interactive}
        aria-label={`Calificar ${starIndex} de ${maxRating} estrella${starIndex > 1 ? 's' : ''}`}
      >
        {isFilled ? (
          <StarIcon className={`${sizes[size]} ${getStarColor(starIndex)} drop-shadow-sm`} />
        ) : (
          <StarOutlineIcon className={`${sizes[size]} ${getStarColor(starIndex)}`} />
        )}
      </button>
    );
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2 ${className}`}>
      {/* Mobile-first responsive stars container */}
      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
        {Array.from({ length: maxRating }, (_, index) => renderStar(index + 1))}
      </div>
      
      {/* Mobile-first responsive value display */}
      {showValue && (
        <div className="flex items-center justify-center mt-1 sm:mt-0 sm:ml-2">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            {interactive ? currentRating : rating.toFixed(1)} / {maxRating}
          </span>
        </div>
      )}
    </div>
  );
};

StarRating.propTypes = {
  rating: PropTypes.number,
  maxRating: PropTypes.number,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  interactive: PropTypes.bool,
  onChange: PropTypes.func,
  showValue: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default StarRating;