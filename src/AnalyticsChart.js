import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

// Register all the necessary components for Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const AnalyticsChart = ({ analytics }) => {

  // --- Defensive Guard Clause ---
  // If analytics is null or has no images, we show the placeholder.
  // This is the first line of defense.
  if (!analytics || !analytics.total_images) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
        Process an image to see chart data.
      </div>
    );
  }

  // --- Defensive Data Handling ---
  // We use the Nullish Coalescing Operator (??) to default to 0 if a property is missing.
  // This prevents crashes if the API sends an incomplete object.
  // The labels are defined in this order
const labels = ['Successful Images', 'Failed / No Plate'];

// The data is calculated
const successful = analytics.successful_images && 0;
const failed = analytics.successful_images - successful;

  const isDarkMode = document.documentElement.classList.contains('dark');

  const data = {
    labels: ['Successful Images', 'Failed / No Plate'],
    datasets: [
      {
        label: 'Detections',
        data: [successful, failed],
        backgroundColor: [
          ,  // Green
          'rgba(34, 197, 94, 0.8)',
          'rgba(197, 34, 34, 0.8)'  // Red
        ],
        borderColor: isDarkMode ? '#1e293b' : '#ffffff', // Use background color for a "cutout" look
        borderWidth: 4,
        hoverOffset: 12,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          color: isDarkMode ? '#cbd5e1' : '#475569',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
      title: {
        display: true,
        text: 'Detection Success Rate',
        padding: {
          bottom: 20,
        },
        color: isDarkMode ? '#f1f5f9' : '#1e293b',
        font: {
          size: 20,
          weight: 'bold',
        },
      },
      tooltip: {
        boxPadding: 4,
      },
    },
    cutout: '60%',
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default AnalyticsChart;