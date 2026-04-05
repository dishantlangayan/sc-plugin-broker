# Test Helpers

Shared test utilities for the sc-plugin-broker test suite.

## Quick Start

```typescript
import {
  expect,
  setupTestContext,
  stubCommandMethod,
  buildSimpleResponse,
  type TestContext,
} from '../../helpers/index.js'

describe('broker:queue:create', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['post'])
    context.mockConnection.post!.resolves(
      buildSimpleResponse({ data: { queueName: 'test' } })
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerQueueCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager
      )
    })

    it('should work', async () => {
      await BrokerQueueCreate.run(['--broker-name=test', '--queue-name=q1'])
      expect(context.mockConnection.post!.calledOnce).to.be.true
    })
  })
})
```

## Core Helpers

### `setupTestContext(brokerOptions?, connectionMethods?)`

Creates a complete test context with sandbox, mocks, and cleanup function.

**Parameters:**
- `brokerOptions` - Optional configuration for the mock broker
- `connectionMethods` - HTTP methods to stub (e.g., `['post']`, `['get', 'delete']`)

**Returns:** `TestContext` with:
- `sandbox` - Sinon sandbox for creating stubs
- `mockBroker` - Pre-configured BrokerAuth mock
- `mockConnection` - Mock connection with HTTP method stubs
- `mockBrokerAuthManager` - Mock auth manager with all required methods
- `cleanup()` - Function to restore all stubs

**Example:**
```typescript
const context = setupTestContext({}, ['post', 'get'])
// All mocks are ready to use
context.mockConnection.post!.resolves(buildSimpleResponse({ data: {} }))
```

### `stubCommandMethod(sandbox, CommandClass, methodName, returnValue)`

Stubs a method on a command class prototype.

**Example:**
```typescript
stubCommandMethod(
  context.sandbox,
  BrokerQueueCreate,
  'getBrokerAuthManager',
  context.mockBrokerAuthManager
)
```

### `stubCommandLog(sandbox, CommandClass)`

Convenience wrapper for stubbing the `log` method.

**Example:**
```typescript
const logStub = stubCommandLog(context.sandbox, BrokerQueueCreate)
expect(logStub.calledOnce).to.be.true
```

## Mock Factories

### Broker Mocks

#### `createMockBroker(options?)`

Creates a standard mock BrokerAuth instance.

**Example:**
```typescript
const broker = createMockBroker()
// Returns: { accessToken: 'dGVzdDp0ZXN0', name: 'test-broker', ... }

const customBroker = createMockBroker({
  name: 'my-broker',
  sempPort: 9000
})
```

#### `createMockCloudBroker(options?)`

Creates a Solace Cloud broker mock.

**Example:**
```typescript
const cloudBroker = createMockCloudBroker({ msgVpnName: 'my-vpn' })
// Returns: { isSolaceCloud: true, msgVpnName: 'my-vpn', ... }
```

#### `createMockBrokerAuthManager(sandbox, broker, connection, options?)`

Creates a complete mock BrokerAuthManager with all required stubs.

**Example:**
```typescript
const manager = createMockBrokerAuthManager(sandbox, mockBroker, mockConnection, {
  brokerExists: true,
  defaultBroker: mockDefaultBroker
})
```

### Connection Mocks

#### `createMockConnection(sandbox, methods, defaultResolve?)`

Creates a mock connection with HTTP method stubs.

**Example:**
```typescript
const conn = createMockConnection(sandbox, ['post', 'get'])
conn.post!.resolves({ data: {}, meta: { responseCode: 200 } })
```

### Config Mocks

#### `createMockConfig(sandbox, options?)`

Creates a mock oclif Config object.

**Example:**
```typescript
const config = createMockConfig(sandbox)
const command = new BrokerLoginBasic(['--broker-name=test'], config)
```

## Response Builders

### `buildSimpleResponse(options)`

Builds a simple SEMP response for create/update operations.

**Example:**
```typescript
const response = buildSimpleResponse({
  data: { queueName: 'test', msgVpnName: 'default' },
  responseCode: 200  // optional, defaults to 200
})
```

### `buildPaginatedResponse(options)`

Builds a paginated SEMP response for list operations.

**Example:**
```typescript
const response = buildPaginatedResponse({
  data: [{ queueName: 'q1' }, { queueName: 'q2' }],
  hasNextPage: true,
  cursorQuery: 'cursor=abc123'
})
```

### `buildDeleteResponse(responseCode?)`

Builds a delete SEMP response (no data, just metadata).

**Example:**
```typescript
const response = buildDeleteResponse(200)
// Returns: { meta: { responseCode: 200 } }
```

## Common Patterns

### CRUD Command Tests

```typescript
describe('broker:queue:create', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['post'])
    context.mockConnection.post!.resolves(
      buildSimpleResponse({ data: { queueName: 'test' } })
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerQueueCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager
      )
    })

    it('should call correct endpoint', async () => {
      await BrokerQueueCreate.run([...flags])
      expect(context.mockConnection.post!.calledWith('/SEMP/v2/...')).to.be.true
    })
  })
})
```

### List Command Tests with Pagination

```typescript
describe('broker:queue:list', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({ data: [] })
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  it('should handle pagination', async () => {
    const firstPage = buildPaginatedResponse({
      data: [{ queueName: 'q1' }],
      hasNextPage: true,
      cursorQuery: 'cursor=123'
    })

    const secondPage = buildSimpleResponse({
      data: [{ queueName: 'q2' }]
    })

    context.mockConnection.get!.onFirstCall().resolves(firstPage)
    context.mockConnection.get!.onSecondCall().resolves(secondPage)

    const result = await BrokerQueueList.run([...flags, '--all'])
    expect(result.data).to.have.lengthOf(2)
  })
})
```
