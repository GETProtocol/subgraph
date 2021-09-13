import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { GET_PROTOCOL } from "../api";
import { useQuery } from "@apollo/client";

const ProtocolStats = props => {
  const { loading, error, data } = useQuery(GET_PROTOCOL);

  if (loading) return "Loading...";
  if (error) return "Erorr" + error;

  const protocol = data.protocols[0];
  const keys = Object.keys(protocol);

  function cardFactory(label, value, key) {
    const isNumber = !isNaN(value);

    if (isNumber && Number(value) > 10000000) {
      value = Number(value) / 1000;
    }

    return (
      <Box minH="64px" d="flex" flex="1" flexDir="column" key={key} bgColor="orange" justifyContent="center" p="8">
        <Text>{label}</Text>
        <Text fontWeight="bold" fontSize="2rem">
          {value}
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text fontSize="3rem" fontWeight="bold">
        Protocol Stats
      </Text>
      <Box flex="1" d="flex" flexDir="row" experimental_spaceX="4" mb="4">
        {keys.map((k, i) => {
          if (k.includes("__")) return;
          return cardFactory(k, protocol[k], i);
        })}
      </Box>
    </Box>
  );
};

export default ProtocolStats;
