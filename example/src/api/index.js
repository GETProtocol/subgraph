import { gql } from "@apollo/client";

const GET_PROTOCOL = gql`
  query GetProtocol {
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

// TODO make dynamic based on timestamp
const GET_PROTOCOL_BY_DAY = () => gql`
  query GetProtocolDays {
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

const GET_EVENTS = () => gql`
  query GetEvents {
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

export { GET_PROTOCOL, GET_PROTOCOL_BY_DAY, GET_EVENTS };
