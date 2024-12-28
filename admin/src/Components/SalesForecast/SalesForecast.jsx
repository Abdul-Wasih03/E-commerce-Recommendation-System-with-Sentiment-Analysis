import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './SalesForecast.css'; // Add your CSS for styling

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SalesForecast = () => {
  const [forecastData, setForecastData] = useState([]);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    // Fetch forecast data from the backend
    fetch('http://localhost:5000/sales-forecast')
      .then((response) => response.json())
      .then((data) => {
        const dates = data.map(item => item.date);  // Extract dates from the response
        const sales = data.map(item => item.predicted_sales);  // Extract predicted sales
        
        setLabels(dates);
        setForecastData(sales);
      })
      .catch((error) => console.error('Error fetching sales forecast:', error));
  }, []);

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Sales Forecast',
        data: forecastData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Sales Forecast for Upcoming Periods'
      }
    },
    scales: {
      y: {
        beginAtZero: false  // You may want to remove this to see actual sales values
      }
    }
  };

  return (
    <div className="sales-forecast">
      <h2>Sales Forecast</h2>
      <Line data={data} options={options} />
    </div>
  );
};

export default SalesForecast;
