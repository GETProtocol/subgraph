import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export let EVENT_METADATA_STORAGE_ADDRESS_V1 = Address.fromString("0xcDA348fF8C175f305Ed8682003ec6F8743067f79");
export let EVENT_METADATA_STORAGE_ADDRESS_V2 = Address.fromString("0x08C2aF3F01A36AD9F274ccE77f6f77cf9aa1dfC9");
export let NFT_ADDRESS_V1 = Address.fromString("0x308e44cA2153C61103b0DC67Fd038De650912b73");
export let NFT_ADDRESS_V2 = Address.fromString("0xbce1b23c7544422f1E2208d29A6A3AA9fAbAB250");
export let ADDRESS_ZERO = Address.fromString("0x0000000000000000000000000000000000000000");

// endBlock is not yet natively supported in subgraph.yaml meaning that we manually need to skip
// events for old ABI versions after the point they are switched. If the event name changes then
// this would not be required, but we apply this across all hanlders for safety and consistency.
// See: https://github.com/graphprotocol/support/issues/49
export let V1_END_BLOCK = BigInt.fromI32(20384301);
// txHash: 0x47bdbebd125bd5c1ec8ce0d6a719da55543875f7c2cd7c1a49da19bbf04208ec
export let FUEL_ACTIVATED_BLOCK = BigInt.fromI32(20386345);

export let BIG_DECIMAL_ZERO = BigDecimal.fromString("0");
export let BIG_DECIMAL_ONE = BigDecimal.fromString("1");
export let BIG_DECIMAL_1E6 = BigDecimal.fromString("1e6");
export let BIG_DECIMAL_1E12 = BigDecimal.fromString("1e12");
export let BIG_DECIMAL_1E18 = BigDecimal.fromString("1e18");

export let BIG_INT_MINUS_ONE = BigInt.fromI32(-1);
export let BIG_INT_ZERO = BigInt.fromI32(0);
export let BIG_INT_ONE = BigInt.fromI32(1);
export let BIG_INT_TWO = BigInt.fromI32(2);
export let BIG_INT_TEN = BigInt.fromI32(10);
export let BIG_INT_ONE_HUNDRED = BigInt.fromI32(100);
export let BIG_INT_ONE_DAY_SECONDS = BigInt.fromI32(86400);
