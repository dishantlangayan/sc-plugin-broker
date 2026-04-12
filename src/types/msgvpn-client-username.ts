/**
 * SEMP Config API type definitions for MsgVpnClientUsername operations
 */

/**
 * Request body for creating a Client Username via SEMP Config API
 */
export interface MsgVpnClientUsernameCreateRequest {
  aclProfileName?: string
  clientProfileName?: string
  clientUsername: string // Required - identifying attribute
  enabled?: boolean
  guaranteedEndpointPermissionOverrideEnabled?: boolean
  password?: string // Write-only, opaque
  subscriptionManagerEnabled?: boolean
}

/**
 * Request body for updating a Client Username via SEMP Config API (PATCH)
 * All fields are optional since PATCH only updates provided values
 * Note: clientUsername is NOT included - it's in the URL path for updates
 */
export interface MsgVpnClientUsernameUpdateRequest {
  aclProfileName?: string
  clientProfileName?: string
  enabled?: boolean
  guaranteedEndpointPermissionOverrideEnabled?: boolean
  password?: string
  subscriptionManagerEnabled?: boolean
}

/**
 * Response from SEMP Config API Client Username creation
 */
export interface MsgVpnClientUsernameCreateResponse {
  data: MsgVpnClientUsername
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API Client Username update
 * Same structure as create response
 */
export interface MsgVpnClientUsernameUpdateResponse {
  data: MsgVpnClientUsername
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API Client Username deletion
 * DELETE operations return only metadata (no data or links)
 */
export interface MsgVpnClientUsernameDeleteResponse {
  meta: SempMeta
}

/**
 * MsgVpnClientUsername object returned by SEMP Config API
 */
export interface MsgVpnClientUsername {
  [key: string]: unknown // Allow additional SEMP fields
  clientUsername: string
  msgVpnName: string
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
 * Response from SEMP Monitor API Client Username retrieval
 */
export interface MsgVpnClientUsernameMonitorResponse {
  data: MsgVpnClientUsernameMonitor
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Client Username object returned by SEMP Monitor API
 * Contains configuration and operational state
 */
export interface MsgVpnClientUsernameMonitor {
  [key: string]: unknown // Allow additional SEMP fields
  aclProfileName?: string
  clientProfileName?: string
  clientUsername: string
  enabled?: boolean
  guaranteedEndpointPermissionOverrideEnabled?: boolean
  msgVpnName: string
  subscriptionManagerEnabled?: boolean
  // Note: password is write-only and never returned
}

/**
 * Response from SEMP Monitor API Client Usernames list retrieval
 */
export interface MsgVpnClientUsernamesMonitorResponse {
  data: MsgVpnClientUsernameMonitor[]
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
