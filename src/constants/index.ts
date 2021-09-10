import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export let NULL_CALL_RESULT_VALUE = "0x0000000000000000000000000000000000000000000000000000000000000001";

export let ADDRESS_ZERO = Address.fromString("0x0000000000000000000000000000000000000000");

export let BIG_DECIMAL_1E6 = BigDecimal.fromString("1e6");

export let BIG_DECIMAL_1E12 = BigDecimal.fromString("1e12");

export let BIG_DECIMAL_1E18 = BigDecimal.fromString("1e18");

export let BIG_DECIMAL_ZERO = BigDecimal.fromString("0");

export let BIG_DECIMAL_ONE = BigDecimal.fromString("1");

export let BIG_INT_ONE = BigInt.fromI32(1);

export let BIG_INT_TWO = BigInt.fromI32(2);

export let BIG_INT_TEN = BigInt.fromI32(10);

export let BIG_INT_ONE_HUNDRED = BigInt.fromI32(100);

export let BIG_INT_ONE_DAY_SECONDS = BigInt.fromI32(86400);

export let BIG_INT_ZERO = BigInt.fromI32(0);
