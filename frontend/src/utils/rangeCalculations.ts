interface RangeWiseData {
  range: string;
  tripCount: number;
  totalLoad: number;
  percentage: number;
}

export const formatLoad = (load: number): string => {
  return new Intl.NumberFormat('en-IN').format(load);
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};

export const calculateChartData = (rangeData: RangeWiseData[]) => {
  const labels = ['0-100Km', '101-250Km', '251-400Km', '401-600Km'];
  const data = rangeData.map(item => item.totalLoad);
  
  const colors = [
    'rgba(34, 211, 238, 0.8)',   // cyan
    'rgba(96, 165, 250, 0.8)',   // blue
    'rgba(168, 85, 247, 0.8)',   // purple
    'rgba(192, 132, 252, 0.8)',  // light purple
  ];

  const borderColors = [
    'rgba(34, 211, 238, 1)',
    'rgba(96, 165, 250, 1)',
    'rgba(168, 85, 247, 1)',
    'rgba(192, 132, 252, 1)',
  ];

  return {
    labels,
    datasets: [
      {
        label: 'Total Load (Kgs)',
        data,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2,
      },
    ],
  };
};

