export const calculateTotalLoad = (rangeData: any[]): number => {
  return rangeData.reduce((sum, item) => sum + (item.totalLoad || 0), 0);
};

export const sortLocationsByIndents = (locations: any[], topN: number = 10) => {
  return locations
    .sort((a, b) => b.indentCount - a.indentCount)
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
