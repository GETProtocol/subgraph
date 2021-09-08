import { BigInt, ByteArray } from "@graphprotocol/graph-ts"
import {
  Contract,
  ConfigurationChanged,
  ConfigurationChangedEcon,
  NFTCheckedIn,
  illegalScan,
  nftClaimed,
  nftMinted,
  nftTokenURIEdited,
  primarySaleMint,
  saleCollaterizedIntentory,
  secondarySale,
  ticketInvalidated,
  ticketScanned
} from "../generated/Contract/Contract"
import { getProtocolDayData, getRelayerDayData } from './entities';

/**
 * NFT CONTRACT V1 --------------------------------------------------------------------
 */

// export function handleConfigurationChangedEcon(event: ConfigurationChangedEcon): void {}
// export function handleNFTCheckedIn(event: NFTCheckedIn): void { }
export function handleillegalScan(event: illegalScan): void {
  let protocol = getProtocolDayData(event)
  let relayer = getRelayerDayData(event)

  //@ts-ignore
  protocol.fuel_used += event.params.getUsed;
  protocol.illegal_scans += 1;

  //@ts-ignore
  relayer.fuel_used += event.params.getUsed;
  relayer.illegal_scans += 1;
  

  protocol.save()
  relayer.save()
}

export function handlenftClaimed(event: nftClaimed): void {
  let protocol = getProtocolDayData(event)
  let relayer = getRelayerDayData(event)

  //@ts-ignore
  protocol.fuel_used += event.params.getUsed;
  //@ts-ignore
  protocol.claims += BigInt.fromI32(1);
  //@ts-ignore
  protocol.changes += BigInt.fromI32(1);
  
  //@ts-ignore
  relayer.fuel_used += event.params.getUsed;
  //@ts-ignore
  relayer.claims += BigInt.fromI32(1);
  //@ts-ignore
  relayer.changes += BigInt.fromI32(1);

  protocol.save()
  relayer.save()
}

// export function handlenftTokenURIEdited(event: nftTokenURIEdited): void { }

// NOTE this takes the place of "handleNftMinted", since it doesnt exist on V2 contracts
export function handleprimarySaleMint(event: primarySaleMint): void {
  let protocol = getProtocolDayData(event)
  let relayer = getRelayerDayData(event)

  //@ts-ignore
  protocol.ticket_value += event.params.primaryPrice;
  //@ts-ignore
  protocol.mints += BigInt.fromI32(1);
  
  //@ts-ignore
  relayer.ticket_value += event.params.primaryPrice;
  //@ts-ignore
  relayer.mints += BigInt.fromI32(1);
  
  protocol.save()
  relayer.save()
}

export function handlesaleCollaterizedIntentory(
  event: saleCollaterizedIntentory
): void { }

// export function handlesecondarySale(event: secondarySale): void { }

export function handleticketInvalidated(event: ticketInvalidated): void {
  let protocol = getProtocolDayData(event)
  let relayer = getRelayerDayData(event)

  //@ts-ignore
  protocol.fuel_used += event.params.getUsed;
  //@ts-ignore
  protocol.changes += BigInt.fromI32(1);
  
  //@ts-ignore
  relayer.fuel_used += event.params.getUsed;
  //@ts-ignore
  relayer.changes += BigInt.fromI32(1);

  protocol.save()
  relayer.save()
}

export function handleticketScanned(event: ticketScanned): void {
  let protocol = getRelayerDayData(event)
  let relayer = getRelayerDayData(event)

  //@ts-ignore
  protocol.fuel_used += event.params.getUsed;
  //@ts-ignore
  protocol.scans += BigInt.fromI32(1);
  //@ts-ignore
  protocol.changes += BigInt.fromI32(1);
  
  //@ts-ignore
  relayer.fuel_used += event.params.getUsed;
  //@ts-ignore
  relayer.scans += BigInt.fromI32(1);
  //@ts-ignore
  relayer.changes += BigInt.fromI32(1);

  protocol.save()
  relayer.save()
}

/**
 * END NFT CONTRACT V1 --------------------------------------------------------------------
 */

