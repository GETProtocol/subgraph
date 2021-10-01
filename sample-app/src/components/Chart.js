import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { useQuery } from "@apollo/client";
import { Box, Button } from "@chakra-ui/react";

const options = {
  scales: {
    yAxes: [
      {
        stacked: true,
        ticks: {
          beginAtZero: true,
        },
      },
    ],
    xAxes: [
      {
        stacked: true,
      },
    ],
  },
};

function formatDataForBar(data, xAxis, fieldToPlot) {
  const labels = [];
  const values = [];

  data.forEach((item) => {
    labels.push(item[xAxis]);
    values.push(Number(item[fieldToPlot]));
  });

  return {
    labels,
    datasets: [
      {
        label: fieldToPlot,
        data: values,
        backgroundColor: "green",
      },
    ],
  };
}

const Chart = ({ query, xAxis, fields = [], entity }) => {
  const [fieldToPlot, setFieldToPlot] = useState(fields[0] || "");
  const { loading, error, data } = useQuery(query);

  if (loading) return "Loading...";
  if (error) return "Error..." + error.message;

  const dataByDay = data[entity];

  return (
    <>
      <Box d="flex" h="32" bgColor="blue" justifyContent="center" alignItems="center" experimental_spaceX="4">
        {fields.map((field, i) => (
          <Button key={i} onClick={() => setFieldToPlot(field)}>
            {field}
          </Button>
        ))}
      </Box>

      <Bar data={formatDataForBar(dataByDay, xAxis, fieldToPlot)} options={options} />
    </>
  );
};

export default Chart;
