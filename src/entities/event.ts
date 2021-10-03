import { BigInt } from "@graphprotocol/graph-ts";
import { Event } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO, NFT_ADDRESS } from "../constants";
import { NFTV1 as NFTContract } from "../../generated/NFTV1/NFTV1";

export function getEvent(eventAddress: string): Event {
  let event = Event.load(eventAddress);

  if (event == null) {
    event = new Event(eventAddress);
    event.relayer = "";
    event.getUsed = BIG_INT_ZERO;
    event.eventName = "";
    event.shopUrl = "";
    event.imageUrl = "";
    event.orderTime = BIG_INT_ZERO;
    event.latitude = BIG_DECIMAL_ZERO;
    event.longitude = BIG_DECIMAL_ZERO;
  }

  return event as Event;
}

export function getEventByNftIndexV1(nftIndex: BigInt): Event {
  let nftContract = NFTContract.bind(NFT_ADDRESS);
  let nftData = nftContract.try_returnStructTicket(nftIndex);

  if (!nftData.reverted) {
    return getEvent(nftData.value.event_address.toHexString());
  }

  return null;
}
