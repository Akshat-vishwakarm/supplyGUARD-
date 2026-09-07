import React, { useState, useEffect } from 'react';

interface RealTimeClockProps {
  showSeconds?: boolean;
  format?: '12h' | '24h';
  className?: string;
}

export default function RealTimeClock({ 
  showSeconds = true, 
  format = '12h', 
  className = '' 
}: RealTimeClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    if (format === '24h') {
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined
      });
    }
  };

  return (
    <span className={className}>
      {formatTime(currentTime)}
    </span>
  );
}