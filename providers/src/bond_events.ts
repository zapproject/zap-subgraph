import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Bondage,
  Bound,
  Unbound,
  Escrowed,
  Released,
  Returned,
  OwnershipTransferred
} from "../generated/Bondage/Bondage"
import { Provider, Endpoint} from "../generated/schema"

// Contract Addresses
let BONDADDRESS = Address.fromString("0x188f79b0a8edc10ad53285c47c3feaa0d2716e83")

// Updates an endpoint's dots issued and # of zap bounded
export function handleBound(event: Bound): void {
  // load the endpoint if it exists
  let endpoint = Endpoint.load(event.params.endpoint.toHex())
  if (endpoint == null) return
  let bondage = Bondage.bind(BONDADDRESS)  // connection to the Bondage contract

  // get the number of dots issued to the endpoint
  endpoint.dotsIssued = bondage.getDotsIssued(Address.fromString(event.params.oracle.toHex()), event.params.endpoint)
  
  // try to get the number of zap tokens used to bound to this endpoint
  let zapBoundResult = bondage.try_getZapBound(Address.fromString(event.params.oracle.toHex()), event.params.endpoint)
  if (zapBoundResult.reverted) {
    // Do nothing
  } else {
    endpoint.zapBound = zapBoundResult.value
  }

  endpoint.save()  // save the endpoint
}

// Updates an endpoint's dots issued and # of zap bounded
export function handleUnbound(event: Unbound): void {
  // load the endpoint if it exists
  let endpoint = Endpoint.load(event.params.endpoint.toHex())
  if (endpoint == null) return
  let bondage = Bondage.bind(BONDADDRESS)

  // get the number of dots issued to the endpoint
  endpoint.dotsIssued = bondage.getDotsIssued(Address.fromString(event.params.oracle.toHex()), event.params.endpoint)

  // try to get the number of zap tokens used to bound to this endpoint
  let zapBoundResult = bondage.try_getZapBound(Address.fromString(event.params.oracle.toHex()), event.params.endpoint)
  if (zapBoundResult.reverted) {
    // Do nothing
  } else {
    endpoint.zapBound = zapBoundResult.value
  }

  endpoint.save()
}

export function handleEscrowed(event: Escrowed): void {}

export function handleReleased(event: Released): void {
  // let endpoint = Endpoint.load(event.params.endpoint.toHex())
  // if (endpoint == null) return
  // let bondage = Bondage.bind(BONDADDRESS)

  // endpoint.dotsIssued = bondage.getDotsIssued(Address.fromString(event.params.oracle.toString()), event.params.endpoint)

  // endpoint.save()
}

export function handleReturned(event: Returned): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}
