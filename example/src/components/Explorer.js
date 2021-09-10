import React, { useState } from "react";
import Chart from "./Chart";
import { Box, Button } from "@chakra-ui/react";

const Explorer = props => {

  return (
    <Box h="100vh" w="100vw" d="flex" p="100" flexDir="column">
      <Box d="flex" h="64" bgColor="green" justifyContent="center" alignItems="center" experimental_spaceX="4">
        <Button>Events by Day</Button>
        <Button>Protocol by Day</Button>
      </Box>



      <Box flex="1">
        <Chart />
      </Box>
    </Box>
  );
};

export default Explorer;
