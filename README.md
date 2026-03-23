@dishantlangayan/sc-plugin-broker
=================

Commands to interact with Solace Event Broker.


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@dishantlangayan/sc-plugin-broker.svg)](https://npmjs.org/package/@dishantlangayan/sc-plugin-broker)
[![Downloads/week](https://img.shields.io/npm/dw/@dishantlangayan/sc-plugin-broker.svg)](https://npmjs.org/package/@dishantlangayan/sc-plugin-broker)


<!-- toc -->
* [Usage](#usage)
* [Resources](#resources)
* [Contributing](#contributing)
* [Authors](#authors)
* [License](#license)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @dishantlangayan/sc-plugin-broker
$ sc COMMAND
running command...
$ sc (--version)
@dishantlangayan/sc-plugin-broker/0.1.2 linux-x64 node-v20.20.1
$ sc --help [COMMAND]
USAGE
  $ sc COMMAND
...
```
<!-- usagestop -->
# Resources
<!-- resources -->
This is not an officially supported Solace product.

For more information try these resources:
- Ask the [Solace Community](https://solace.community)
- The Solace Developer Portal website at: https://solace.dev

<!-- resourcesstop -->
# Contributing
<!-- contributing -->
Contributions are encouraged! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

<!-- contributingstop -->
# Authors
<!-- authors -->
See the list of [contributors](https://github.com/dishantlangayan/sc-plugin-broker/graphs/contributors) who participated in this project.

<!-- authorsstop -->
# License
<!-- license -->
See the [LICENSE](LICENSE.txt) file for details.

<!-- licensestop -->
# Commands
<!-- commands -->
* [`sc broker login basic`](#sc-broker-login-basic)
* [`sc broker login cloud`](#sc-broker-login-cloud)
* [`sc broker login list`](#sc-broker-login-list)
* [`sc broker logout`](#sc-broker-logout)
* [`sc broker queue create`](#sc-broker-queue-create)

## `sc broker login basic`

Login to a Solace Event Broker using Basic authentication.

```
USAGE
  $ sc broker login basic -b <value> -p <value> -u <value> [--json] [--log-level debug|warn|error|info|trace]
    [--no-prompt] [-d]

FLAGS
  -b, --broker-name=<value>  (required) Name/identifier for the broker
  -d, --set-default          Set this broker as the default
  -p, --semp-port=<value>    (required) SEMP port number (1-65535)
  -u, --semp-url=<value>     (required) SEMP endpoint URL (must start with http:// or https://)
      --no-prompt            Read credentials from SC_SEMP_USERNAME and SC_SEMP_PASSWORD environment variables

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  Login to a Solace Event Broker using Basic authentication.

  Stores broker credentials securely using encrypted local storage.
  Credentials are base64-encoded and encrypted before storage.

  If a broker with the same name already exists, you'll be prompted to overwrite.

  Required SEMP permissions: Varies by operations you intend to perform

EXAMPLES
  $ sc broker login basic --broker-name=dev-broker --semp-url=https://localhost --semp-port=8080

  $ sc broker login basic --broker-name=ci-broker --semp-url=http://192.168.1.100 --semp-port=8080 --no-prompt

  $ sc broker login basic --broker-name=default-broker --semp-url=https://broker.example.com --semp-port=943 --set-default
```

_See code: [src/commands/broker/login/basic.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.1.2/src/commands/broker/login/basic.ts)_

## `sc broker login cloud`

Authorize the SC CLI to make SEMP API calls to a Solace Cloud Event Broker using Cloud API credentials.

```
USAGE
  $ sc broker login cloud -b <value> [--json] [--log-level debug|warn|error|info|trace] [--no-prompt] [-o <value>] [-d]

FLAGS
  -b, --broker-name=<value>  (required) Name of the broker in Solace Cloud
  -d, --set-default          Set this broker as the default
  -o, --org-name=<value>     Solace Cloud organization name (uses default org if not specified)
      --no-prompt            Skip confirmation prompts for overwriting existing broker

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  Authorize the SC CLI to make SEMP API calls to a Solace Cloud Event Broker using Cloud API credentials.

  Retrieves SEMP credentials automatically from Solace Cloud REST API.
  Requires prior authentication to Solace Cloud (sc:account:login).

  The command will:
  1. Look up the broker by name in your Solace Cloud organization
  2. Retrieve SEMP endpoint details and credentials from Cloud API
  3. Store encrypted broker credentials locally for future use

  Required Cloud API permissions: Read access to Event Broker Services

EXAMPLES
  $ sc broker login cloud --broker-name=production-broker

  $ sc broker login cloud --broker-name=dev-broker --set-default

  $ sc broker login cloud --broker-name=staging-broker --org-name=my-org

  $ sc broker login cloud --broker-name=prod --no-prompt
```

_See code: [src/commands/broker/login/cloud.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.1.2/src/commands/broker/login/cloud.ts)_

## `sc broker login list`

List all authenticated brokers.

```
USAGE
  $ sc broker login list [--json] [--log-level debug|warn|error|info|trace]

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  List all authenticated brokers.

  Displays brokers you have logged into, including their authentication type, SEMP endpoints, and which one is set as
  default.

EXAMPLES
  $ sc broker login list
```

_See code: [src/commands/broker/login/list.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.1.2/src/commands/broker/login/list.ts)_

## `sc broker logout`

Logout from authenticated brokers.

```
USAGE
  $ sc broker logout [--json] [--log-level debug|warn|error|info|trace] [-a | -b <value>] [--no-prompt]

FLAGS
  -a, --all                  Logout from all brokers
  -b, --broker-name=<value>  Broker name to logout from
      --no-prompt            Skip confirmation prompt and assume Yes

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  Logout from authenticated brokers.

  Removes locally stored broker credentials.
  Interactive mode allows selection with arrow keys and spacebar.

EXAMPLES
  $ sc broker logout

  $ sc broker logout --broker-name=dev-broker

  $ sc broker logout --all

  $ sc broker logout --broker-name=prod --no-prompt
```

_See code: [src/commands/broker/logout.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.1.2/src/commands/broker/logout.ts)_

## `sc broker queue create`

Create a Queue on a Solace Event Broker.

```
USAGE
  $ sc broker queue create -v <value> -q <value> [--json] [--log-level debug|warn|error|info|trace] [-a
    exclusive|non-exclusive] [-b <value>] [-n <value>] [--dead-msg-queue <value>] [--egress-enabled] [--ingress-enabled]
    [-s <value>] [--max-redelivery-count <value>] [--max-ttl <value>] [-o <value>] [-p
    consume|delete|modify-topic|no-access|read-only] [--respect-ttl-enabled]

FLAGS
  -a, --access-type=<option>          The access type for the queue.
                                      <options: exclusive|non-exclusive>
  -b, --broker-id=<value>             Stored broker identifier.
  -n, --broker-name=<value>           Stored broker name.
  -o, --owner=<value>                 The client username that owns the queue and has permission equivalent to delete.
  -p, --permission=<option>           [default: consume] The permission level for all consumers of the queue, excluding
                                      the owner.
                                      <options: consume|delete|modify-topic|no-access|read-only>
  -q, --queue-name=<value>            (required) The name of the queue to create.
  -s, --max-msg-spool-usage=<value>   The maximum message spool usage allowed by the queue, in megabytes (MB).
  -v, --msg-vpn-name=<value>          (required) The name of the Message VPN.
      --dead-msg-queue=<value>        The name of the Dead Message Queue.
      --[no-]egress-enabled           Enable or disable egress (message consumption) from the queue.
      --[no-]ingress-enabled          Enable or disable ingress (message reception) to the queue.
      --max-redelivery-count=<value>  The maximum number of times a message will be redelivered before it is discarded
                                      or moved to the DMQ.
      --max-ttl=<value>               The maximum time in seconds a message can stay in the queue when
                                      respect-ttl-enabled is true.
      --[no-]respect-ttl-enabled      Enable or disable the respecting of the time-to-live (TTL) for messages.

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  Create a Queue on a Solace Event Broker.

  Any attribute missing from the request will be set to its default value. The creation of instances of this object are
  synchronized to HA mates and replication sites via config-sync.

EXAMPLES
  $ sc broker queue create --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default

  $ sc broker queue create --broker-id=dev-broker --queue-name=myQueue --msg-vpn-name=default --access-type=non-exclusive

  $ sc broker queue create --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default --owner=user1 --permission=consume

  $ sc broker queue create --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default --max-msg-spool-usage=1024 --egress-enabled --ingress-enabled

  $ sc broker queue create --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default --dead-msg-queue=#DEAD_MSG_QUEUE --max-redelivery-count=3
```

_See code: [src/commands/broker/queue/create.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.1.2/src/commands/broker/queue/create.ts)_
<!-- commandsstop -->
