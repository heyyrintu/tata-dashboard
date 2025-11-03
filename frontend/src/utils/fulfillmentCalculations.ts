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
        label: 'Number of Indents',
        data,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2,
      },
    ],
  };
};

