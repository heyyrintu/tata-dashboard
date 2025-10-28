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
    'rgba(34, 211, 238, 0.8)',   // cyan
    'rgba(59, 130, 246, 0.8)',   // blue
    'rgba(168, 85, 247, 0.8)',   // purple
    'rgba(192, 132, 252, 0.8)',  // light purple
  ];

  const borderColors = [
    'rgba(34, 211, 238, 1)',
    'rgba(59, 130, 246, 1)',
    'rgba(168, 85, 247, 1)',
    'rgba(192, 132, 252, 1)',
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

