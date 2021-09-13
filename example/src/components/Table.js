import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_EVENTS } from "../api";
import { Table as UITable, Thead, Tbody, Tfoot, Tr, Th, Td, TableCaption, Box } from "@chakra-ui/react";

const Table = props => {
  const { loading, error, data } = useQuery(GET_EVENTS());
  const [totals, setTotals] = useState({ getUsed: 0, ticketValue: 0, mintCount: 0 });

  if (loading) return "Loading...";
  if (error) return "Error " + error;

  const events = data.events;


  return (
    <Box d="flex" flex="1">
      <UITable variant="simple" >
        <TableCaption>List of Events</TableCaption>
        <Thead>
          <Tr>
            <Th>Event Name</Th>
            <Th isNumeric>getUsed</Th>
            <Th isNumeric>ticketValue</Th>
            <Th isNumeric>mintCount</Th>
            <Th isNumeric>timestamp</Th>
          </Tr>
        </Thead>
        <Tbody>
          {events.map((e, i) => {
            const getUsed = Number(e.getUsed) / 1000;
            const ticketValue = Number(e.ticketValue) / 1000;

            return (
              <Tr>
                <Td>{e.eventName}</Td>
                <Td isNumeric>{getUsed}</Td>
                <Td isNumeric>{ticketValue}</Td>
                <Td isNumeric>{e.mintCount}</Td>
                <Td isNumeric>{e.timestamp}</Td>
              </Tr>
            );
          })}
        </Tbody>
        <Tfoot>
          <Tr>
            <Th></Th>
            <Th>{totals.getUsed}</Th>
            <Th>{totals.ticketValue}</Th>
            <Th>{totals.mintCount}</Th>
            <Th></Th>
          </Tr>
        </Tfoot>
      </UITable>
    </Box>
  );
};

export default Table;
