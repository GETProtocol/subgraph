import { gql } from "@apollo/client";

const GET_PROTOCOL = gql`
    query GetProtocol {
        protocols {
            id
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

export { GET_PROTOCOL, GET_PROTOCOL_BY_DAY }
