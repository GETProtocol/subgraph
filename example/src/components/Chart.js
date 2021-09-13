import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { useQuery } from "@apollo/client";
import { Box, Button } from "@chakra-ui/react";

function formatDataForBar(data, fieldToPlot) {
  const labels = [];
  const values = [];

  for (let i = 0; i < data.length; i++) {
    labels.push(data[i].timestamp);
    values.push(Number(data[i][fieldToPlot]));
  }

  const _data = {
    labels,
    datasets: [
      {
        label: fieldToPlot,
        data: values,
        backgroundColor: "green"
      }
    ]
  };

  return _data;
}

const Chart = ({ query, fields=[], entity }) => {
  const [fieldToPlot, setFieldToPlot] = useState(fields[0] || '');
  const { loading, error, data } = useQuery(query);
  
  if (loading) return "Loading...";
  if (error) return "Error..." + error.message;
  
  const dataByDay = data[entity]
  
  return (
    <>
      <Box d="flex" h="32" bgColor="blue" justifyContent="center" alignItems="center" experimental_spaceX="4">
        {fields.map((field, i) => (
          <Button key={i} onClick={() => setFieldToPlot(field)}>{field}</Button>
        ))}
      </Box>

      <Bar data={formatDataForBar(dataByDay, fieldToPlot)} options={options} />
    </>
  );
};

const options = {
  scales: {
    yAxes: [
      {
        stacked: true,
        ticks: {
          beginAtZero: true
        }
      }
    ],
    xAxes: [
      {
        stacked: true
      }
    ]
  }
};

export default Chart;
