import { Transfer } from "../../../generated/getNFT_ERC721V3V1_1/getNFT_ERC721V3V1_1";
import { BIG_INT_ZERO } from "../../constants";
import { getTicket } from "../../entities";

export function handleTransfer(e: Transfer): void {
  let ticket = getTicket(BIG_INT_ZERO, e.params.tokenId);
  ticket.owner = e.params.to;
  ticket.save();
}
