import { BigInt } from "@graphprotocol/graph-ts";
import { ECONOMICS_V2_2_BLOCK } from "../../constants";
import { BIG_INT_ZERO } from "../../constants/fixed";

export function isV2_2(block: BigInt): boolean {
  return ECONOMICS_V2_2_BLOCK.notEqual(BIG_INT_ZERO) && block.gt(ECONOMICS_V2_2_BLOCK);
}
