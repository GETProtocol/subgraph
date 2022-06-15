# GET Protocol Subgraph

> Aggregating and indexing all on-chain event, ticket, and protocol data.

The GET Protocol subgraph acts as the complete data interface to all on-chain data. Its purpose is to properly aggregate and index all static and time-series data passing through the protocol.

- _Cross-sectional_ data is compiled to its latest update and will always return the latest state.
- _Aggregate_ data aggregated across all time, similar to cross-sectional in that there should be one record per-entity.
- _Time-series_ individual granular events of raw data, either as individual records or within a time-bucket.

There are a number of key entities to be aware of:

#### Event [Cross-sectional]

Indexes all metadata for an _Event_ by its `address` as each Event has it's own independent address on-chain. Updates to an _Event_ will overwrite the data within this entity, so this will always represent the latest state. All actions visible through the associated `usageEvents` field.

#### Ticket [Cross-sectional]

Holds individual records for each _Ticket_, represented by a unique NFT on-chain and ID'd by its `nftIndex`. All actions visible through the associated `usageEvents` field.

#### Protocol [Aggregate]

All-time data for protocol-wide metrics, aggregated. This is used to capture the all-time usage on the protocol across all integrators. Singleton with ID '1'.

#### ProtocolDay [Time-series]

Similar content to _Protocol_ but aggregrated to each UTC-day. Used to track protocol usage over time. ID is a `dayInteger` from the unix epoch (unix / 86400).

#### Relayer [Cross-sectional]

Relayers track the address/account used to mint tickets on behalf of an integrator. No aggregate statistics are kept here and are only used as a reference for the addresses submiting transactions for the integrator.

#### Integrator [Aggregate]

All-time data for individual integrator, with total usage and counts. ID'd by the `integratorIndex`. Used for accounting and aggregate NFT statistics.

#### IntegratorDay [Time-series]

Usage statistics per-integrator-day. Used to track and compare protocol usage by integrator. ID is a composite key of `integratorIndex-dayInteger`.

#### SpentFuelRecipient [Cross-sectional]

Tracks the configured destination addresses of the spent fuel. Harvesting the spent fuel is a public function and can be executed by any account, so this entity tracks the amount of GET sent to each configured address.

#### PriceOracle [Cross-sectional]

The on-chain price oracle is used to set the price of non-custodial top-ups (integrators that bring their own GET fuel). Here we track the current price of the oracle and the time it was last updated.

#### TopUpEvent [Time-series]

Tracks each individual integrator top-up as a separate record to allow for a full record of the amount of each top up and its price in USD. ID is a composite key of `txHash-logIndex`.

#### UsageEvent [Time-series]

Not to be confused with a real-world Event, these are 'events' that describe an individual uage of the protocol such as `EVENT_CREATED`, `SOLD`, `SCANNED`. Comes with lat/long, the relayer & integrator, the GET used as fuel, the exact timestamp of the block, and the day as an integer. ID is a composite key of `txHash-logIndex`.

#### SpentFuelCollectedEvent [Time-series]

Records each collection of spent fuel within the economics contract per-recipient. When multiple recipient destinations are present, one event will be recorded for each. Tracks where the spent fuel is flowing to.

## Hosted Service

The GET Protocol Subgraph is available on [The Graph Hosted Service](https://thegraph.com/hosted-service/subgraph/getprotocol/get-protocol-subgraph), which offers a playground environment for testing queries and exploring entity relationships. A [Playground Environment](https://thegraph.com/hosted-service/subgraph/getprotocol/playground-get-protocol-subgraph) is also available for integrator testing.

## Tracking the flow of GET

Please see the [DAO Token Economics Documentation](https://docs.get-protocol.io/docs/dao-token-economics-accounting) for full details on how GET balances move through the system.

There are a number of steps that GET takes throughout its lifecycle and the subgraph aggregated this for easier charting and analysis. There are a number of key field that help with this:

- `availableFuel` acts as the available balance-on-account for an integrator, used to pay for actions.
- `reservedFuel` contains the total amount of GET fuel that has been reserved.
- `currentReservedFuel` is the fuel currently held within the system, and will be released when a ticket is finalized.
- `spentFuel` the total aggregate amount of fuel that has moved from reserved to spent status.
- `currentSpendFuel` the amount of spent fuel ready to be collected and sent to the recipients.
- `collectedSpentFuel` the amount of fuel that has already been sent to recipient addresses. Only at Protocol-level.

No GET is created within this system, so we can define some rules:

- `availableFuel` is equal to the total amount of top-ups, minus the `reservedFuel`.
- `spentFuel` can never be greater than `reservedFuel`, and is equal to `reservedFuel + currentReservedFuel`.
- `spentFuel` is also equal to `currentSpentFuel + collectedSpentFuel`.

Additionally the `averageReservedPerTicket` provides the average amount of GET that has been required per-ticket. This reserved amount remains in the system until the ticket is either checked-in or invalidated but gives an accurate measure of the token-revenue per NFT-ticket minted. For example, `ProtocolDay.averageReservedPerTicket` will show the average GET/ticket across all integrators aggregated by day.

### Protocol Fuel

The fields listed above track the total fuel consumption for each ticket, regardless of it's destination after being spent. To allow us to more accurately track 'protocol revenue' vs. 'complete product revenue', new fields for `reservedFuelProtocol` and `spentFuelProtocol` have been added. Protocol fuel is considered to be the base-cost of the protocol and the minimum charge to mint a ticket NFT without including any of the additional event & ticket management software tooling. Protocol fuel will always be a subset of the total fuel consumption.

## Examples

### All-Time Interaction Counts

```graphql
{
  protocol(id: "1") {
    soldCount
    resoldCount
    scannedCount
    checkedInCount
    invalidatedCount
    claimedCount
  }
}
```

### Last 7 days GET Usage

```graphql
{
  protocolDays(orderBy: day, orderDirection: desc, first: 7) {
    day
    reservedFuel
    reservedFuelProtocol
    spentFuel
    averageReservedPerTicket
  }
}
```

### Last 30 days of GET Usage for a Single Integrator

```graphql
{
  integratorDays(orderBy: day, orderDirection: desc, first: 30, where: { integrator: "0" }) {
    integrator {
      id
    }
    day
    reservedFuel
    spentFuel
    averageReservedPerTicket
  }
}
```

### All Events

```graphql
{
  events {
    id
    name
  }
}
```

### 100 Most Recent Protocol Usage Events

```graphql
{
  usageEvents(orderBy: blockTimestamp, orderDirection: desc, first: 100) {
    type
    nftId
    event {
      id
    }
    getUsed
  }
}
```

### 5 Most Recent Integrator Top-Ups

```graphql
{
  topUpEvents(orderBy: blockTimestamp, orderDirection: desc, first: 5) {
    integratorIndex
    total
    totalUsd
    price
  }
}
```

### Ticket Explorer Lifecycle Data

```graphql
{
  ticket(id: "POLYGON-0-209050") {
    id
    basePrice
    event {
      id
      currency
      shopUrl
      startTime
      integrator {
        name
      }
    }
    usageEvents(orderBy: orderTime, orderDirection: asc) {
      orderTime
      txHash
      type
    }
  }
}
```

### Latest Price Oracle Data

```graphql
{
  priceOracle(id: "1") {
    price
    lastUpdateTimestamp
  }
}
```

## Entity Relationship Diagram

![GET Protocol Subgraph Entity Relationship Diagram](/docs/erd.jpg)

## Setup

To run the setup described below you need to have Docker installed to run the subgraph, ipfs, and postgres containers.

Start by setting up a [graphprotocol/graph-node](https://github.com/graphprotocol/graph-node). For this you will also need a [Polygon RPC endpoint](https://docs.matic.network/docs/develop/network-details/network/) for the graph-node to index from. [Infura](https://infura.io/) or [Moralis (Speedy Nodes)](https://moralis.io/) provide enough capacity on their free-tiers. An archive server is recommended.

1. Clone graphprotocol/graph-node to a local directory and use this directory as your working directory during this setup.
2. Edit the `services.graph-node.environment.ethereum` key within docker/docker-compose.yml to read `matic:<RPC_ENDPOINT>`.
3. Run `docker compose up` to launch the graph-node instance.

At this point you should now have a local graph-node available for local development and you can continue to deploy the get-protcol-subgraph to your local cluster.

1. `yarn install` to install dependencies.
2. `yarn prepare:production` to prepare the subgraph configuration files. (More information in the "Deployment" chapter below)
3. `yarn codegen` to generate the neccesary code for deployment.
4. `yarn create:local` to create the local graph namespace.
5. `yarn deploy:local` to deploy the graph to the local instance.

The local GraphiQL explorer can be found at http://localhost:8000/subgraphs/name/get-protocol-subgraph/graphql. Follow the terminal logs from the `docker compose up` command to follow progress on the indexing.

## Deployment

Both playground and production deployments are handled within this repository using [Mustache](https://mustache.github.io/) for generating templates. The Graph CLI does not have a native way of handling this so the environment that you wish to deploy must first be staged as the main deployment:

1. `yarn prepare:playground` will replace the `subgraph.yaml` and `constants/contracts.ts` with the correct values for the playground environment.
2. `yarn deploy:playground` would then deploy this to the playground hosted graph.

Prior to deploying an environment you must always ensure to have prepared the correct subgraph.yaml to prevent deploying to the wrong hosted graph.

## Contributing

Contributions are welcome, please feel free to let us know about any issues or create a PR. By contributing, you agree to release your modifications under the MIT license (see the file LICENSE).

### Conventions

Where possible we stick to some sensible defaults in particular [@typescript-eslint](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin), and [Prettier](https://prettier.io/docs/en/index.html). [Husky](https://github.com/typicode/husky) has been configured to automatically lint and format upon commit.
