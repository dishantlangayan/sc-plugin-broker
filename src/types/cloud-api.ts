/**
 * Cloud API Type Definitions
 * Based on https://api.solace.dev/cloud/openapi/63dc1facc5b9980042ed3901
 */

/**
 * Port configuration for a service connection endpoint
 */
export interface Port {
  port: number
  protocol: string
}

/**
 * Service connection endpoint
 */
export interface ServiceConnectionEndpoint {
  accessType?: string
  creationState?: string
  description?: string
  hostNames?: string[]
  id: string
  k8sServiceId?: string
  k8sServiceType?: string
  name: string
  ports: Port[]
  type?: string
}

/**
 * Mission Control Manager credentials for SEMP access
 */
export interface MissionControlManagerCredential {
  password: string
  token?: string
  username: string
}

/**
 * Message VPN configuration
 */
export interface MsgVpn {
  managementAdminLoginCredential?: MissionControlManagerCredential
  missionControlManagerLoginCredential: MissionControlManagerCredential
  msgVpnName: string
  serviceLoginCredential?: {
    password: string
    username: string
  }
}

/**
 * Broker configuration
 */
export interface Broker {
  cluster?: {
    name: string
    password: string
    primaryRouterName: string
    remoteAddress: string
    supportedAuthenticationMode?: string[]
  }
  managementReadOnlyLoginCredential?: MissionControlManagerCredential
  msgVpns?: MsgVpn[]
  version?: string
}

/**
 * Event Broker Service response from Cloud API
 */
export interface EventBrokerService {
  adminState?: string
  broker?: Broker
  createdTime?: string
  creationState?: string
  datacenterId?: string
  defaultManagementHostname: string
  environmentId?: string
  eventBrokerServiceVersion?: string
  id: string
  msgVpnName: string
  name: string
  ownedBy?: string
  serviceClassId?: string
  serviceConnectionEndpoints?: ServiceConnectionEndpoint[]
  type?: string
}

/**
 * List services response
 */
export interface ListServicesResponse {
  data: EventBrokerService[]
  meta?: {
    pagination?: {
      count: number
      pageNumber: number
      pageSize: number
      totalCount: number
      totalPages: number
    }
  }
}

/**
 * Get service details response
 */
export interface GetServiceResponse {
  data: EventBrokerService
}
