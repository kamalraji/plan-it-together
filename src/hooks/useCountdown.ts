import { useState, useEffect } from 'react';

interface TimeLeft {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => 
    targetDate ? calculateTimeLeft(targetDate) : { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  );
  const [isExpired, setIsExpired] = useState(!targetDate || targetDate.getTime() <= Date.now());

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft(targetDate);
      if (remaining.total <= 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return { timeLeft, isExpired };
}
