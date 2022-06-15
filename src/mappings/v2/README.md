# V2 Contracts

## Addresses

- EventFactory:
- EventImplementation:

## Period

- Start Block:
- End Block:

## Notes

### 1. A Big Refactor

The V2 contracts are part of a large refactor to increase the throughput of the system dramatically. One of the main optimizations made has been to batch the NFT mints and fuel deductions into a single transaction, which results in iterating over emitted `IEventImplementation.TicketAction[]` structs to create each Ticket entity in the subgraph. There have also been additional economics revenue functions added, such as a secondary market fee that reserves GET fuel on each secondary market sale event as well as allowing collection of fuel to multiple addresses.

### 2. EventFactory For Contract-Per-Event

We now use the factory pattern to create new smart contracts per-event. To utilize this in the subgraph we implement [data source templates](https://thegraph.com/docs/en/developer/create-subgraph-hosted/#data-source-templates) to allow the graph indexer to listen to the events of newly created event contracts.

### 3. The nftId

Previously on the singular NFT contract we used an `nftIndex` to act as the global ID across all NFT tickets. Because there are now multiple event contracts this nftIndex would overlap and cannot be used alone to route to any given NFT on the platform. For this we need to use a composite ID that can act as a routing key across all networks and events. To allow for this migration, the old event contract has been designated index 0, and all new event contracts will begin at index 1. This ID takes the format of `${networkName}-${eventIndex}-${nftIndex}` using the eventIndex within the EventFactory contract.

- For a V1 ticket with an nftIndex of 2661, this would now have an nftId of `POLYGON-0-2661`
- For a V2 ticket with an nftIndex of 2661 and an eventIndex of 12, this would now have an nftId of `POLYGON-12-2661`

This nftId is now used as the primary key of the Ticket entity within the subgraph.

### 4. Price Oracle

We now have a Price Oracle on-chain for non-custodial top-ups. This is now exposed through the PriceOracle entity.

### 5. currentSpentFuel, currentReservedFuel

The 'current' values on Protocol and Integrator entities represent the real-time state of the system. `currentReservedFuel` being the amount of fuel held within the system awaiting release upon a check-in ticket action. `currentSpentFuel` is the amount of fuel ready to be collected by the SpentFuelRecipients. To avoid confusion these current values only track the V2 economics contract and do not include any amounts awaiting collection on the V1 contract. Over time as V1 events end and tickets are checked-in this should reduce to 0 on V1.

### 6. <fuel>Protocol

For more accurate accounting between protocol-level fees and SaaS/complete-platform fees we introduce new `<fuel>Protocol` variables alongside their equivalent 'totals'. The protocol values will always be a subset of the total and distinguishes protocol-level revenue to be allocated to the future-DAO. Therefore `currentSpentFuel` would represent the total spent fuel available for collection, and `currentSpentFuelProtocol` represents the slice of that revenue collectable by the protocol.
