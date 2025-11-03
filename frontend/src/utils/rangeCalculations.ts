interface RangeWiseData {
  range: string;
  indentCount: number;
  totalLoad: number;
  percentage: number;
  bucketCount: number;
  barrelCount: number;
}

export const formatLoad = (load: number): string => {
  return new Intl.NumberFormat('en-IN').format(load);
};

export const formatBucketCount = (load: number): string => {
  const bucketCount = Math.round((load / 20) * 100) / 100;
  return new Intl.NumberFormat('en-IN').format(bucketCount);
};

export const formatBucketBarrelCount = (bucketCount: number, barrelCount: number): string => {
  const bucketStr = new Intl.NumberFormat('en-IN').format(bucketCount);
  const barrelStr = new Intl.NumberFormat('en-IN').format(barrelCount);
  return `${bucketStr} + ${barrelStr}`;
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};

export const calculateChartData = (rangeData: RangeWiseData[]) => {
  const labels = ['0-100Km', '101-250Km', '251-400Km', '401-600Km'];
  const data = rangeData.map(item => item.bucketCount);
  
  const colors = [
    'rgba(224, 30, 31, 0.8)',   // Red - theme color
    'rgba(254, 165, 25, 0.8)',   // Orange/Yellow - theme color
    'rgba(255, 107, 53, 0.8)',   // Orange-Red - variation
    'rgba(255, 140, 66, 0.8)',   // Light Orange - variation
  ];

  const borderColors = [
    '#E01E1F',  // Red
    '#FEA519',  // Orange/Yellow
    '#FF6B35',  // Orange-Red
    '#FF8C42',  // Light Orange
  ];

  return {
    labels,
    datasets: [
      {
        label: 'Bucket Count',
        data,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2,
      },
    ],
  };
};

