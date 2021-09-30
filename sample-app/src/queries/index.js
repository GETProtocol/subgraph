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
      timestamp
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
      mintCount
      timestamp
    }
  }
`;

export { findProtocol, allProtocolDays, allEvents };
