# GET Protocol Subgraph

> Aggregating and indexing all on-chain event, ticket, and protocol data.

The GET Protocol subgraph acts as the complete data interface to all on-chain data. Its purpose is to properly aggregate and index all static and time-series data passing through the protocol.

- _Cross-sectional_ data is compiled to its latest update and will always return the latest state.
- _Aggregate_ data aggregated across all time, similar to cross-sectional in that there should be one record per-entity.
- _Time-series_ individual granular events of raw data, either as individual records or within a time-bucket.

There are a number of key entities to be aware of:

#### Events [Cross-sectional]

Indexes all metadata for an _Event_ by its `address` as each Event has it's own independent address on-chain. Updates to an _Event_ will overwrite the data within this entity, so this will always represent the latest state. All actions visible through the associated `usageEvents` field.

#### Protocol [Aggregate]

All-time data for protocol-wide metrics, aggregated. This is used to capture the all-time usage on the protocol across all integrators. Singleton with ID '1'.

#### Relayer [Aggregate]

All-time data for individual relayer, with total usage and counts. ID'd by the `relayerAddress`.

#### ProtocolDay [Time-series]

Similar content to _Protocol_ but aggregrated to each UTC-day. Used to track protocol usage over time. ID is a `dayInteger` from the unix epoch (unix / 86400).

#### RelayerDay [Time-series]

Usage statistics per-relayer-day. Used to track and compare protocol usage by relayer. ID is a composite key of `relayerAddress-dayInteger`.

#### UsageEvent [Time-series]

Not to be confused with a real-world Event, these are 'events' that describe an individual uage of the protocol such as `CREATE_EVENT`, `MINT`, `SCAN`. Comes with lat/long, the relayer, the GET used as fuel, the exact timestamp of the block, and the day as an integer. ID is a composite key of `txHash-logIndex`.

## Tracking the flow of GET

Please see the [DAO Token Economics Documentation](https://docs.get-protocol.io/docs/dao-token-economics-accounting) for full details on how GET balances move through the system.

There are a number of steps that GET takes throughout its lifecycle and the subgraph aggregated this for easier charting and analysis. There are a number of key field that help with this:

Available on Relayer and Protocol entities:

- `getDebitedFromSilos` contains the amount of GET moved from the Silo to the NFT Fuel Tank when minting NFT tickets.
- `getHeldInFuelTanks` contains the total amount of all GET held within the NFT Fuel Tanks, awaiting a move to the depot.
- `getCreditedToDepot` records the GET balance credited to the Depot balance when a ticket is checked-in (finalized).

Available only on the Protocol entities:

- `getMovedToFeeCollector` the amount of GET moving from the depot to the DAO Fee Collector address. The depot is a global balance and not specifc to a single relayer.

Additionally the `averageGetPerMint` provides the average amount of GET that has been required per-ticket (mint) for the selected entity. This means that `ProtocolDay.averageGetPerMint` will show the average GET/ticket across all relayers aggregated by day.

## Examples

### All-Time Interaction Counts

```graphql
{
  protocol(id: "1") {
    mintCount
    invalidateCount
    scanCount
    checkInCount
    claimCount
  }
}
```

### Last 7 days GET Usage

```graphql
{
  protocolDays(orderBy: day, orderDirection: desc, first: 7) {
    day
    getDebitedFromSilos
    getCreditedToDepot
    averageGetPerMint
  }
}
```

### Last 30 days of GET Usage for a Single Relayer

```graphql
{
  relayerDays(orderBy: day, orderDirection: desc, first: 30, where: { relayer: "0x4afdae9cca053e3d456a9cb697081bf083a3340b" }) {
    relayer {
      id
    }
    day
    getDebitedFromSilo
    getCreditedToDepot
    averageGetPerMint
  }
}
```

### All Events

```graphql
{
  events {
    id
    eventName
  }
}
```

### 100 Most Recent Protocol Usage Events

```graphql
{
  usageEvents(orderBy: blockTimestamp, orderDirection: desc, first: 100) {
    type
    nftIndex
    event {
      id
    }
    getDebitedFromSilo
  }
}
```

## Entity Relationship Diagram

![GET Protocol Subgraph Entity Relationship Diagram](/docs/erd.png)

## Setup

Start by setting up a [graphprotocol/graph-node](https://github.com/graphprotocol/graph-node). For this you will also need a [Polygon RPC endpoint](https://docs.matic.network/docs/develop/network-details/network/) for the graph-node to index from. [Infura](https://infura.io/) or [Moralis (Speedy Nodes)](https://moralis.io/) provide enough capacity on their free-tiers. An archive server is recommended.

1. Clone graphprotocol/graph-node to a local directory.
2. Edit the `services.graph-node.environment.ethereum` key within docker/docker-compose.yml to read `matic:<RPC_ENDPOINT>`.
3. Run `docker compose up` to launch the graph-node instance.

At this point you should now have a local graph-node available for local development and you can continue to deploy the get-protcol-subgraph to your local cluster.

1. `yarn create-local` to create the local graph namespace.
2. `yarn deploy-local` to deploy the graph to the local instance.

The local GraphiQL explorer can be found at http://localhost:8000/subgraphs/name/get-protocol-subgraph/graphql. Follow the terminal logs from the `docker compose up` command to follow progress on the indexing.

## Contributing

Contributions are welcome, please feel free to let us know about any issues or create a PR. By contributing, you agree to release your modifications under the MIT license (see the file LICENSE).

### Conventions

Where possible we stick to some sensible defaults in particular [@typescript-eslint](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin), and [Prettier](https://prettier.io/docs/en/index.html). [Husky](https://github.com/typicode/husky) has been configured to automatically lint and format upon commit.
