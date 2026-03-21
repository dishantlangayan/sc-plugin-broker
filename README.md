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
@dishantlangayan/sc-plugin-broker/0.0.0 darwin-arm64 node-v24.1.0
$ sc --help [COMMAND]
USAGE
  $ sc COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`sc hello PERSON`](#sc-hello-person)
* [`sc hello world`](#sc-hello-world)
* [`sc help [COMMAND]`](#sc-help-command)
* [`sc plugins`](#sc-plugins)
* [`sc plugins add PLUGIN`](#sc-plugins-add-plugin)
* [`sc plugins:inspect PLUGIN...`](#sc-pluginsinspect-plugin)
* [`sc plugins install PLUGIN`](#sc-plugins-install-plugin)
* [`sc plugins link PATH`](#sc-plugins-link-path)
* [`sc plugins remove [PLUGIN]`](#sc-plugins-remove-plugin)
* [`sc plugins reset`](#sc-plugins-reset)
* [`sc plugins uninstall [PLUGIN]`](#sc-plugins-uninstall-plugin)
* [`sc plugins unlink [PLUGIN]`](#sc-plugins-unlink-plugin)
* [`sc plugins update`](#sc-plugins-update)

## `sc hello PERSON`

Say hello

```
USAGE
  $ sc hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ sc hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.0.0/src/commands/hello/index.ts)_

## `sc hello world`

Say hello world

```
USAGE
  $ sc hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ sc hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/dishantlangayan/sc-plugin-broker/blob/v0.0.0/src/commands/hello/world.ts)_

## `sc help [COMMAND]`

Display help for sc.

```
USAGE
  $ sc help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for sc.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/6.2.38/src/commands/help.ts)_

## `sc plugins`

List installed plugins.

```
USAGE
  $ sc plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ sc plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/index.ts)_

## `sc plugins add PLUGIN`

Installs a plugin into sc.

```
USAGE
  $ sc plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into sc.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the SC_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the SC_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ sc plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ sc plugins add myplugin

  Install a plugin from a github url.

    $ sc plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ sc plugins add someuser/someplugin
```

## `sc plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ sc plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ sc plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/inspect.ts)_

## `sc plugins install PLUGIN`

Installs a plugin into sc.

```
USAGE
  $ sc plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into sc.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the SC_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the SC_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ sc plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ sc plugins install myplugin

  Install a plugin from a github url.

    $ sc plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ sc plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/install.ts)_

## `sc plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ sc plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ sc plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/link.ts)_

## `sc plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ sc plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ sc plugins unlink
  $ sc plugins remove

EXAMPLES
  $ sc plugins remove myplugin
```

## `sc plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ sc plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/reset.ts)_

## `sc plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ sc plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ sc plugins unlink
  $ sc plugins remove

EXAMPLES
  $ sc plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/uninstall.ts)_

## `sc plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ sc plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ sc plugins unlink
  $ sc plugins remove

EXAMPLES
  $ sc plugins unlink myplugin
```

## `sc plugins update`

Update installed plugins.

```
USAGE
  $ sc plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/update.ts)_
<!-- commandsstop -->
