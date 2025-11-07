export const TRUCK_CAPACITY = 6000;

export interface FulfillmentData {
  range: string;
  tripCount: number;
}

export const formatIndentCount = (count: number): string => {
  return new Intl.NumberFormat('en-IN').format(count);
};

export const calculateFulfillmentChartData = (fulfillmentData: FulfillmentData[]) => {
  const labels = fulfillmentData.map(item => item.range);
  const data = fulfillmentData.map(item => item.tripCount);
  
  const colors = [
    'rgba(224, 30, 31, 0.8)',   // Red - 0-150 buckets
    'rgba(254, 165, 25, 0.8)',   // Orange/Yellow - 151-200 buckets
    'rgba(255, 107, 53, 0.8)',   // Orange-Red - 201-250 buckets
    'rgba(255, 140, 66, 0.8)',   // Light Orange - 251-300 buckets
    'rgba(156, 163, 175, 0.8)',  // Gray - Other (300+)
  ];

  const borderColors = [
    '#E01E1F',  // Red - 0-150 buckets
    '#FEA519',  // Orange/Yellow - 151-200 buckets
    '#FF6B35',  // Orange-Red - 201-250 buckets
    '#FF8C42',  // Light Orange - 251-300 buckets
    '#9CA3AF',  // Gray - Other (300+)
  ];

  return {
    labels,
    datasets: [
      {
        label: 'Number of Trips',
        data,
        backgroundColor: labels.map((_, index) => colors[index % colors.length]),
        borderColor: labels.map((_, index) => borderColors[index % borderColors.length]),
        borderWidth: 2,
      },
    ],
  };
};

