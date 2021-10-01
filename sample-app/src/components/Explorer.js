import React from "react";
import Chart from "./Chart";
import { allProtocolDays, allEvents } from "../queries";
import { Box } from "@chakra-ui/react";

import ProtocolStats from "./ProtocolStats";
import Table from "./Table";

const Explorer = () => {
  return (
    <Box h="100vh" w="100vw" d="flex" p="100" flexDir="column">
      <ProtocolStats />

      <Box flex="1">
        <Chart
          entity="protocolDays"
          query={allProtocolDays}
          xAxis="day"
          fields={["getUsed", "mintCount", "scanCount", "claimCount"]}
        />
      </Box>

      <Box flex="1">
        <Chart entity="events" query={allEvents} xAxis="orderTime" fields={["getUsed"]} />
      </Box>

      <Table />
    </Box>
  );
};

export default Explorer;
