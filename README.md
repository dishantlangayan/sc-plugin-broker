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
@dishantlangayan/sc-plugin-broker/0.4.0 linux-x64 node-v20.20.1
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
* [`sc broker client-profile create`](#sc-broker-client-profile-create)
* [`sc broker client-profile delete`](#sc-broker-client-profile-delete)
* [`sc broker client-profile display`](#sc-broker-client-profile-display)
* [`sc broker client-profile list`](#sc-broker-client-profile-list)
* [`sc broker client-profile update`](#sc-broker-client-profile-update)
* [`sc broker login basic`](#sc-broker-login-basic)
* [`sc broker login cloud`](#sc-broker-login-cloud)
* [`sc broker login list`](#sc-broker-login-list)
* [`sc broker logout`](#sc-broker-logout)
* [`sc broker queue create`](#sc-broker-queue-create)
* [`sc broker queue delete`](#sc-broker-queue-delete)
* [`sc broker queue display`](#sc-broker-queue-display)
* [`sc broker queue list`](#sc-broker-queue-list)
* [`sc broker queue subscriptions create`](#sc-broker-queue-subscriptions-create)
* [`sc broker queue subscriptions delete`](#sc-broker-queue-subscriptions-delete)
* [`sc broker queue update`](#sc-broker-queue-update)

## `sc broker client-profile create`

Create a Client Profile on a Solace Event Broker.

```
USAGE
  $ sc broker client-profile create -c <value> [--json] [--log-level debug|warn|error|info|trace] [-b <value> | -n <value>] [-v
    <value>] [--allow-bridge-connections-enabled] [--allow-guaranteed-endpoint-create-durability
    all|durable|non-durable] [--allow-guaranteed-endpoint-create-enabled] [--allow-guaranteed-msg-receive-enabled]
    [--allow-guaranteed-msg-send-enabled] [--allow-shared-subscriptions-enabled] [--allow-transacted-sessions-enabled]
    [--api-queue-management-copy-from-on-create-name <value>] [--api-queue-management-copy-from-on-create-template-name
    <value>] [--compression-enabled] [--eliding-delay <value>] [--eliding-enabled]
    [--tls-allow-downgrade-to-plain-text-enabled]

FLAGS
  -b, --broker-id=<value>                                               Stored broker identifier. If not provided, uses
                                                                        the default broker.
  -c, --client-profile-name=<value>                                     (required) The name of the client profile to
                                                                        create.
  -n, --broker-name=<value>                                             Stored broker name. If not provided, uses the
                                                                        default broker.
  -v, --msg-vpn-name=<value>                                            The name of the Message VPN.
      --[no-]allow-bridge-connections-enabled                           Enable or disable allowing Bridge clients using
                                                                        the Client Profile to connect.
      --allow-guaranteed-endpoint-create-durability=<option>            The types of Queues and Topic Endpoints that
                                                                        clients can create.
                                                                        <options: all|durable|non-durable>
      --[no-]allow-guaranteed-endpoint-create-enabled                   Enable or disable allowing clients to create
                                                                        topic endpoints or queues.
      --[no-]allow-guaranteed-msg-receive-enabled                       Enable or disable allowing clients to receive
                                                                        guaranteed messages.
      --[no-]allow-guaranteed-msg-send-enabled                          Enable or disable allowing clients to send
                                                                        guaranteed messages.
      --[no-]allow-shared-subscriptions-enabled                         Enable or disable allowing shared subscriptions.
      --[no-]allow-transacted-sessions-enabled                          Enable or disable allowing clients to establish
                                                                        transacted sessions.
      --api-queue-management-copy-from-on-create-name=<value>           The name of a queue to copy settings from when a
                                                                        new queue is created by a client.
      --api-queue-management-copy-from-on-create-template-name=<value>  The name of a queue template to copy settings
                                                                        from when a new queue is created by a client.
      --[no-]compression-enabled                                        Enable or disable allowing clients to use
                                                                        compression.
      --eliding-delay=<value>                                           The amount of time to delay the delivery of
                                                                        messages to clients, in milliseconds.
      --[no-]eliding-enabled                                            Enable or disable message eliding.
      --[no-]tls-allow-downgrade-to-plain-text-enabled                  Enable or disable allowing a client to downgrade
                                                                        an encrypted connection to plain text.

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  Create a Client Profile on a Solace Event Broker.

  Any attribute missing from the request will be set to its default value. The creation of instances of this object are
  synchronized to HA mates and replication sites via config-sync.

EXAMPLES
  $ sc broker client-profile create --broker-name=dev-broker --client-profile-name=myProfile --msg-vpn-name=default

  $ sc broker client-profile create --broker-id=dev-broker --client-profile-name=myProfile --msg-vpn-name=default --allow-guaranteed-msg-receive-enabled

  $ sc broker client-profile create --broker-name=dev-broker --client-profile-name=myProfile --msg-vpn-name=default --compression-enabled --eliding-enabled

  $ sc broker client-profile create --client-profile-name=myProfile
```

_See code: [src/commands/broker/client-profile/create.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/client-profile/create.ts)_

## `sc broker client-profile delete`

Delete a Client Profile from a Solace Event Broker.

```
USAGE
  $ sc broker client-profile delete -c <value> [--json] [--log-level debug|warn|error|info|trace] [-b <value> | -n <value>] [-v
    <value>] [--no-prompt]

FLAGS
  -b, --broker-id=<value>            Stored broker identifier. If not provided, uses the default broker.
  -c, --client-profile-name=<value>  (required) The name of the client profile to delete.
  -n, --broker-name=<value>          Stored broker name. If not provided, uses the default broker.
  -v, --msg-vpn-name=<value>         The name of the Message VPN.
      --no-prompt                    Skip confirmation prompt.

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  Delete a Client Profile from a Solace Event Broker.

  Deletes the specified Client Profile from the Message VPN. This action cannot be undone. A confirmation prompt will be
  displayed unless --no-prompt is specified.

EXAMPLES
  $ sc broker client-profile delete --broker-name=dev-broker --client-profile-name=myProfile --msg-vpn-name=default

  $ sc broker client-profile delete --broker-id=dev-broker --client-profile-name=myProfile --msg-vpn-name=default --no-prompt

  $ sc broker client-profile delete --client-profile-name=myProfile

  $ sc broker client-profile delete --client-profile-name=myProfile --no-prompt
```

_See code: [src/commands/broker/client-profile/delete.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/client-profile/delete.ts)_

## `sc broker client-profile display`

Display a Client Profile from a Solace Event Broker.

```
USAGE
  $ sc broker client-profile display -c <value> [--json] [--log-level debug|warn|error|info|trace] [-b <value> | -n <value>] [-v
    <value>]

FLAGS
  -b, --broker-id=<value>            Stored broker identifier. If not provided, uses the default broker.
  -c, --client-profile-name=<value>  (required) The name of the client profile to display.
  -n, --broker-name=<value>          Stored broker name. If not provided, uses the default broker.
  -v, --msg-vpn-name=<value>         The name of the Message VPN.

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  Display a Client Profile from a Solace Event Broker.

  Retrieves and displays detailed information about a specific Client Profile using the SEMP Monitor API.

EXAMPLES
  $ sc broker client-profile display --broker-name=dev-broker --client-profile-name=myProfile --msg-vpn-name=default

  $ sc broker client-profile display --broker-id=dev-broker --client-profile-name=myProfile --msg-vpn-name=default

  $ sc broker client-profile display --client-profile-name=myProfile
```

_See code: [src/commands/broker/client-profile/display.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/client-profile/display.ts)_

## `sc broker client-profile list`

List Client Profiles from a Solace Event Broker.

```
USAGE
  $ sc broker client-profile list [--json] [--log-level debug|warn|error|info|trace] [-b <value> | -n <value>] [-v <value>] [-a]
    [-c <value>] [--count <value>] [-s <value>]

FLAGS
  -a, --all                          Display all client profiles (auto-pagination).
  -b, --broker-id=<value>            Stored broker identifier. If not provided, uses the default broker.
  -c, --client-profile-name=<value>  Filter client profiles by name. Supports * wildcard.
  -n, --broker-name=<value>          Stored broker name. If not provided, uses the default broker.
  -s, --select=<value>               Comma-separated list of attributes to display (max 10).
  -v, --msg-vpn-name=<value>         The name of the Message VPN.
      --count=<value>                [default: 10] Number of client profiles to display per page.

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  List Client Profiles from a Solace Event Broker.

  Retrieves and displays Client Profiles from the specified Message VPN using the SEMP Monitor API.
  Supports filtering by name (with wildcards), custom attribute selection, and pagination.

EXAMPLES
  $ sc broker client-profile list

  $ sc broker client-profile list --count=20

  $ sc broker client-profile list --client-profile-name="test*"

  $ sc broker client-profile list --select=clientProfileName,compressionEnabled,elidingEnabled

  $ sc broker client-profile list --all

  $ sc broker client-profile list --client-profile-name="*prod*" --count=5 --all
```

_See code: [src/commands/broker/client-profile/list.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/client-profile/list.ts)_

## `sc broker client-profile update`

Update a Client Profile on a Solace Event Broker.

```
USAGE
  $ sc broker client-profile update -c <value> [--json] [--log-level debug|warn|error|info|trace] [-b <value> | -n <value>] [-v
    <value>] [--allow-bridge-connections-enabled] [--allow-guaranteed-endpoint-create-durability
    all|durable|non-durable] [--allow-guaranteed-endpoint-create-enabled] [--allow-guaranteed-msg-receive-enabled]
    [--allow-guaranteed-msg-send-enabled] [--allow-shared-subscriptions-enabled] [--allow-transacted-sessions-enabled]
    [--api-queue-management-copy-from-on-create-name <value>] [--api-queue-management-copy-from-on-create-template-name
    <value>] [--compression-enabled] [--eliding-delay <value>] [--eliding-enabled]
    [--tls-allow-downgrade-to-plain-text-enabled]

FLAGS
  -b, --broker-id=<value>                                               Stored broker identifier. If not provided, uses
                                                                        the default broker.
  -c, --client-profile-name=<value>                                     (required) The name of the client profile to
                                                                        update.
  -n, --broker-name=<value>                                             Stored broker name. If not provided, uses the
                                                                        default broker.
  -v, --msg-vpn-name=<value>                                            The name of the Message VPN.
      --[no-]allow-bridge-connections-enabled                           Enable or disable allowing Bridge clients using
                                                                        the Client Profile to connect.
      --allow-guaranteed-endpoint-create-durability=<option>            The types of Queues and Topic Endpoints that
                                                                        clients can create.
                                                                        <options: all|durable|non-durable>
      --[no-]allow-guaranteed-endpoint-create-enabled                   Enable or disable allowing clients to create
                                                                        topic endpoints or queues.
      --[no-]allow-guaranteed-msg-receive-enabled                       Enable or disable allowing clients to receive
                                                                        guaranteed messages.
      --[no-]allow-guaranteed-msg-send-enabled                          Enable or disable allowing clients to send
                                                                        guaranteed messages.
      --[no-]allow-shared-subscriptions-enabled                         Enable or disable allowing shared subscriptions.
      --[no-]allow-transacted-sessions-enabled                          Enable or disable allowing clients to establish
                                                                        transacted sessions.
      --api-queue-management-copy-from-on-create-name=<value>           The name of a queue to copy settings from when a
                                                                        new queue is created by a client.
      --api-queue-management-copy-from-on-create-template-name=<value>  The name of a queue template to copy settings
                                                                        from when a new queue is created by a client.
      --[no-]compression-enabled                                        Enable or disable allowing clients to use
                                                                        compression.
      --eliding-delay=<value>                                           The amount of time to delay the delivery of
                                                                        messages to clients, in milliseconds.
      --[no-]eliding-enabled                                            Enable or disable message eliding.
      --[no-]tls-allow-downgrade-to-plain-text-enabled                  Enable or disable allowing a client to downgrade
                                                                        an encrypted connection to plain text.

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  Update a Client Profile on a Solace Event Broker.

  Updates the configuration of an existing Client Profile. Only provided attributes will be updated (PATCH semantics).
  The updates are synchronized to HA mates and replication sites via config-sync.

EXAMPLES
  $ sc broker client-profile update --broker-name=dev-broker --client-profile-name=myProfile --msg-vpn-name=default --compression-enabled

  $ sc broker client-profile update --broker-id=dev-broker --client-profile-name=myProfile --msg-vpn-name=default --no-eliding-enabled

  $ sc broker client-profile update --broker-name=dev-broker --client-profile-name=myProfile --msg-vpn-name=default --allow-guaranteed-msg-send-enabled --allow-guaranteed-msg-receive-enabled

  $ sc broker client-profile update --client-profile-name=myProfile --eliding-delay=100
```

_See code: [src/commands/broker/client-profile/update.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/client-profile/update.ts)_

## `sc broker login basic`

Authorize the SC CLI to make SEMP API calls to a Solace Event Broker using Basic authentication.

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
  Authorize the SC CLI to make SEMP API calls to a Solace Event Broker using Basic authentication.

  Stores broker credentials securely using encrypted local storage.
  Credentials are base64-encoded and encrypted before storage.

  If a broker with the same name already exists, you'll be prompted to overwrite.

EXAMPLES
  $ sc broker login basic --broker-name=dev-broker --semp-url=https://localhost --semp-port=8080

  $ sc broker login basic --broker-name=ci-broker --semp-url=http://192.168.1.100 --semp-port=8080 --no-prompt

  $ sc broker login basic --broker-name=default-broker --semp-url=https://broker.example.com --semp-port=943 --set-default
```

_See code: [src/commands/broker/login/basic.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/login/basic.ts)_

## `sc broker login cloud`

Authorize the SC CLI to make SEMP API calls to a Solace Cloud Event Broker using Basic Authentication.

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
  Authorize the SC CLI to make SEMP API calls to a Solace Cloud Event Broker using Basic Authentication.

  Retrieves SEMP credentials automatically from Event Broker Service using Solace Cloud REST API.
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

_See code: [src/commands/broker/login/cloud.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/login/cloud.ts)_

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

_See code: [src/commands/broker/login/list.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/login/list.ts)_

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

_See code: [src/commands/broker/logout.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/logout.ts)_

## `sc broker queue create`

Create a Queue on a Solace Event Broker.

```
USAGE
  $ sc broker queue create -q <value> [--json] [--log-level debug|warn|error|info|trace] [-b <value> | -n <value>] [-v
    <value>] [-a exclusive|non-exclusive] [--dead-msg-queue <value>] [--egress-enabled] [--ingress-enabled] [-s <value>]
    [--max-redelivery-count <value>] [--max-ttl <value>] [-o <value>] [-p
    consume|delete|modify-topic|no-access|read-only] [--respect-ttl-enabled]

FLAGS
  -a, --access-type=<option>          The access type for the queue.
                                      <options: exclusive|non-exclusive>
  -b, --broker-id=<value>             Stored broker identifier. If not provided, uses the default broker.
  -n, --broker-name=<value>           Stored broker name. If not provided, uses the default broker.
  -o, --owner=<value>                 The client username that owns the queue and has permission equivalent to delete.
  -p, --permission=<option>           [default: consume] The permission level for all consumers of the queue, excluding
                                      the owner.
                                      <options: consume|delete|modify-topic|no-access|read-only>
  -q, --queue-name=<value>            (required) The name of the queue to create.
  -s, --max-msg-spool-usage=<value>   The maximum message spool usage allowed by the queue, in megabytes (MB).
  -v, --msg-vpn-name=<value>          The name of the Message VPN.
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

  $ sc broker queue create --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default --max-msg-spool-usage=1024 --egress-enabled --ingress-enabled

  $ sc broker queue create --queue-name=myQueue
```

_See code: [src/commands/broker/queue/create.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/queue/create.ts)_

## `sc broker queue delete`

Delete a Queue from a Solace Event Broker.

```
USAGE
  $ sc broker queue delete -q <value> [--json] [--log-level debug|warn|error|info|trace] [-b <value> | -n <value>] [-v
    <value>] [--no-prompt]

FLAGS
  -b, --broker-id=<value>     Stored broker identifier. If not provided, uses the default broker.
  -n, --broker-name=<value>   Stored broker name. If not provided, uses the default broker.
  -q, --queue-name=<value>    (required) The name of the queue to delete.
  -v, --msg-vpn-name=<value>  The name of the Message VPN.
      --no-prompt             Skip confirmation prompt and proceed with deletion.

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  Delete a Queue from a Solace Event Broker.

  Deletes the specified queue from the Message VPN. This is a destructive operation that removes the queue and all its
  messages. Any messages persisted on the queue will also be deleted.

  The deletion is synchronized to HA mates and replication sites via config-sync.

  By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.

EXAMPLES
  $ sc broker queue delete --queue-name=myQueue --msg-vpn-name=default

  $ sc broker queue delete --broker-name=dev-broker --queue-name=myQueue

  $ sc broker queue delete --queue-name=myQueue --no-prompt

  $ sc broker queue delete --broker-id=prod --queue-name=tempQueue --msg-vpn-name=production --no-prompt
```

_See code: [src/commands/broker/queue/delete.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/queue/delete.ts)_

## `sc broker queue display`

Display queue information from a Solace Event Broker.

```
USAGE
  $ sc broker queue display -q <value> [--json] [--log-level debug|warn|error|info|trace] [-b <value> | -n <value>] [-v
    <value>] [-s]

FLAGS
  -b, --broker-id=<value>     Stored broker identifier. If not provided, uses the default broker.
  -n, --broker-name=<value>   Stored broker name. If not provided, uses the default broker.
  -q, --queue-name=<value>    (required) The name of the queue to display.
  -s, --show-subscriptions    Display only queue subscriptions without queue details.
  -v, --msg-vpn-name=<value>  The name of the Message VPN.

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  Display queue information from a Solace Event Broker.

  Retrieves and displays detailed information about a queue using the SEMP Monitor API, including operational state,
  statistics, and configuration.

EXAMPLES
  $ sc broker queue display --queue-name=myQueue --msg-vpn-name=default

  $ sc broker queue display --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default

  $ sc broker queue display --queue-name=myQueue --show-subscriptions

  $ sc broker queue display --queue-name=myQueue
```

_See code: [src/commands/broker/queue/display.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/queue/display.ts)_

## `sc broker queue list`

List queues from a Solace Event Broker.

```
USAGE
  $ sc broker queue list [--json] [--log-level debug|warn|error|info|trace] [-b <value> | -n <value>] [-v <value>] [-a]
    [-c <value>] [-q <value>] [-s <value>]

FLAGS
  -a, --all                   Display all queues (auto-pagination).
  -b, --broker-id=<value>     Stored broker identifier. If not provided, uses the default broker.
  -c, --count=<value>         [default: 10] Number of queues to display per page.
  -n, --broker-name=<value>   Stored broker name. If not provided, uses the default broker.
  -q, --queue-name=<value>    Filter queues by name. Supports * wildcard.
  -s, --select=<value>        Comma-separated list of attributes to display (max 10).
  -v, --msg-vpn-name=<value>  The name of the Message VPN.

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  List queues from a Solace Event Broker.

  Retrieves and displays queues from the specified Message VPN using the SEMP Monitor API.
  Supports filtering by name (with wildcards), custom attribute selection, and pagination.

EXAMPLES
  $ sc broker queue list

  $ sc broker queue list --count=20

  $ sc broker queue list --queue-name="order*"

  $ sc broker queue list --select=queueName,owner,maxMsgSpoolUsage

  $ sc broker queue list --all

  $ sc broker queue list --queue-name="*test*" --count=5 --all
```

_See code: [src/commands/broker/queue/list.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/queue/list.ts)_

## `sc broker queue subscriptions create`

Create a subscription on a Queue in a Solace Event Broker.

```
USAGE
  $ sc broker queue subscriptions create -q <value> -t <value> [--json] [--log-level debug|warn|error|info|trace] [-b <value> | -n
    <value>] [-v <value>]

FLAGS
  -b, --broker-id=<value>           Stored broker identifier. If not provided, uses the default broker.
  -n, --broker-name=<value>         Stored broker name. If not provided, uses the default broker.
  -q, --queue-name=<value>          (required) The name of the queue to add the subscription to.
  -t, --subscription-topic=<value>  (required) The subscription topic to add to the queue.
  -v, --msg-vpn-name=<value>        The name of the Message VPN.

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  Create a subscription on a Queue in a Solace Event Broker.

  Adds a topic subscription to the specified queue. Guaranteed messages published to topics matching the subscription
  will be delivered to the queue.

  The creation of subscriptions is synchronized to HA mates and replication sites via config-sync.

  Subscriptions use topic pattern matching which can include wildcards:
  - '*' matches exactly one level in the topic hierarchy
  - '>' matches one or more levels at the end of the topic

  Multiple subscriptions can be added to a single queue.

EXAMPLES
  $ sc broker queue subscriptions create --queue-name=myQueue --subscription-topic=orders/> --msg-vpn-name=default

  $ sc broker queue subscriptions create --broker-name=dev-broker --queue-name=myQueue --subscription-topic=events/user/*

  $ sc broker queue subscriptions create --broker-id=prod --queue-name=notifications --subscription-topic=alerts/critical --msg-vpn-name=production

  $ sc broker queue subscriptions create --queue-name=myQueue --subscription-topic=data/sensor/temperature
```

_See code: [src/commands/broker/queue/subscriptions/create.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/queue/subscriptions/create.ts)_

## `sc broker queue subscriptions delete`

Delete a subscription from a Queue in a Solace Event Broker.

```
USAGE
  $ sc broker queue subscriptions delete -q <value> -t <value> [--json] [--log-level debug|warn|error|info|trace] [-b <value> | -n
    <value>] [-v <value>] [--no-prompt]

FLAGS
  -b, --broker-id=<value>           Stored broker identifier. If not provided, uses the default broker.
  -n, --broker-name=<value>         Stored broker name. If not provided, uses the default broker.
  -q, --queue-name=<value>          (required) The name of the queue to remove the subscription from.
  -t, --subscription-topic=<value>  (required) The subscription topic to remove from the queue.
  -v, --msg-vpn-name=<value>        The name of the Message VPN.
      --no-prompt                   Skip confirmation prompt and proceed with deletion.

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  [default: info] Specify level for logging.
                        <options: debug|warn|error|info|trace>

DESCRIPTION
  Delete a subscription from a Queue in a Solace Event Broker.

  Removes a topic subscription from the specified queue. This is a destructive operation that removes the subscription.

  The deletion is synchronized to HA mates and replication sites via config-sync.

  By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.

EXAMPLES
  $ sc broker queue subscriptions delete --queue-name=myQueue --subscription-topic=orders/> --msg-vpn-name=default

  $ sc broker queue subscriptions delete --broker-name=dev-broker --queue-name=myQueue --subscription-topic=events/user/*

  $ sc broker queue subscriptions delete --queue-name=myQueue --subscription-topic=orders/> --no-prompt

  $ sc broker queue subscriptions delete --broker-id=prod --queue-name=notifications --subscription-topic=alerts/critical --msg-vpn-name=production --no-prompt
```

_See code: [src/commands/broker/queue/subscriptions/delete.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/queue/subscriptions/delete.ts)_

## `sc broker queue update`

Update a Queue on a Solace Event Broker.

```
USAGE
  $ sc broker queue update -q <value> [--json] [--log-level debug|warn|error|info|trace] [-b <value> | -n <value>] [-v
    <value>] [-a exclusive|non-exclusive] [--dead-msg-queue <value>] [--egress-enabled] [--ingress-enabled] [-s <value>]
    [--max-redelivery-count <value>] [--max-ttl <value>] [-o <value>] [-p
    consume|delete|modify-topic|no-access|read-only] [--respect-ttl-enabled]

FLAGS
  -a, --access-type=<option>          The access type for the queue.
                                      <options: exclusive|non-exclusive>
  -b, --broker-id=<value>             Stored broker identifier. If not provided, uses the default broker.
  -n, --broker-name=<value>           Stored broker name. If not provided, uses the default broker.
  -o, --owner=<value>                 The client username that owns the queue and has permission equivalent to delete.
  -p, --permission=<option>           The permission level for all consumers of the queue, excluding the owner.
                                      <options: consume|delete|modify-topic|no-access|read-only>
  -q, --queue-name=<value>            (required) The name of the queue to update.
  -s, --max-msg-spool-usage=<value>   The maximum message spool usage allowed by the queue, in megabytes (MB).
  -v, --msg-vpn-name=<value>          The name of the Message VPN.
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
  Update a Queue on a Solace Event Broker.

  Any attribute missing from the request will be left unchanged. The update of instances of this object are synchronized
  to HA mates and replication sites via config-sync.

EXAMPLES
  $ sc broker queue update --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default --egress-enabled

  $ sc broker queue update --broker-id=dev-broker --queue-name=myQueue --msg-vpn-name=default --max-msg-spool-usage=2048

  $ sc broker queue update --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default --max-msg-spool-usage=1024 --max-ttl=3600

  $ sc broker queue update --queue-name=myQueue --owner=newowner

  $ sc broker queue update --queue-name=myQueue --permission=read-only --no-egress-enabled
```

_See code: [src/commands/broker/queue/update.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.4.0/src/commands/broker/queue/update.ts)_
<!-- commandsstop -->
