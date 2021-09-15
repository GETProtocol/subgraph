import { gql } from "@apollo/client";

const findProtocol = gql`
  query Protocol {
    protocols(id: "0001") {
      id
      getUsed
      ticketValue
      mintCount
      scanCount
      claimCount
      changeCount
    }
  }
`;

const allProtocolDays = gql`
  query ProtocolDays {
    protocolDays {
      id
      timestamp
      getUsed
      ticketValue
      mintCount
      scanCount
      claimCount
      changeCount
    }
  }
`;

const allEvents = gql`
  query Events {
    events(where: { getUsed_gt: 1 }) {
      id
      getUsed
      eventName
      shopUrl
      ticketValue
      mintCount
      timestamp
    }
  }
`;

export { findProtocol, allProtocolDays, allEvents };
