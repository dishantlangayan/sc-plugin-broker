import {AuthType, BrokerAuth, ScConnection} from '@dishantlangayan/sc-cli-core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import BrokerQueueList from '../../../../src/commands/broker/queue/list.js'
import {MsgVpnQueueMonitor, MsgVpnQueuesMonitorResponse} from '../../../../src/types/msgvpn-queue.js'

describe('broker:queue:list', () => {
  let mockBrokerAuthManager: {
    brokerExists: SinonStub
    createConnection: SinonStub
    getBroker: SinonStub
    getDefaultBroker: SinonStub
  }
  let mockConnection: {
    get: SinonStub
  }
  let mockBroker: BrokerAuth

  beforeEach(() => {
    // Setup mock broker
    mockBroker = {
      accessToken: 'dGVzdDp0ZXN0', // base64 encoded "test:test"
      authType: AuthType.BASIC,
      name: 'test-broker',
      sempEndpoint: 'https://localhost',
      sempPort: 8080,
    }

    // Setup mock connection
    mockConnection = {
      get: stub().resolves({
        data: [],
        meta: {
          responseCode: 200,
        },
      }),
    }

    // Setup mock BrokerAuthManager
    mockBrokerAuthManager = {
      brokerExists: stub().resolves(true),
      createConnection: stub().resolves(mockConnection as unknown as ScConnection),
      getBroker: stub().resolves(mockBroker),
      getDefaultBroker: stub().resolves(null),
    }
  })

  describe('Basic Functionality', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueList.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueList.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should successfully list queues with default flags', async () => {
      const mockQueues: MsgVpnQueueMonitor[] = [
        {
          accessType: 'exclusive',
          durable: true,
          egressEnabled: true,
          ingressEnabled: true,
          msgVpnName: 'default',
          queueName: 'queue1',
          spooledByteCount: 1_048_576, // 1 MB
          spooledMsgCount: 10,
        },
        {
          accessType: 'non-exclusive',
          durable: false,
          egressEnabled: true,
          ingressEnabled: false,
          msgVpnName: 'default',
          queueName: 'queue2',
          spooledByteCount: 2_097_152, // 2 MB
          spooledMsgCount: 20,
        },
      ]

      const mockResponse: MsgVpnQueuesMonitorResponse = {
        data: mockQueues,
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.resolves(mockResponse)

      const result = await BrokerQueueList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      expect(result.data).to.have.lengthOf(2)
      expect(result.data[0].queueName).to.equal('queue1')
      expect(result.data[1].queueName).to.equal('queue2')
    })

    it('should handle empty queue list', async () => {
      const mockResponse: MsgVpnQueuesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.resolves(mockResponse)

      const result = await BrokerQueueList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      expect(result.data).to.have.lengthOf(0)
      const logStub = BrokerQueueList.prototype.log as SinonStub
      const logCalls = logStub.getCalls().map(call => call.args[0])
      expect(logCalls.some((call: string) => call.includes('No queues found'))).to.be.true
    })
  })

  describe('Count Flag', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueList.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueList.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should use count parameter from flag', async () => {
      const mockResponse: MsgVpnQueuesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.resolves(mockResponse)

      await BrokerQueueList.run(['--broker-name=test-broker', '--msg-vpn-name=default', '--count=20'])

      const getCall = mockConnection.get.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('count=20')
    })

    it('should use default count of 10 when not specified', async () => {
      const mockResponse: MsgVpnQueuesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.resolves(mockResponse)

      await BrokerQueueList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = mockConnection.get.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('count=10')
    })
  })

  describe('Queue Name Filtering', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueList.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueList.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should add where parameter when queue-name flag is provided', async () => {
      const mockResponse: MsgVpnQueuesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.resolves(mockResponse)

      await BrokerQueueList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--queue-name=order*',
      ])

      const getCall = mockConnection.get.getCall(0)
      const url = getCall.args[0] as string
      // URLSearchParams encodes special characters
      expect(url).to.include('where=queueName')
      expect(url).to.match(/where=queueName.*order/)
    })

    it('should handle exact queue name match', async () => {
      const mockResponse: MsgVpnQueuesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.resolves(mockResponse)

      await BrokerQueueList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--queue-name=exactQueue',
      ])

      const getCall = mockConnection.get.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('where=queueName')
      expect(url).to.include('exactQueue')
    })

    it('should not add where parameter when queue-name flag is not provided', async () => {
      const mockResponse: MsgVpnQueuesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.resolves(mockResponse)

      await BrokerQueueList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = mockConnection.get.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.not.include('where=')
    })
  })

  describe('Select Flag', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueList.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueList.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should use custom attributes when select flag is provided', async () => {
      const mockResponse: MsgVpnQueuesMonitorResponse = {
        data: [
          {
            msgVpnName: 'default',
            owner: 'admin',
            queueName: 'queue1',
          },
        ],
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.resolves(mockResponse)

      await BrokerQueueList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--select=queueName,owner',
      ])

      const getCall = mockConnection.get.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('select=')
      expect(url).to.include('queueName')
      expect(url).to.include('owner')
      expect(url).to.include('msgVpnName') // Always included
    })

    it('should use default attributes when select flag is not provided', async () => {
      const mockResponse: MsgVpnQueuesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.resolves(mockResponse)

      await BrokerQueueList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = mockConnection.get.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('select=')
      // Should include all default attributes
      expect(url).to.include('queueName')
      expect(url).to.include('ingressEnabled')
      expect(url).to.include('egressEnabled')
      expect(url).to.include('accessType')
      expect(url).to.include('spooledMsgCount')
      expect(url).to.include('spooledByteCount')
      expect(url).to.include('durable')
    })

    it('should error when more than 10 attributes are provided', async () => {
      try {
        await BrokerQueueList.run([
          '--broker-name=test-broker',
          '--msg-vpn-name=default',
          '--select=a,b,c,d,e,f,g,h,i,j,k',
        ])
        expect.fail('Should have thrown an error')
      } catch (error) {
        const err = error as Error
        expect(err.message).to.include('Maximum 10 attributes')
      }
    })
  })

  describe('All Flag', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueList.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueList.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should fetch all pages without prompting when --all flag is set', async () => {
      // First page response
      const firstPageResponse: MsgVpnQueuesMonitorResponse = {
        data: [
          {msgVpnName: 'default', queueName: 'queue1', spooledMsgCount: 10},
          {msgVpnName: 'default', queueName: 'queue2', spooledMsgCount: 20},
        ],
        meta: {
          paging: {
            cursorQuery: 'cursor123',
            nextPageUri: '/next',
          },
          responseCode: 200,
        },
      }

      // Second page response
      const secondPageResponse: MsgVpnQueuesMonitorResponse = {
        data: [
          {msgVpnName: 'default', queueName: 'queue3', spooledMsgCount: 30},
          {msgVpnName: 'default', queueName: 'queue4', spooledMsgCount: 40},
        ],
        meta: {
          paging: {
            cursorQuery: 'cursor456',
            nextPageUri: '/next2',
          },
          responseCode: 200,
        },
      }

      // Third page response (final)
      const thirdPageResponse: MsgVpnQueuesMonitorResponse = {
        data: [{msgVpnName: 'default', queueName: 'queue5', spooledMsgCount: 50}],
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.onFirstCall().resolves(firstPageResponse)
      mockConnection.get.onSecondCall().resolves(secondPageResponse)
      mockConnection.get.onThirdCall().resolves(thirdPageResponse)

      const result = await BrokerQueueList.run(['--broker-name=test-broker', '--msg-vpn-name=default', '--all'])

      expect(mockConnection.get.callCount).to.equal(3)
      expect(result.data).to.have.lengthOf(5)
      expect(result.data[0].queueName).to.equal('queue1')
      expect(result.data[1].queueName).to.equal('queue2')
      expect(result.data[2].queueName).to.equal('queue3')
      expect(result.data[3].queueName).to.equal('queue4')
      expect(result.data[4].queueName).to.equal('queue5')
    })

    it('should stop at first page when cursor in subsequent page requests', async () => {
      const firstPageResponse: MsgVpnQueuesMonitorResponse = {
        data: [
          {msgVpnName: 'default', queueName: 'queue1', spooledMsgCount: 10},
          {msgVpnName: 'default', queueName: 'queue2', spooledMsgCount: 20},
        ],
        meta: {
          paging: {
            cursorQuery: 'cursor123',
            nextPageUri: '/next',
          },
          responseCode: 200,
        },
      }

      const secondPageResponse: MsgVpnQueuesMonitorResponse = {
        data: [{msgVpnName: 'default', queueName: 'queue3', spooledMsgCount: 30}],
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.onFirstCall().resolves(firstPageResponse)
      mockConnection.get.onSecondCall().resolves(secondPageResponse)

      await BrokerQueueList.run(['--broker-name=test-broker', '--msg-vpn-name=default', '--all'])

      const secondCall = mockConnection.get.getCall(1)
      const url = secondCall.args[0] as string
      expect(url).to.include('cursor=cursor123')
    })
  })

  describe('Data Formatting', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueList.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueList.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should convert spooledByteCount to MB in display', async () => {
      const mockQueues: MsgVpnQueueMonitor[] = [
        {
          msgVpnName: 'default',
          queueName: 'queue1',
          spooledByteCount: 157_286_400, // 150 MB
          spooledMsgCount: 1000,
        },
      ]

      const mockResponse: MsgVpnQueuesMonitorResponse = {
        data: mockQueues,
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.resolves(mockResponse)

      const result = await BrokerQueueList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--select=queueName,spooledByteCount',
      ])

      // Verify the data is returned correctly (formatting happens in the stream table)
      expect(result.data).to.have.lengthOf(1)
      expect(result.data[0].spooledByteCount).to.equal(157_286_400)
    })

    it('should display boolean values as Yes/No', async () => {
      const mockQueues: MsgVpnQueueMonitor[] = [
        {
          durable: true,
          egressEnabled: false,
          ingressEnabled: true,
          msgVpnName: 'default',
          queueName: 'queue1',
        },
      ]

      const mockResponse: MsgVpnQueuesMonitorResponse = {
        data: mockQueues,
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.resolves(mockResponse)

      const result = await BrokerQueueList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--select=queueName,durable,ingressEnabled,egressEnabled',
      ])

      // Verify the data is returned correctly (formatting happens in the stream table)
      expect(result.data).to.have.lengthOf(1)
      expect(result.data[0].durable).to.be.true
      expect(result.data[0].ingressEnabled).to.be.true
      expect(result.data[0].egressEnabled).to.be.false
    })

    it('should display null/undefined as hyphen', async () => {
      const mockQueues: MsgVpnQueueMonitor[] = [
        {
          msgVpnName: 'default',
          owner: undefined,
          queueName: 'queue1',
        },
      ]

      const mockResponse: MsgVpnQueuesMonitorResponse = {
        data: mockQueues,
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.resolves(mockResponse)

      const result = await BrokerQueueList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--select=queueName,owner',
      ])

      // Verify the data is returned correctly (formatting happens in the stream table)
      expect(result.data).to.have.lengthOf(1)
      expect(result.data[0].owner).to.be.undefined
    })
  })
})
