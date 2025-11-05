export const TRUCK_CAPACITY = 6000;

export interface FulfillmentData {
  range: string;
  indentCount: number;
}

export const formatIndentCount = (count: number): string => {
  return new Intl.NumberFormat('en-IN').format(count);
};

export const calculateFulfillmentChartData = (fulfillmentData: FulfillmentData[]) => {
  const labels = fulfillmentData.map(item => item.range);
  const data = fulfillmentData.map(item => item.indentCount);
  
  const colors = [
    'rgba(224, 30, 31, 0.8)',   // Red - 0-150 (0-50%)
    'rgba(254, 165, 25, 0.8)',   // Orange/Yellow - 151-200 (50-67%)
    'rgba(255, 107, 53, 0.8)',   // Orange-Red - 201-250 (67-83%)
    'rgba(255, 140, 66, 0.8)',   // Light Orange - 251-300 (84-100%)
  ];

  const borderColors = [
    '#E01E1F',  // Red - 0-150 (0-50%)
    '#FEA519',  // Orange/Yellow - 151-200 (50-67%)
    '#FF6B35',  // Orange-Red - 201-250 (67-83%)
    '#FF8C42',  // Light Orange - 251-300 (84-100%)
  ];

  return {
    labels,
    datasets: [
      {
        label: 'Number of Indents',
        data,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2,
      },
    ],
  };
};

