import { log } from "@graphprotocol/graph-ts";
import { NFT_ADDRESS } from "../constants/addresses";
import { BIG_INT_ONE, BIG_INT_TEN } from "../constants/index";
import {
  NFT as NFTContract,
  // illegalScan,
  nftClaimed,
  primarySaleMint,
  // saleCollaterizedIntentory,
  ticketInvalidated,
  ticketScanned,
} from "../../generated/NFT/NFT";
import { getProtocol, getProtocolDayByEvent, getRelayerDayByEvent, getEvent } from "../entities";

/**
 * NFT CONTRACT V1 --------------------------------------------------------------------
 */

// export function handleConfigurationChangedEcon(event: ConfigurationChangedEcon): void {}
// export function handleNFTCheckedIn(event: NFTCheckedIn): void { }

export function handlenftClaimed(event: nftClaimed): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDayByEvent(event);
  let relayerDay = getRelayerDayByEvent(event);

  protocol.getUsed = protocol.getUsed.plus(event.params.getUsed);
  protocol.claimCount = protocol.claimCount.plus(BIG_INT_ONE);
  protocol.changeCount = protocol.changeCount.plus(BIG_INT_ONE);

  protocolDay.getUsed = protocolDay.getUsed.plus(event.params.getUsed);
  protocolDay.claimCount = protocolDay.claimCount.plus(BIG_INT_ONE);
  protocolDay.changeCount = protocolDay.changeCount.plus(BIG_INT_ONE);

  relayerDay.getUsed = relayerDay.getUsed.plus(event.params.getUsed);
  relayerDay.claimCount = relayerDay.claimCount.plus(BIG_INT_ONE);
  relayerDay.changeCount = relayerDay.changeCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
}
// export function handlenftTokenURIEdited(event: nftTokenURIEdited): void { }

// NOTE this takes the place of "handleNftMinted", since it doesnt exist on V2 contracts
export function handlePrimarySaleMint(e: primarySaleMint): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDayByEvent(e);
  let relayerDay = getRelayerDayByEvent(e);
  let event = getEvent(e.params.eventAddress.toHex())
  let nftIndex = e.params.nftIndex;

  let nftContract = NFTContract.bind(NFT_ADDRESS);
  let nftData = nftContract.returnStructTicket(nftIndex);

  // prices_sold[0] is apparently not a supported operation, instead .shift() to get the first item
  let basePrice = nftData.prices_sold.shift();
  basePrice = basePrice.div(BIG_INT_TEN)

  log.info("BasePrice: {}", [basePrice.toString()]);

  // basePrice is denominated to the tenth of a cent, divide by 10 to get to the cent.
  protocol.ticketValue = protocol.ticketValue.plus(basePrice);
  protocol.mintCount = protocol.mintCount.plus(BIG_INT_ONE);

  protocolDay.ticketValue = protocolDay.ticketValue.plus(basePrice);
  protocolDay.mintCount = protocolDay.mintCount.plus(BIG_INT_ONE);

  relayerDay.ticketValue = relayerDay.ticketValue.plus(basePrice);
  relayerDay.mintCount = relayerDay.mintCount.plus(BIG_INT_ONE);

  event.ticketValue = event.ticketValue.plus(basePrice);
  event.mintCount = event.mintCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
  event.save();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
// export function handlesaleCollaterizedIntentory(event: saleCollaterizedIntentory): void {}

// export function handlesecondarySale(event: secondarySale): void { }
/*
*/
export function handleticketInvalidated(event: ticketInvalidated): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDayByEvent(event);
  let relayerDay = getRelayerDayByEvent(event);

  protocol.getUsed = protocol.getUsed.plus(event.params.getUsed);
  protocol.changeCount = protocol.changeCount.plus(BIG_INT_ONE);

  protocolDay.getUsed = protocolDay.getUsed.plus(event.params.getUsed);
  protocolDay.changeCount = protocolDay.changeCount.plus(BIG_INT_ONE);

  relayerDay.getUsed = relayerDay.getUsed.plus(event.params.getUsed);
  relayerDay.changeCount = relayerDay.changeCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
}

export function handleticketScanned(event: ticketScanned): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDayByEvent(event);
  let relayerDay = getRelayerDayByEvent(event);

  protocol.getUsed = protocol.getUsed.plus(event.params.getUsed);
  protocol.scanCount = protocol.scanCount.plus(BIG_INT_ONE);
  protocol.changeCount = protocol.changeCount.plus(BIG_INT_ONE);

  protocolDay.getUsed = protocolDay.getUsed.plus(event.params.getUsed);
  protocolDay.scanCount = protocolDay.scanCount.plus(BIG_INT_ONE);
  protocolDay.changeCount = protocolDay.changeCount.plus(BIG_INT_ONE);

  relayerDay.getUsed = relayerDay.getUsed.plus(event.params.getUsed);
  relayerDay.scanCount = relayerDay.scanCount.plus(BIG_INT_ONE);
  relayerDay.changeCount = relayerDay.changeCount.plus(BIG_INT_ONE);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
}
