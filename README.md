@dishantlangayan/sc-plugin-broker
=================

Commands to interact with Solace Event Broker.


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@dishantlangayan/sc-plugin-broker.svg)](https://npmjs.org/package/@dishantlangayan/sc-plugin-broker)
[![Downloads/week](https://img.shields.io/npm/dw/@dishantlangayan/sc-plugin-broker.svg)](https://npmjs.org/package/@dishantlangayan/sc-plugin-broker)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @dishantlangayan/sc-plugin-broker
$ sc COMMAND
running command...
$ sc (--version)
@dishantlangayan/sc-plugin-broker/0.0.0 linux-x64 node-v20.20.1
$ sc --help [COMMAND]
USAGE
  $ sc COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`sc broker login basic`](#sc-broker-login-basic)
* [`sc broker login cloud [FILE]`](#sc-broker-login-cloud-file)
* [`sc broker login list`](#sc-broker-login-list)
* [`sc broker logout`](#sc-broker-logout)

## `sc broker login basic`

Login to a Solace Event Broker using Basic authentication.

```
USAGE
  $ sc broker login basic -p <value> -u <value> [--json] [--log-level debug|warn|error|info|trace] [-i <value> | -b
    <value>] [--no-prompt] [-d]

FLAGS
  -b, --broker-name=<value>  Name/identifier for the broker
  -d, --set-default          Set this broker as the default
  -i, --broker-id=<value>    Alternative identifier for the broker (alias for broker-name)
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

  You can provide either --broker-name or --broker-id as the identifier.
  If a broker with the same name already exists, you'll be prompted to overwrite.

  Required SEMP permissions: Varies by operations you intend to perform

EXAMPLES
  $ sc broker login basic --broker-name=dev-broker --semp-url=https://localhost --semp-port=8080

  $ sc broker login basic --broker-id=prod --semp-url=https://broker.example.com --semp-port=943

  $ sc broker login basic --broker-name=ci-broker --semp-url=http://192.168.1.100 --semp-port=8080 --no-prompt

  $ sc broker login basic --broker-name=default-broker --semp-url=https://broker.example.com --semp-port=943 --set-default
```

_See code: [src/commands/broker/login/basic.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.0.0/src/commands/broker/login/basic.ts)_

## `sc broker login cloud [FILE]`

describe the command here

```
USAGE
  $ sc broker login cloud [FILE] [-f] [-n <value>]

ARGUMENTS
  [FILE]  file to read

FLAGS
  -f, --force
  -n, --name=<value>  name to print

DESCRIPTION
  describe the command here

EXAMPLES
  $ sc broker login cloud
```

_See code: [src/commands/broker/login/cloud.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.0.0/src/commands/broker/login/cloud.ts)_

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

_See code: [src/commands/broker/login/list.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.0.0/src/commands/broker/login/list.ts)_

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

_See code: [src/commands/broker/logout.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.0.0/src/commands/broker/logout.ts)_
<!-- commandsstop -->
