import { log } from "@graphprotocol/graph-ts";
import { NFT_ADDRESS } from "../constants/addresses";
import { BIG_INT_ONE } from "../constants/index";
import {
  NFT as NFTContract,
  // illegalScan,
  // nftClaimed,
  primarySaleMint,
  // saleCollaterizedIntentory,
  // ticketInvalidated,
  // ticketScanned,
} from "../../generated/NFT/NFT";
import { getProtocol, getProtocolDayByEvent, getRelayerDayByEvent } from "../entities";

/**
 * NFT CONTRACT V1 --------------------------------------------------------------------
 */

// export function handleConfigurationChangedEcon(event: ConfigurationChangedEcon): void {}
// export function handleNFTCheckedIn(event: NFTCheckedIn): void { }
/*
export function handleillegalScan(event: illegalScan): void {
  const protocol = getProtocol();
  const protocolDay = getProtocolDay(event);
  const relayerDay = getRelayerDay(event);

  protocol.fuel_used.plus(event.params.getUsed);
  protocol.illegal_scans.plus(BIG_INT_ONE);

  protocolDay.fuel_used.plus(event.params.getUsed);
  protocolDay.illegal_scans.plus(BIG_INT_ONE);

  relayerDay.fuel_used.plus(event.params.getUsed);
  relayerDay.illegal_scans.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
}

export function handlenftClaimed(event: nftClaimed): void {
  const protocol = getProtocol();
  const protocolDay = getProtocolDay(event);
  const relayerDay = getRelayerDay(event);

  protocol.fuel_used.plus(event.params.getUsed);
  protocol.claims.plus(BIG_INT_ONE);
  protocol.changes.plus(BIG_INT_ONE);

  protocolDay.fuel_used.plus(event.params.getUsed);
  protocolDay.claims.plus(BIG_INT_ONE);
  protocolDay.changes.plus(BIG_INT_ONE);

  relayerDay.fuel_used.plus(event.params.getUsed);
  relayerDay.claims.plus(BIG_INT_ONE);
  relayerDay.changes.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
}
*/
// export function handlenftTokenURIEdited(event: nftTokenURIEdited): void { }

// NOTE this takes the place of "handleNftMinted", since it doesnt exist on V2 contracts
export function handlePrimarySaleMint(event: primarySaleMint): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDayByEvent(event);
  let relayerDay = getRelayerDayByEvent(event);
  let nftIndex = event.params.nftIndex;

  let nftContract = NFTContract.bind(NFT_ADDRESS);
  let nftData = nftContract.returnStructTicket(nftIndex);

  // prices_sold[0] is apparently not a supported operation, instead .shift() to get the first item
  let basePrice = nftData.prices_sold.shift();

  log.warning("BasePrice: {}", [basePrice.toString()]);

  protocol.ticketValue.plus(basePrice);
  protocol.mintCount.plus(BIG_INT_ONE);

  protocolDay.ticketValue.plus(basePrice);
  protocolDay.mintCount.plus(BIG_INT_ONE);

  relayerDay.ticketValue.plus(basePrice);
  relayerDay.mintCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
// export function handlesaleCollaterizedIntentory(event: saleCollaterizedIntentory): void {}

// export function handlesecondarySale(event: secondarySale): void { }
/*
export function handleticketInvalidated(event: ticketInvalidated): void {
  const protocol = getProtocol();
  const protocolDay = getProtocolDay(event);
  const relayerDay = getRelayerDay(event);

  protocol.fuel_used.plus(event.params.getUsed);
  protocol.changes.plus(BIG_INT_ONE);

  protocolDay.fuel_used.plus(event.params.getUsed);
  protocolDay.changes.plus(BIG_INT_ONE);

  relayerDay.fuel_used.plus(event.params.getUsed);
  relayerDay.changes.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
}

export function handleticketScanned(event: ticketScanned): void {
  const protocol = getProtocol();
  const protocolDay = getProtocolDay(event);
  const relayerDay = getRelayerDay(event);

  protocol.fuel_used.plus(event.params.getUsed);
  protocol.scans.plus(BIG_INT_ONE);
  protocol.changes.plus(BIG_INT_ONE);

  protocolDay.fuel_used.plus(event.params.getUsed);
  protocolDay.scans.plus(BIG_INT_ONE);
  protocolDay.changes.plus(BIG_INT_ONE);

  relayerDay.fuel_used.plus(event.params.getUsed);
  relayerDay.scans.plus(BIG_INT_ONE);
  relayerDay.changes.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
}
*/
/**
 * END NFT CONTRACT V1 --------------------------------------------------------------------
 */
