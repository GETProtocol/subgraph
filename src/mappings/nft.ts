import { log, BigInt } from "@graphprotocol/graph-ts";
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
import { Event } from "../../generated/schema";
import {
  getProtocol,
  getRelayer,
  getProtocolDayByEvent,
  getRelayerDayByEvent,
  getEvent,
  getUsageEvent,
} from "../entities";

/**
 * NFT CONTRACT V1 --------------------------------------------------------------------
 */

// export function handleConfigurationChangedEcon(event: ConfigurationChangedEcon): void {}
// export function handleNFTCheckedIn(event: NFTCheckedIn): void { }

function getEventFromNftIndex(nftIndex: BigInt): Event {
  let nftContract = NFTContract.bind(NFT_ADDRESS);

  let nftData = nftContract.returnStructTicket(nftIndex);

  let event = getEvent(nftData.event_address.toHex());

  return event;
}

export function handlenftClaimed(e: nftClaimed): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDayByEvent(e);
  let relayerDay = getRelayerDayByEvent(e);
  let relayer = getRelayer(e.transaction.from.toHex());
  let usageEvent = getUsageEvent(e, e.params.nftIndex);
  let event = getEventFromNftIndex(e.params.nftIndex);

  protocol.getUsed = protocol.getUsed.plus(e.params.getUsed);
  protocol.claimCount = protocol.claimCount.plus(BIG_INT_ONE);

  protocolDay.getUsed = protocolDay.getUsed.plus(e.params.getUsed);
  protocolDay.claimCount = protocolDay.claimCount.plus(BIG_INT_ONE);

  relayerDay.getUsed = relayerDay.getUsed.plus(e.params.getUsed);
  relayerDay.claimCount = relayerDay.claimCount.plus(BIG_INT_ONE);

  relayer.getUsed = relayer.getUsed.plus(e.params.getUsed);
  relayer.claimCount = relayer.claimCount.plus(BIG_INT_ONE);

  usageEvent.getUsed = usageEvent.getUsed.plus(e.params.getUsed);
  usageEvent.interaction = "CLAIM";

  event.getUsed = event.getUsed.plus(e.params.getUsed);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
  relayer.save();
  usageEvent.save();
  event.save();
}
// export function handlenftTokenURIEdited(event: nftTokenURIEdited): void { }

// NOTE this takes the place of "handleNftMinted", since it doesnt exist on V2 contracts
export function handlePrimarySaleMint(e: primarySaleMint): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDayByEvent(e);
  let relayerDay = getRelayerDayByEvent(e);
  let relayer = getRelayer(e.transaction.from.toHex());
  let usageEvent = getUsageEvent(e, e.params.nftIndex);
  let event = getEvent(e.params.eventAddress.toHex());
  let nftIndex = e.params.nftIndex;

  let nftContract = NFTContract.bind(NFT_ADDRESS);
  let nftData = nftContract.returnStructTicket(nftIndex);

  // prices_sold[0] is apparently not a supported operation, instead .shift() to get the first item
  let basePrice = nftData.prices_sold.shift();
  basePrice = basePrice.div(BIG_INT_TEN);

  log.info("BasePrice: {}", [basePrice.toString()]);

  // basePrice is denominated to the tenth of a cent, divide by 10 to get to the cent.
  protocol.mintCount = protocol.mintCount.plus(BIG_INT_ONE);
  protocol.getUsed = protocol.getUsed.plus(e.params.getUsed);

  protocolDay.mintCount = protocolDay.mintCount.plus(BIG_INT_ONE);
  protocol.getUsed = protocol.getUsed.plus(e.params.getUsed);

  relayerDay.mintCount = relayerDay.mintCount.plus(BIG_INT_ONE);
  relayerDay.getUsed = relayerDay.getUsed.plus(e.params.getUsed);

  relayer.mintCount = relayer.mintCount.plus(BIG_INT_ONE);
  relayer.getUsed = relayer.getUsed.plus(e.params.getUsed);

  usageEvent.interaction = "MINT";
  usageEvent.getUsed = usageEvent.getUsed.plus(BIG_INT_ONE);

  event.mintCount = event.mintCount.plus(BIG_INT_ONE);
  event.getUsed = event.getUsed.plus(e.params.getUsed);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
  relayer.save();
  usageEvent.save();
  event.save();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
// export function handlesaleCollaterizedIntentory(event: saleCollaterizedIntentory): void {}

// export function handlesecondarySale(event: secondarySale): void { }
/*
 */
export function handleticketInvalidated(e: ticketInvalidated): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDayByEvent(e);
  let relayerDay = getRelayerDayByEvent(e);
  let relayer = getRelayer(e.transaction.from.toHex());
  let usageEvent = getUsageEvent(e, e.params.nftIndex);
  let event = getEventFromNftIndex(e.params.nftIndex);

  protocol.getUsed = protocol.getUsed.plus(e.params.getUsed);

  protocolDay.getUsed = protocolDay.getUsed.plus(e.params.getUsed);

  relayerDay.getUsed = relayerDay.getUsed.plus(e.params.getUsed);

  relayer.getUsed = relayer.getUsed.plus(e.params.getUsed);

  usageEvent.getUsed = usageEvent.getUsed.plus(e.params.getUsed);
  usageEvent.interaction = "INVALIDATE";

  event.getUsed = event.getUsed.plus(e.params.getUsed);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
  relayer.save();
  usageEvent.save();
  event.save();
}

export function handleticketScanned(e: ticketScanned): void {
  let protocol = getProtocol();
  let protocolDay = getProtocolDayByEvent(e);
  let relayerDay = getRelayerDayByEvent(e);
  let relayer = getRelayer(e.transaction.from.toHex());
  let usageEvent = getUsageEvent(e, e.params.nftIndex);
  let event = getEventFromNftIndex(e.params.nftIndex);

  protocol.getUsed = protocol.getUsed.plus(e.params.getUsed);
  protocol.scanCount = protocol.scanCount.plus(BIG_INT_ONE);

  protocolDay.getUsed = protocolDay.getUsed.plus(e.params.getUsed);
  protocolDay.scanCount = protocolDay.scanCount.plus(BIG_INT_ONE);

  relayer.getUsed = relayer.getUsed.plus(e.params.getUsed);
  relayer.scanCount = relayer.scanCount.plus(BIG_INT_ONE);

  relayerDay.getUsed = relayerDay.getUsed.plus(e.params.getUsed);
  relayerDay.scanCount = relayerDay.scanCount.plus(BIG_INT_ONE);

  usageEvent.getUsed = usageEvent.getUsed.plus(e.params.getUsed);
  usageEvent.interaction = "SCAN";

  event.getUsed = event.getUsed.plus(e.params.getUsed);

  protocol.save();
  protocolDay.save();
  relayerDay.save();
  relayer.save();
  usageEvent.save();
  event.save();
}
