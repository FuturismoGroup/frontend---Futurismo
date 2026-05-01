import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

const CurrentTimeIndicator = ({ position, currentTime }) => {
  if (position === null) return null;
  
  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${position}px` }}
    >
      <div className="relative">
        <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
        <div className="h-0.5 bg-red-500" />
        <span className="absolute left-3 -top-2.5 text-xs text-red-500 font-medium bg-white px-1">
          {format(currentTime, 'HH:mm')}
        </span>
      </div>
    </div>
  );
};

CurrentTimeIndicator.propTypes = {
  position: PropTypes.number,
  currentTime: PropTypes.instanceOf(Date).isRequired
};

export default CurrentTimeIndicator;