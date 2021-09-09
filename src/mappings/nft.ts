import { BigInt, ByteArray } from "@graphprotocol/graph-ts"
import { BIG_INT_ONE } from '../constants/index';
import {
  Contract,
  ConfigurationChanged,
  ConfigurationChangedEcon,
  NFTCheckedIn,
  illegalScan,
  nftClaimed,
  nftTokenURIEdited,
  primarySaleMint,
  saleCollaterizedIntentory,
  secondarySale,
  ticketInvalidated,
  ticketScanned
} from "../../generated/Contract/Contract"
import { getProtocol, getProtocolDay, getRelayerDay } from '../entities';

/**
 * NFT CONTRACT V1 --------------------------------------------------------------------
 */

// export function handleConfigurationChangedEcon(event: ConfigurationChangedEcon): void {}
// export function handleNFTCheckedIn(event: NFTCheckedIn): void { }
export function handleillegalScan(event: illegalScan): void {
  let protocol = getProtocol(event)
  let protocolDay = getProtocolDay(event)
  let relayerDay = getRelayerDay(event)

  
  protocol.fuel_used.plus(event.params.getUsed);
  protocol.illegal_scans += 1;
  
  protocolDay.fuel_used.plus(event.params.getUsed);
  protocolDay.illegal_scans += 1;

  relayerDay.fuel_used.plus(event.params.getUsed);
  relayerDay.illegal_scans += 1;
  
  protocol.save()
  protocolDay.save()
  relayerDay.save()
}

export function handlenftClaimed(event: nftClaimed): void {
  let protocol = getProtocol(event)
  let protocolDay = getProtocolDay(event)
  let relayerDay = getRelayerDay(event)

  protocol.fuel_used.plus(event.params.getUsed);
  protocol.claims.plus(BIG_INT_ONE);
  protocol.changes.plus(BIG_INT_ONE);
  
  protocolDay.fuel_used.plus(event.params.getUsed);
  protocolDay.claims.plus(BIG_INT_ONE);
  protocolDay.changes.plus(BIG_INT_ONE);
  
  relayerDay.fuel_used.plus(event.params.getUsed);
  relayerDay.claims.plus(BIG_INT_ONE);
  relayerDay.changes.plus(BIG_INT_ONE);

  protocol.save()
  protocolDay.save()
  relayerDay.save()
}

// export function handlenftTokenURIEdited(event: nftTokenURIEdited): void { }

// NOTE this takes the place of "handleNftMinted", since it doesnt exist on V2 contracts
export function handleprimarySaleMint(event: primarySaleMint): void {
  let protocol = getProtocol(event)
  let protocolDay = getProtocolDay(event)
  let relayerDay = getRelayerDay(event)

  protocol.ticket_value.plus(event.params.primaryPrice);
  protocol.mints.plus(BIG_INT_ONE);

  protocolDay.ticket_value.plus(event.params.primaryPrice);
  protocolDay.mints.plus(BIG_INT_ONE);
  
  relayerDay.ticket_value.plus(event.params.primaryPrice);
  relayerDay.mints.plus(BIG_INT_ONE)
  
  protocol.save()
  protocolDay.save()
  relayerDay.save()
}

export function handlesaleCollaterizedIntentory(
  event: saleCollaterizedIntentory
): void { }

// export function handlesecondarySale(event: secondarySale): void { }

export function handleticketInvalidated(event: ticketInvalidated): void {
  let protocol = getProtocol(event)
  let protocolDay = getProtocolDay(event)
  let relayerDay = getRelayerDay(event)

  protocol.fuel_used.plus(event.params.getUsed);
  protocol.changes.plus(BIG_INT_ONE);

  protocolDay.fuel_used.plus(event.params.getUsed);
  protocolDay.changes.plus(BIG_INT_ONE);
  
  relayerDay.fuel_used.plus(event.params.getUsed);
  relayerDay.changes.plus(BIG_INT_ONE);

  protocol.save()
  protocolDay.save()
  relayerDay.save()
}

export function handleticketScanned(event: ticketScanned): void {
  let protocol = getProtocol(event)
  let protocolDay = getProtocolDay(event)
  let relayerDay = getRelayerDay(event)

  protocol.fuel_used.plus(event.params.getUsed);
  protocol.scans.plus(BIG_INT_ONE);
  protocol.changes.plus(BIG_INT_ONE);
  
  protocolDay.fuel_used.plus(event.params.getUsed);
  protocolDay.scans.plus(BIG_INT_ONE);
  protocolDay.changes.plus(BIG_INT_ONE);
  
  relayerDay.fuel_used.plus(event.params.getUsed);
  relayerDay.scans.plus(BIG_INT_ONE);
  relayerDay.changes.plus(BIG_INT_ONE);

  protocol.save()
  protocolDay.save()
  relayerDay.save()
}

/**
 * END NFT CONTRACT V1 --------------------------------------------------------------------
 */

