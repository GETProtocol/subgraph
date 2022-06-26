import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

export let ADDRESS_ZERO = Address.zero();

export let BIG_DECIMAL_ZERO = BigDecimal.fromString("0");
export let BIG_DECIML_ONE = BigDecimal.fromString("1");
export let BIG_DECIMAL_1E3 = BigDecimal.fromString("1e3");
export let BIG_DECIMAL_1E6 = BigDecimal.fromString("1e6");
export let BIG_DECIMAL_1E12 = BigDecimal.fromString("1e12");
export let BIG_DECIMAL_1E18 = BigDecimal.fromString("1e18");

export let BIG_INT_ZERO = BigInt.fromI32(0);
export let BIG_INT_ONE = BigInt.fromI32(1);

export let BYTES_EMPTY = Bytes.empty();
