export const calculateTotalLoad = (rangeData: any[]): number => {
  return rangeData.reduce((sum, item) => sum + (item.totalLoad || 0), 0);
};

export const calculateAvgFulfillment = (fulfillmentData: any[]): number => {
  const totalIndents = fulfillmentData.reduce((sum, item) => sum + (item.indentCount || 0), 0);
  if (totalIndents === 0) return 0;
  
  const weightedSum = fulfillmentData.reduce((sum, item) => {
    const range = item.range;
    let avgPercentage = 0;
    
    if (range.includes('0 - 50%')) avgPercentage = 25; // Midpoint of 0-50%
    else if (range.includes('51 - 70%')) avgPercentage = 60.5; // Midpoint of 51-70%
    else if (range.includes('71 - 90%')) avgPercentage = 80.5; // Midpoint of 71-90%
    else if (range.includes('91 - 100%')) avgPercentage = 95.5; // Midpoint of 91-100%
    
    return sum + (avgPercentage * (item.indentCount || 0));
  }, 0);
  
  return weightedSum / totalIndents;
};

export const sortLocationsByTrips = (locations: any[], topN: number = 10) => {
  return locations
    .sort((a, b) => b.tripCount - a.tripCount)
    .slice(0, topN);
};

export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};
