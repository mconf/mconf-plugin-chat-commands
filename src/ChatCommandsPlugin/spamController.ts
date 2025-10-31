// Global spam control
let activeSpamIntervals: NodeJS.Timeout[] = [];

export const getActiveSpamIntervals = (): NodeJS.Timeout[] => activeSpamIntervals;

export const addSpamInterval = (intervalId: NodeJS.Timeout): void => {
  activeSpamIntervals.push(intervalId);
};

export const clearAllSpamIntervals = (): number => {
  activeSpamIntervals.forEach((intervalId) => clearInterval(intervalId));
  const count = activeSpamIntervals.length;
  activeSpamIntervals = [];
  return count;
};
