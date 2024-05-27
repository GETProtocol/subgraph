import { ethereum } from "@graphprotocol/graph-ts";

export function handlePrimarySale(e: ethereum.Event): void {
  console.log(e.toString());
}

export function handleSecondarySale(e: ethereum.Event): void {
  console.log(e.toString());
}
