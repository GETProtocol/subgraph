import React, { useState } from "react";
import Chart from "./Chart";
import { GET_PROTOCOL_BY_DAY, GET_EVENTS } from "../api";
import { Box, Button } from "@chakra-ui/react";

import ProtocolStats from "./ProtocolStats";
import Table from './Table';

const Explorer = props => {
  return (
    <Box h="100vh" w="100vw" d="flex" p="100" flexDir="column">
        <ProtocolStats />

      <Box flex="1">
        <Chart
          entity="protocolDays"
          query={GET_PROTOCOL_BY_DAY()}
          fields={["ticketValue", "changeCount", "claimCount", "getUsed", "mintCount", "scanCount"]}
        />
      </Box>

      <Box flex="1">
        <Chart
          entity="events"
          query={GET_EVENTS()}
          fields={["ticketValue", "changeCount", "getUsed", "mintCount", "scanCount"]}
        />
      </Box>

      <Table />
    </Box>
  );
};

export default Explorer;
