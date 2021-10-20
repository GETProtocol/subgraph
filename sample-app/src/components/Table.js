import { useQuery } from "@apollo/client";
import { allEvents } from "../queries";
import { Table as UITable, Thead, Tbody, Tr, Th, Td, TableCaption, Box } from "@chakra-ui/react";

const Table = () => {
  const { loading, error, data } = useQuery(allEvents);

  if (loading) return "Loading...";
  if (error) return "Error " + error;

  const events = data.events;

  return (
    <Box d="flex" flex="1">
      <UITable variant="simple">
        <TableCaption>List of Events</TableCaption>
        <Thead>
          <Tr>
            <Th>Event Name</Th>
            <Th isNumeric>Latitude</Th>
            <Th isNumeric>longitude</Th>
            <Th isNumeric>Order Time</Th>
          </Tr>
        </Thead>
        <Tbody>
          {events.map((e, i) => {
            if (!e.eventName || e.eventName === "") return null;

            return (
              <Tr>
                <Td>{e.eventName}</Td>
                <Td isNumeric>{e.latitude}</Td>
                <Td isNumeric>{e.longitude}</Td>
                <Td isNumeric>{e.orderTime}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </UITable>
    </Box>
  );
};

export default Table;
