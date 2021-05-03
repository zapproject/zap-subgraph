import { BigInt, Address, log } from "@graphprotocol/graph-ts"
import {
  Registry,
  NewProvider,
  NewCurve,
  OwnershipTransferred
} from "../generated/Registry/Registry"
import { Bondage } from "../generated/Bondage/Bondage"
import { TokenDotFactory } from "../generated/TokenDotFactory/TokenDotFactory"
import { ERC20 } from "../generated/ERC20/ERC20"
import { Provider, Curve, Endpoint } from "../generated/schema"
// import { Registry } from "../generated/Registry/Registry"
let REGADDRESS = Address.fromString("0xc7ab7ffc4fc2f3c75ffb621f574d4b9c861330f0")
let BONDADDRESS = Address.fromString("0x188f79b0a8edc10ad53285c47c3feaa0d2716e83")
let TDFADDRESS = Address.fromString("0x2416002d127175bc2d627faefdaa4186c7c49833")

export function handleNewProvider(event: NewProvider): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let provider = new Provider(event.params.provider.toHex())
  let registry = Registry.bind(REGADDRESS)
  let bondage = Bondage.bind(BONDADDRESS)

  provider.pubkey = registry.getProviderPublicKey(event.params.provider)
  provider.title = event.params.title
  let endpoints = registry.getProviderEndpoints(event.params.provider)
  provider.endpoints = endpoints
  provider.endpoint_params = registry.getAllProviderParams(event.params.provider)

  for (let index = 0; index < endpoints.length; index++) {
    let endpt = endpoints[index];
    let endpoint = new Endpoint(endpt.toHex())
    endpoint.oracleTitle = provider.title.toString()
    endpoint.provider = event.params.provider.toString()
    endpoint.providerParams = registry.getAllProviderParams(event.params.provider)
    endpoint.broker = registry.getEndpointBroker(event.params.provider, endpt).toString()
    // let getCurveResult = registry.try_getProviderCurve(event.params.provider, endpt)
    // if (getCurveResult.reverted) {
    //   continue
    // } else {
    //   endpoint.curve = getCurveResult.value
    // }
    endpoint.endpointStr = endpt.toString()
    endpoint.dotsIssued = bondage.getDotsIssued(event.params.provider, endpt)
    // let dotLimitResult = bondage.try_dotLimit(event.params.provider, endpt)
    // if (dotLimitResult.reverted) {
    //   continue
    // } else {
    //   endpoint.dotLimit = dotLimitResult.value
    // }
    endpoint.costPerDot = bondage.calcZapForDots(event.params.provider, endpt, BigInt.fromI32(1))

    // let tokenDotFactory = TokenDotFactory.bind(event.params.provider)
    // let tokenAddResult = tokenDotFactory.try_curves(event.params.provider)
    // if (tokenAddResult.reverted) {
    //   endpoint.tokenAdd = ""
    //   endpoint.isToken = false
    //   endpoint.symbol = ""
    // } else {
    //   endpoint.tokenAdd = tokenAddResult.value.toString()
    //   let token = ERC20.bind(tokenAddResult.value)
    //   endpoint.isToken = true
    //   endpoint.symbol = token.symbol()
    // }
    endpoint.save()
    log.info('Added endpoint {}', [endpoint.oracleTitle])
  }
  provider.save()
  log.info('Added provider {}', [provider.title.toString()])

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.isProviderInitiated(...)
  // - contract.getProviderCurve(...)
  // - contract.initiateProviderCurve(...)
  // - contract.getAllProviderParams(...)
  // - contract.db(...)
  // - contract.getProviderParameter(...)
  // - contract.getProviderPublicKey(...)
  // - contract.getProviderTitle(...)
  // - contract.getCurveUnset(...)
  // - contract.getAllOracles(...)
  // - contract.getPublicKey(...)
  // - contract.getProviderCurveLength(...)
  // - contract.owner(...)
  // - contract.getOracleAddress(...)
  // - contract.getEndpointBroker(...)
  // - contract.getProviderEndpoints(...)
  // - contract.initiateProvider(...)
  // - contract.getEndpointParams(...)
  // - contract.getTitle(...)
}

export function handleNewCurve(event: NewCurve): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}
