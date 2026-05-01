import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

const TimeLabel = ({ hour, isCurrentHour }) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  
  return (
    <div className="h-[60px] pr-4 text-right flex items-start pt-1">
      <span 
        className={`text-sm ${
          isCurrentHour 
            ? 'font-semibold text-blue-600' 
            : 'text-gray-500'
        }`}
      >
        {format(date, 'h a')}
      </span>
    </div>
  );
};

TimeLabel.propTypes = {
  hour: PropTypes.number.isRequired,
  isCurrentHour: PropTypes.bool
};

TimeLabel.defaultProps = {
  isCurrentHour: false
};

export default TimeLabel;