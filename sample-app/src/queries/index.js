import { gql } from "@apollo/client";

const findProtocol = gql`
  query Protocol {
    protocols(id: "1") {
      id
      averageGetPerMint
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
      averageGetPerMint
      mintCount
      scanCount
      claimCount
    }
  }
`;

const allEvents = gql`
  query Events {
    events {
      id
      eventName
      shopUrl
      orderTime
    }
  }
`;

export { findProtocol, allProtocolDays, allEvents };
