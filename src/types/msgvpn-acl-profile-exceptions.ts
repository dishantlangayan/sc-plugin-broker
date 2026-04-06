/**
 * SEMP Config API type definitions for ACL Profile Exception operations
 */

// ============================================================================
// CLIENT CONNECT EXCEPTIONS
// ============================================================================

/**
 * Request body for creating a Client Connect Exception
 */
export interface MsgVpnAclProfileClientConnectExceptionCreateRequest {
  clientConnectExceptionAddress: string // IP address/netmask in CIDR format
}

/**
 * Client Connect Exception object from SEMP API
 */
export interface MsgVpnAclProfileClientConnectException {
  [key: string]: unknown
  aclProfileName?: string
  clientConnectExceptionAddress?: string
  msgVpnName?: string
}

/**
 * Response from SEMP Config API Client Connect Exception creation
 */
export interface MsgVpnAclProfileClientConnectExceptionCreateResponse {
  data: MsgVpnAclProfileClientConnectException
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API Client Connect Exception deletion
 */
export interface MsgVpnAclProfileClientConnectExceptionDeleteResponse {
  meta: SempMeta
}

/**
 * Response from SEMP Monitor API Client Connect Exception list
 */
export interface MsgVpnAclProfileClientConnectExceptionsListResponse {
  data: MsgVpnAclProfileClientConnectException[]
  links?: {[key: string]: unknown}
  meta: SempMeta
}

// ============================================================================
// PUBLISH TOPIC EXCEPTIONS
// ============================================================================

/**
 * Request body for creating a Publish Topic Exception
 */
export interface MsgVpnAclProfilePublishTopicExceptionCreateRequest {
  publishTopicException: string // Topic with optional wildcards
  publishTopicExceptionSyntax: 'mqtt' | 'smf'
}

/**
 * Publish Topic Exception object from SEMP API
 */
export interface MsgVpnAclProfilePublishTopicException {
  [key: string]: unknown
  aclProfileName?: string
  msgVpnName?: string
  publishTopicException?: string
  publishTopicExceptionSyntax?: 'mqtt' | 'smf'
}

/**
 * Response from SEMP Config API Publish Topic Exception creation
 */
export interface MsgVpnAclProfilePublishTopicExceptionCreateResponse {
  data: MsgVpnAclProfilePublishTopicException
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API Publish Topic Exception deletion
 */
export interface MsgVpnAclProfilePublishTopicExceptionDeleteResponse {
  meta: SempMeta
}

/**
 * Response from SEMP Monitor API Publish Topic Exception list
 */
export interface MsgVpnAclProfilePublishTopicExceptionsListResponse {
  data: MsgVpnAclProfilePublishTopicException[]
  links?: {[key: string]: unknown}
  meta: SempMeta
}

// ============================================================================
// SUBSCRIBE TOPIC EXCEPTIONS
// ============================================================================

/**
 * Request body for creating a Subscribe Topic Exception
 */
export interface MsgVpnAclProfileSubscribeTopicExceptionCreateRequest {
  subscribeTopicException: string // Topic with optional wildcards
  subscribeTopicExceptionSyntax: 'mqtt' | 'smf'
}

/**
 * Subscribe Topic Exception object from SEMP API
 */
export interface MsgVpnAclProfileSubscribeTopicException {
  [key: string]: unknown
  aclProfileName?: string
  msgVpnName?: string
  subscribeTopicException?: string
  subscribeTopicExceptionSyntax?: 'mqtt' | 'smf'
}

/**
 * Response from SEMP Config API Subscribe Topic Exception creation
 */
export interface MsgVpnAclProfileSubscribeTopicExceptionCreateResponse {
  data: MsgVpnAclProfileSubscribeTopicException
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API Subscribe Topic Exception deletion
 */
export interface MsgVpnAclProfileSubscribeTopicExceptionDeleteResponse {
  meta: SempMeta
}

/**
 * Response from SEMP Monitor API Subscribe Topic Exception list
 */
export interface MsgVpnAclProfileSubscribeTopicExceptionsListResponse {
  data: MsgVpnAclProfileSubscribeTopicException[]
  links?: {[key: string]: unknown}
  meta: SempMeta
}

// ============================================================================
// SHARED SEMP META
// ============================================================================

/**
 * SEMP API metadata object
 */
export interface SempMeta {
  [key: string]: unknown
  request?: {method?: string; uri?: string}
  responseCode?: number
}
