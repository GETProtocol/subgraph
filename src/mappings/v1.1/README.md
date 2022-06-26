# V1.1 Contracts

## Addresses

- BaseGET: 0xbce1b23c7544422f1E2208d29A6A3AA9fAbAB250
- EconomicsGET: 0x07faA643ad0eE4ee358d5E101573A5fdfBEcD0a9
- EventMetadataStorage: 0x08C2aF3F01A36AD9F274ccE77f6f77cf9aa1dfC9
- GETProtocolConfigurationV2: 0xbce1b23c7544422f1E2208d29A6A3AA9fAbAB250

## Notes

### 1. Temporary primaryPrice Conversion

The correct USD basePrice was not submitted until approximately a day after the contracts went live. As a result we use the same currency conversion technique as in the V1 mappings but set an end block after which the conversion is no longer required. After block 20410204 the basePrice was correctly supplied by the Ticket Engine and can be taken verbatim. The rates were selected to cover only the specific day in which the convestion was needed.

### 2. Fetching Ticket Struct on Mint

Unlike the V1 contracts thee eventAddress is no longer emitted with the PrimarySaleMint event and must be retrieved from the data on-chain. Doing so typically slows down the indexing of the subgraph data but in this case is required. Handily this function call is used to also retrieve the primaryPrice for the above currency conversion as well as retrieving the eventAddress. Since we store the ticket by its NFT index after the PrimarySaleMint event, this event address can be fetched from the already-stored Ticket entity within the subgraph without needing to re-query the chain for data.

### 3. On-Chain Economics

The on-chain economics and accounting of GET went live during the V1.1 contracts. This was enabled on block 20637829 and the economics fields should only be used from within an if statement allowing blocks greater than or equal to 20637829. Any events from blocks previous to this can be assumed to be for testing purposes only and should be set to 0. Transaction: https://polygonscan.com/tx/0xe9ef44375aa2a2cb70fb6244e60ca6c8ca60fca3dd6e0fa3b42e779d1d0faba3

### 4. uint64 Accuracy

In earlier versions of the contract gasUsed was chosen to be emitted as a uint64 rather than a uint256. Upon casting the uint256 gasUsed variable to a uint64 it rounds down to a floor set by the maximum precision available on a 64-bit integer. Over time this causes a slight drift in the amount of GET used as fuel in the fuel metrics. Future versions of the contract will emit a uint256 to avoid this issue. The workaround for this version is to fetch the fuel tank balance for each ticket after minting and use that as the getUsed. At this stage all actions to reduce the fuel tank balance will empty it in full, so we can assume that the getUsed for scanning and check-in is always equal to the fuel tank balance.

### 4. Future-proofing nftIndex

Later versions of the subgraph will use an `nftId` which is made up of three components; networkId, eventIndex, tokenId. As each subgraph is separated by the network it indexes there is no need to store the networkId within the subgraph, so from this point onwards all NFTs minted under the v1 and v1.1 mappings will be prefaced with the eventIndex. The full ID takes the form of `<networkId>-<eventIndex>-<tokenId>`. As future iterations will start the eventIndex from 1, here we use "0" to denominate the eventIndex for backwards compatibility.

### 5. The 'billingIntegrator'

V2 of the get-protocol-core contracts created a hard separation between the Relayers and Integrators, moving away from using a shared relayer and shared fuel accounting. This meant that mappings need to be made to define _which integrator owns the event_, and _which integrator was billed for the event_. These are subtly different things but becomes more apparent when an event may have been created by GUTS tickets, although the fuel accounting was handled by a shared relayer account. For these cases we map `Event.integrator` using and replacing the existing `Event.ticketeerName`, and we deduct fuel usage from `Relayer.integrator`. This means that integrators must be reserved on the V2 contracts in a specific order to allow for the mappings in _src/constants/contracts.ts_ to work but allows for the translation of existing data models into the new V2 schema.
