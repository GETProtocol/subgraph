import { Address } from "@graphprotocol/graph-ts";
import { Relayer } from "../../generated/schema";

export function getRelayer(relayerAddress: Address): Relayer {
  let relayer = Relayer.load(relayerAddress.toHexString());

  if (relayer == null) {
    relayer = new Relayer(relayerAddress.toHexString());
    relayer.integrator = "";
    relayer.isEnabled = true;
  }

  return relayer as Relayer;
}
