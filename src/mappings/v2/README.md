# V2 Contracts

## Addresses

- BaseGET: 0xbce1b23c7544422f1E2208d29A6A3AA9fAbAB250
- EventMetadataStorage: 0x08C2aF3F01A36AD9F274ccE77f6f77cf9aa1dfC9
- EconomicsGET: 0x07faA643ad0eE4ee358d5E101573A5fdfBEcD0a9

## Period

- Start Block: 20363107
- End Block: **ACTIVE**

## Notes

### 1. Temporary primaryPrice Conversion

The correct USD basePrice was not submitted until approximately a day after the contracts went live. As a result we use the same currency conversion technique as in the V1 mappings but set an end block after which the conversion is no longer required. After block 20410204 the basePrice was correctly supplied by the Ticket Engine and can be taken verbatim. The rates were selected to cover only the specific day in which the convestion was needed.

### 2. Fetching Ticket Struct on Mint

Unlike the V1 contracts thee eventAddress is no longer emitted with the PrimarySaleMint event and must be retrieved from the data on-chain. Doing so typically slows down the indexing of the subgraph data but in this case is required. Handily this function call is used to also retrieve the primaryPrice for the above currency conversion as well as retrieving the eventAddress. Since we store the ticket by its NFT index after the PrimarySaleMint event, this event address can be fetched from the already-stored Ticket entity within the subgraph without needing to re-query the chain for data.

### 3. On-Chain Economics

The on-chain economics and accounting of GET went live during the V2 contracts. This was enabled on block 20637829 and the economics fields should only be used from within an if statement allowing blocks greater than or equal to 20637829. Any events from blocks previous to this can be assumed to be for testing purposes only and should be set to 0. Transaction: https://polygonscan.com/tx/0xe9ef44375aa2a2cb70fb6244e60ca6c8ca60fca3dd6e0fa3b42e779d1d0faba3

### 4. uint64 Accuracy

In earlier versions of the contract gasUsed was chosen to be emitted as a uint64 rather than a uint256. Upon casting the uint256 gasUsed variable to a uint64 it rounds down to a floor set by the maximum precision available on a 64-bit integer. Over time this causes a slight drift in the amount of GET used as fuel in the fuel metrics. Future versions of the contract will emit a uint256 to avoid this issue. The workaround for this version is to fetch the fuel tank balance for each ticket after minting and use that as the getUsed. At this stage all actions to reduce the fuel tank balance will empty it in full, so we can assume that the getUsed for scanning and check-in is always equal to the fuel tank balance.
