---
name: new-broker-command
description: Create new commands that use the Solace SEMP API to perform operations on an Event Broker.
---

When creating new commands:
- Replicate the proven patterns from broker:queue commands, including:
- Extending `ScBrokerCommand` base class (provides auto-resolution of broker, msgVpnName, sempConn)
- Using consistent flag naming (kebab-case → camelCase API mapping)
- Implementing pagination with user confirmation for list operations
- Following established test patterns with Mocha + Chai + Sinon
- Create limited set of tests that validate core functionality and not comprehensive tests
- Verify there are no linting error by running the tests

## Additional resources

- For create, update, and delete command use the Config SEMP API, see [semp-v2-swagger-config.json](semp-v2-swagger-config.json)
- For display and list commands, see [semp-v2-swagger-monitor.json](semp-v2-swagger-monitor.json)
- For test helper methods, see [README.md](../../../test/helpers/README.md)