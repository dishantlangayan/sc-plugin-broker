/**
 * SEMP Config and Monitor API type definitions for MsgVpn operations
 */

/** Basic authentication types supported by a Message VPN */
export type MsgVpnAuthenticationBasicType = 'internal' | 'ldap' | 'none' | 'radius'

/**
 * Request body for creating a Message VPN via SEMP Config API
 */
export interface MsgVpnCreateRequest {
  authenticationBasicEnabled?: boolean
  authenticationBasicType?: MsgVpnAuthenticationBasicType
  enabled?: boolean
  eventLargeMsgThreshold?: number
  maxConnectionCount?: number
  maxEgressFlowCount?: number
  maxEndpointCount?: number
  maxIngressFlowCount?: number
  maxMsgSpoolUsage?: number
  maxSubscriptionCount?: number
  maxTransactedSessionCount?: number
  maxTransactionCount?: number
  msgVpnName: string
}

/**
 * Request body for updating a Message VPN via SEMP Config API (PATCH)
 * All fields are optional since PATCH only updates provided values.
 * Note: msgVpnName is NOT included - it's in the URL path for updates.
 */
export interface MsgVpnUpdateRequest {
  authenticationBasicEnabled?: boolean
  authenticationBasicType?: MsgVpnAuthenticationBasicType
  enabled?: boolean
  eventLargeMsgThreshold?: number
  maxConnectionCount?: number
  maxEgressFlowCount?: number
  maxEndpointCount?: number
  maxIngressFlowCount?: number
  maxMsgSpoolUsage?: number
  maxSubscriptionCount?: number
  maxTransactedSessionCount?: number
  maxTransactionCount?: number
}

/**
 * MsgVpn object returned by SEMP Config API
 */
export interface MsgVpn {
  [key: string]: unknown // Allow additional SEMP fields
  msgVpnName: string
}

/**
 * Response from SEMP Config API Message VPN creation
 */
export interface MsgVpnCreateResponse {
  data: MsgVpn
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API Message VPN update
 * Same structure as create response
 */
export interface MsgVpnUpdateResponse {
  data: MsgVpn
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API Message VPN deletion
 * DELETE operations return only metadata (no data or links)
 */
export interface MsgVpnDeleteResponse {
  meta: SempMeta
}

/**
 * SEMP response metadata
 */
export interface SempMeta {
  [key: string]: unknown
  request?: {method?: string; uri?: string}
  responseCode?: number
}

/**
 * Message VPN object returned by SEMP Monitor API
 * Contains operational state and statistics
 */
export interface MsgVpnMonitor {
  [key: string]: unknown // Allow additional SEMP fields
  authenticationBasicEnabled?: boolean
  authenticationBasicType?: MsgVpnAuthenticationBasicType
  enabled?: boolean
  maxConnectionCount?: number
  maxMsgSpoolUsage?: number
  maxSubscriptionCount?: number
  msgSpoolMsgCount?: number
  msgSpoolUsage?: number
  msgVpnName: string
  state?: string
}

/**
 * Response from SEMP Monitor API single Message VPN retrieval
 */
export interface MsgVpnMonitorResponse {
  data: MsgVpnMonitor
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Monitor API Message VPN list retrieval
 */
export interface MsgVpnsMonitorResponse {
  data: MsgVpnMonitor[]
  links?: {[key: string]: unknown}
  meta: SempMetaWithPaging
}

/**
 * SEMP response metadata with pagination support
 */
export interface SempMetaWithPaging extends SempMeta {
  count?: number // Total count of objects requested
  paging?: {
    cursorQuery: string // Cursor for next page
    nextPageUri: string // Full URI for next page
  }
}
