import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  TokenDotFactory,
  DotTokenCreated,
  OwnershipTransferred
} from "../generated/TokenDotFactory/TokenDotFactory"
import { Provider, Endpoint, Factory } from "../generated/schema"

// Contract addresses
let TDFADDRESS = Address.fromString("0x2416002d127175bc2d627faefdaa4186c7c49833")

// create a new factory entity and save it.
export function handleDotTokenCreated(event: DotTokenCreated): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}
