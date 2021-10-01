import { gql } from "@apollo/client";

const findProtocol = gql`
  query Protocol {
    protocols(id: "1") {
      id
      getUsed
      mintCount
      scanCount
      claimCount
    }
  }
`;

const allProtocolDays = gql`
  query ProtocolDays {
    protocolDays {
      id
      day
      getUsed
      mintCount
      scanCount
      claimCount
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
      orderTime
    }
  }
`;

export { findProtocol, allProtocolDays, allEvents };
