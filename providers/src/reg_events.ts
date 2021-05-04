import { BigInt, Address, log, ethereum } from "@graphprotocol/graph-ts"
import {
  Registry,
  NewProvider,
  NewCurve,
  OwnershipTransferred,
  SetEndpointParamsCall,
  SetProviderParameterCall
} from "../generated/Registry/Registry"
// import { TokenDotFactory } from "../generated/TokenDotFactory/TokenDotFactory"
import { ERC20 } from "../generated/ERC20/ERC20"
import { Bondage } from "../generated/Bondage/Bondage"
import { TokenDotFactory } from "../generated/TokenDotFactory/TokenDotFactory"
import { Provider, Endpoint, Provider_Param } from "../generated/schema"

// Contract Addresses
let REGADDRESS = Address.fromString("0xc7ab7ffc4fc2f3c75ffb621f574d4b9c861330f0")
let BONDADDRESS = Address.fromString("0x188f79b0a8edc10ad53285c47c3feaa0d2716e83")
// let TDFADDRESS = Address.fromString("0x2416002d127175bc2d627faefdaa4186c7c49833")

// Handles a new provider that can either be an Oracle or a Token
export function handleNewProvider(event: NewProvider): void {
  let provider = new Provider(event.params.provider.toHex())
  let registry = Registry.bind(REGADDRESS)  // Connection to the registry contract

  provider.pubkey = registry.getProviderPublicKey(event.params.provider)
  provider.title = event.params.title

  provider.save()
  log.info('Added provider {}', [provider.title.toString()])
}

// This event initializes a curve and the endpoint it belongs to
// Each endpoint in turn belongs to a provider.
// This handler thus creates a new endpoint and attaches it to a provider.
export function handleNewCurve(event: NewCurve): void {
  let bondage = Bondage.bind(BONDADDRESS)  // Connection to the bondage contract
  // Load the provider that the endpoint belongs to
  let provider = Provider.load(event.params.provider.toHex())
  if (provider == null) return
  // Load the provider's token factory if it exists
  // let factory = Factory.load(provider.id)
  let endpoint = new Endpoint(event.params.endpoint.toHex())

  endpoint.provider = provider.id
  endpoint.broker = event.params.broker.toHex()
  endpoint.endpointStr = event.params.endpoint.toString()
  endpoint.curve = event.params.curve
  endpoint.oracleTitle = endpoint.endpointStr
  endpoint.dotsIssued = bondage.getDotsIssued(Address.fromString(provider.id), event.params.endpoint)
  endpoint.costPerDot = bondage.calcZapForDots(Address.fromString(provider.id), event.params.endpoint, BigInt.fromI32(1))

  // try to get the endpoint's Dot Limit, it's null if there is an issue getting it
  let dotLimitResult = bondage.try_dotLimit(Address.fromString(provider.id), event.params.endpoint)
  if (dotLimitResult.reverted) {
    endpoint.dotLimit = null
    log.debug("Issue with getting dotLimit of {}", [endpoint.endpointStr])
  } else {
    endpoint.dotLimit = dotLimitResult.value
  }

  let tdf = TokenDotFactory.bind(event.params.provider)

  let tokenAddResult = tdf.try_curves(event.params.endpoint)
  if (tokenAddResult.reverted) {
    endpoint.tokenAdd = null
    log.debug("Issue with getting token address for {}", [endpoint.endpointStr])
  } else {
    endpoint.tokenAdd = tokenAddResult.value.toString()
    if (endpoint.tokenAdd != null) {
      // if the endpoint is a token then get more metadata on it...
      endpoint.isToken = true
      // connection to the token's ERC20 contract
      let token = ERC20.bind(tokenAddResult.value)

      let symbolResult = token.try_symbol()  // try to get the token's symbol
      if (symbolResult.reverted) {
        endpoint.symbol = null
        log.debug("Issue with getting token symbol for {}", [endpoint.endpointStr])
      } else {
        endpoint.symbol = symbolResult.value
      }
    } else {
      endpoint.isToken = false
    }
  }
  // push the new endpoint to the provider's list of endpoints
  provider.endpoints.push(endpoint.id)

  // Save the new endpoint entity and the provider entity with the added endpoint
  endpoint.save()
  provider.save()
  log.info('Added endpoint {}', [endpoint.endpointStr])
}

// Transfers ownership of a provider
export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  let registry = Registry.bind(REGADDRESS)
  let provider = Provider.load(event.params.previousOwner.toHex())

  provider.id = event.params.newOwner.toString()
  provider.save()
  log.info("Ownership transfered from {} to {} ",
    [event.params.previousOwner.toString(),
    event.params.newOwner.toString()])
}

// Sets the parameters of an endpoint and updates it
export function handleSetEndpointParameter(call: SetEndpointParamsCall): void {
  let id = call.inputs.endpoint.toHex()
  let endpoint = Endpoint.load(id)  // load the endpoint if it exists...
  if (endpoint == null) {
    // if not create a new one
    endpoint = new Endpoint(id)
  }

  if (endpoint.endpointParams == null) {
    // if there is no existing endpoint param extablish it...
    endpoint.endpointParams = call.inputs.endpointParams

  } else {
    // if not then append it
    endpoint.endpointParams.concat(call.inputs.endpointParams)
  }

  endpoint.save()  // save changes to endpoint entity
  log.info("Enpoint Parameter added for {}", [endpoint.endpointStr])
}

// Creates a new Provider_Param entity.
// Also sets the parameter of a provider and updates it.
export function handleSetProviderParameter(call: SetProviderParameterCall): void {
  let id = call.transaction.hash.toHex()  // tx hash used as provider param ID
  let provider_param = new Provider_Param(id)

  provider_param.key = call.inputs.key
  provider_param.value = call.inputs.value

  let provider_id = call.from.toHex()  // msg.sender; the provider's address
  let provider = Provider.load(provider_id)
  if (provider == null) return  // if there is no provider to add params to, do nothing

  provider_param.provider = provider.id
  provider.provider_params.push(provider_param.id)  // add provider params to provider

  // save the provider and it's param entity
  provider.save()
  provider_param.save()
  log.info("Provider Parameter added for {}", [provider.title.toString()])

}
