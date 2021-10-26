# V1 Contracts

## Addresses

- BaseGET: 0x308e44cA2153C61103b0DC67Fd038De650912b73
- EventMetadataStorage: 0xcDA348fF8C175f305Ed8682003ec6F8743067f79

## Period

- Start Block: 15980526
- End Block: 20384301

## Notes

### 1. Primary Price in Local Currency

Through the whole duration of this contract the currencies provided (primaryPrice & basePrice) were both denominated in the local currency as definined on the event. Typically this was in EUR, although AUD, CAD, GBP, and USD was also present. In V2 the on-chain economics was activated and with this change the basePrice was provided separately to the primaryPrice, and always in USD. With this change it means that the basePrice should always be deniminated in USD and never in the local currency.

To get round this and to future-proof the subgraph for a USD denominated basePrice the basePrice has been approximated using an average currency conversion rate for the three month period in which this was live. If required the accurate primaryPrice is still available on-chain although here only the basePrice has been indexed as this will be the standard field for ticket pricing.

### 2. On-chain getUsed Non-Zero

Although the final on-chain economics was not launched until V2, some events were still emitted with a non-zero getUsed. This was in part for testing reasons and to privide data for initial integrations. In reality this getUsed value should not be considered as real GET flowing through the system and should be ignored. For this reason the on-chain metrics fields are not set in any of the V1 mappings and will default to their initial values of 0.
