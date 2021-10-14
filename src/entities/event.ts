import { BigInt } from "@graphprotocol/graph-ts";
import { Event } from "../../generated/schema";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO, NFT_ADDRESS_V1, NFT_ADDRESS_V2, ADDRESS_ZERO } from "../constants";
import { BaseGETV1 as BaseGETContractV1 } from "../../generated/BaseGETV1/BaseGETV1";
import { BaseGETV2 as BaseGETContractV2 } from "../../generated/BaseGETV2/BaseGETV2";

export function getEvent(eventAddress: string): Event {
  let event = Event.load(eventAddress);

  if (event == null) {
    event = new Event(eventAddress);
    event.getDebitedFromSilo = BIG_INT_ZERO;
    event.getCreditedToDepot = BIG_INT_ZERO;
    event.averageGetPerMint = BIG_DECIMAL_ZERO;
    event.mintCount = BIG_INT_ZERO;
    event.scanCount = BIG_INT_ZERO;
    event.invalidateCount = BIG_INT_ZERO;
    event.checkInCount = BIG_INT_ZERO;
    event.claimCount = BIG_INT_ZERO;
    event.relayer = "";
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
  let baseGETContract = BaseGETContractV1.bind(NFT_ADDRESS_V1);
  let nftData = baseGETContract.try_returnStructTicket(nftIndex);

  if (!nftData.reverted) {
    return getEvent(nftData.value.event_address.toHexString());
  }

  return getEvent(ADDRESS_ZERO.toHexString());
}

export function getEventByNftIndexV2(nftIndex: BigInt): Event {
  let baseGETContract = BaseGETContractV2.bind(NFT_ADDRESS_V2);
  let nftData = baseGETContract.try_returnStructTicket(nftIndex);

  if (!nftData.reverted) {
    return getEvent(nftData.value.eventAddress.toHexString());
  }

  return getEvent(ADDRESS_ZERO.toHexString());
}
