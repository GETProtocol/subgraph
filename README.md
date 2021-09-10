# GET Protocol Subgraph

> Aggregating and indexing all on-chain event, ticket, and protocol data.

## Intro

The GET Protocol subgraph acts as the complete data interface to all on-chain data. Its purpose is to properly aggregate and index all static and time-series data passing through the protocol. There are a number of key entities to be aware of:

### Events [static]

Indexes all metadata for an _Event_ by its `address`. Each Event has it's own independent address on-chain. Updates to an _Event_ will overwrite the data within this entity, so this will always represent the latest state. Contains a reference to _Tickets_ for fetching all of the tickets for an _Event_ using its one-to-many relationship.

### Tickets [static]

Indexes all _Ticket_ metadata through to the latest update. Contains a reference to _Event_ using the `eventAddress` as a belongs-to relationship. The current state/status of the _Ticket_ will be given in the state field (e.g. UNSCANNED, SCANNED, CLAIMABLE, INVALIDATED).

### Protocol [static]

All-time data for protocol-wide metrics, aggregated. This is used to capture the all-time usage on the protocol across all integrators. Singleton with ID '0001'.

### ProtocolDay [time-series]

Similar content to _Protocol_ but aggregrated to each UTC-day. Used to track protocol usage over time. ID is a `dayInteger` from the unix epoch (unix / 86400).

### RelayerDay [time-series]

Usage statistics per-relayer-day. Used to track and compare protocol usage by relayer. ID is a composite key of `relayerAddress-dayInteger`.

## Setup

Start by setting up a [graphprotocol/graph-node](https://github.com/graphprotocol/graph-node). For this you will also need a [Polygon RPC endpoint](https://docs.matic.network/docs/develop/network-details/network/) for the graph-node to index from. [Infura](https://infura.io/) or [Moralis (Speedy Nodes)](https://moralis.io/) provide enough capacity on their free-tiers.

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

Where possible we stick to some sensible defaults in particular [@typescript-eslint](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) (recommended and recommended-requiring-type-checking), and [Prettier](https://prettier.io/docs/en/index.html). [Husky](https://github.com/typicode/husky) has been configured to automatically lint and format upon commit.
