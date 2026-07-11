import BrokerQueueTemplateList from '../../../../src/commands/broker/queue-template/list.js'
import {MsgVpnQueueTemplateMonitor, MsgVpnQueueTemplatesMonitorResponse} from '../../../../src/types/msgvpn-queue-template.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:queue-template:list', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({
        data: [],
      }),
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('Basic Functionality', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateList, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateList.prototype, 'log')
    })

    it('should successfully list queue templates with default flags', async () => {
      const mockTemplates: MsgVpnQueueTemplateMonitor[] = [
        {
          accessType: 'exclusive',
          maxBindCount: 10,
          maxMsgSpoolUsage: 1000,
          msgVpnName: 'default',
          permission: 'consume',
          queueNameFilter: 'order.*',
          queueTemplateName: 'template1',
        },
        {
          accessType: 'non-exclusive',
          maxBindCount: 20,
          maxMsgSpoolUsage: 2000,
          msgVpnName: 'default',
          permission: 'delete',
          queueNameFilter: 'invoice.*',
          queueTemplateName: 'template2',
        },
      ]

      const mockResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: mockTemplates,
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      const result = await BrokerQueueTemplateList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      expect(result.data).to.have.lengthOf(2)
      expect(result.data[0].queueTemplateName).to.equal('template1')
      expect(result.data[1].queueTemplateName).to.equal('template2')
    })

    it('should handle empty queue template list', async () => {
      const mockResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      const result = await BrokerQueueTemplateList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      expect(result.data).to.have.lengthOf(0)
      const logStub = BrokerQueueTemplateList.prototype.log as SinonStub
      const logCalls = logStub.getCalls().map(call => call.args[0])
      expect(logCalls.some((call: string) => call.includes('No queue templates found'))).to.be.true
    })
  })

  describe('Count Flag', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateList, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateList.prototype, 'log')
    })

    it('should use count parameter from flag', async () => {
      const mockResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      await BrokerQueueTemplateList.run(['--broker-name=test-broker', '--msg-vpn-name=default', '--count=20'])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('count=20')
    })

    it('should use default count of 10 when not specified', async () => {
      const mockResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      await BrokerQueueTemplateList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('count=10')
    })
  })

  describe('Queue Template Name Filtering', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateList, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateList.prototype, 'log')
    })

    it('should add where parameter when name flag is provided', async () => {
      const mockResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      await BrokerQueueTemplateList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=order*',
      ])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('where=queueTemplateName')
      expect(url).to.match(/where=queueTemplateName.*order/)
    })

    it('should not add where parameter when name flag is not provided', async () => {
      const mockResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      await BrokerQueueTemplateList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.not.include('where=')
    })
  })

  describe('Select Flag', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateList, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateList.prototype, 'log')
    })

    it('should use custom attributes when select flag is provided', async () => {
      const mockResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: [
          {
            msgVpnName: 'default',
            permission: 'consume',
            queueTemplateName: 'template1',
          },
        ],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      await BrokerQueueTemplateList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--select=queueTemplateName,permission',
      ])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('select=')
      expect(url).to.include('queueTemplateName')
      expect(url).to.include('permission')
      expect(url).to.include('msgVpnName') // Always included
    })

    it('should use default attributes when select flag is not provided', async () => {
      const mockResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      await BrokerQueueTemplateList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('select=')
      // Should include all default attributes
      expect(url).to.include('queueTemplateName')
      expect(url).to.include('accessType')
      expect(url).to.include('permission')
      expect(url).to.include('maxBindCount')
      expect(url).to.include('maxMsgSpoolUsage')
      expect(url).to.include('queueNameFilter')
    })

    it('should error when more than 10 attributes are provided', async () => {
      try {
        await BrokerQueueTemplateList.run([
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
      stubCommandMethod(context.sandbox, BrokerQueueTemplateList, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateList.prototype, 'log')
    })

    it('should fetch all pages without prompting when --all flag is set', async () => {
      const firstPageResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: [
          {msgVpnName: 'default', queueTemplateName: 'template1'},
          {msgVpnName: 'default', queueTemplateName: 'template2'},
        ],
        meta: {
          paging: {
            cursorQuery: 'cursor123',
            nextPageUri: '/next',
          },
          responseCode: 200,
        },
      }

      const secondPageResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: [
          {msgVpnName: 'default', queueTemplateName: 'template3'},
          {msgVpnName: 'default', queueTemplateName: 'template4'},
        ],
        meta: {
          paging: {
            cursorQuery: 'cursor456',
            nextPageUri: '/next2',
          },
          responseCode: 200,
        },
      }

      const thirdPageResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: [{msgVpnName: 'default', queueTemplateName: 'template5'}],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.onFirstCall().resolves(firstPageResponse)
      context.mockConnection.get!.onSecondCall().resolves(secondPageResponse)
      context.mockConnection.get!.onThirdCall().resolves(thirdPageResponse)

      const result = await BrokerQueueTemplateList.run(['--broker-name=test-broker', '--msg-vpn-name=default', '--all'])

      expect(context.mockConnection.get!.callCount).to.equal(3)
      expect(result.data).to.have.lengthOf(5)
      expect(result.data[0].queueTemplateName).to.equal('template1')
      expect(result.data[4].queueTemplateName).to.equal('template5')
    })

    it('should pass cursor in subsequent page requests', async () => {
      const firstPageResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: [
          {msgVpnName: 'default', queueTemplateName: 'template1'},
          {msgVpnName: 'default', queueTemplateName: 'template2'},
        ],
        meta: {
          paging: {
            cursorQuery: 'cursor123',
            nextPageUri: '/next',
          },
          responseCode: 200,
        },
      }

      const secondPageResponse: MsgVpnQueueTemplatesMonitorResponse = {
        data: [{msgVpnName: 'default', queueTemplateName: 'template3'}],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.onFirstCall().resolves(firstPageResponse)
      context.mockConnection.get!.onSecondCall().resolves(secondPageResponse)

      await BrokerQueueTemplateList.run(['--broker-name=test-broker', '--msg-vpn-name=default', '--all'])

      const secondCall = context.mockConnection.get!.getCall(1)
      const url = secondCall.args[0] as string
      expect(url).to.include('cursor=cursor123')
    })
  })
})
