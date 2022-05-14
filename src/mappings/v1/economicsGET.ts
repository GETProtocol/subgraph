import { configChanged } from "../../../generated/EconomicsGETV1/EconomicsGETV1";
import { RELAYER_MAPPING } from "../../constants";
import { getRelayer } from "../../entities";

export function handleConfigChanged(e: configChanged): void {
  let relayerAddress = e.params.relayerAddress;

  let integratorIndex = RELAYER_MAPPING.get(relayerAddress.toHexString());
  let relayer = getRelayer(relayerAddress);
  relayer.integrator = integratorIndex.toString();

  relayer.save();
}
