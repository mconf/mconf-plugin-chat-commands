# Repository of a plugin for BigBlueButton

## Implemented Commands

### `/list`
- **Description:** Lists all available commands in the chat.
- **Usage:** Type `/list` in the chat.
- **Restrictions:** None.

### `/demote`
- **Description:** Demotes the user who issued the command to the viewer role.
- **Usage:** Type `/demote` in the chat as a moderator.
- **Restrictions:** Only users with moderator privileges can execute this command.

### `/demoteAll`
- **Description:** Demotes all users in the meeting to the viewer role, except for the user who issued the command.
- **Usage:** Type `/demoteAll` in the chat as a moderator. The command will change the role of all other users to viewers.
- **Restrictions:** Only users with moderator privileges can execute this command. The command will not affect the sender.

### `/promoteAll`
- **Description:** Promotes all users in the meeting to the moderator role, except for the user who issued the command.
- **Usage:** Type `/promoteAll` in the chat as a moderator. The command will change the role of all other users to moderators.
- **Restrictions:** Only users with moderator privileges can execute this command. The command will not affect the sender.

### `/spam`
- **Description:** Sends a message repeatedly, either a specified number of times or at regular intervals.
- **Usage:**
  - For multiple sends: `/spam "message with spaces" [times]` (default 1, max 100)
  - For interval spam: `/spam "message" interval <ms>`
- **Restrictions:** None. Use `/stopSpam` to stop interval spam.

### `/stopSpam`
- **Description:** Stops all active spam intervals started by the `/spam` command.
- **Usage:** Type `/stopSpam` in the chat.
- **Restrictions:** None.

### `/debug`
- **Description:** Displays detailed debug information about the current session, including user details, browser environment, timing information, and storage data.
- **Usage:** Type `/debug` in the chat.
- **Restrictions:** None.

## Description

This is an experimental internal plugin developed by mconf for BigBlueButton. Its main purpose is to allow the inclusion and execution of custom chat commands in meetings. The plugin is designed to be easily extensible, enabling developers to add new commands with minimal effort.

### Features
- Easily add new chat commands by extending the configuration.
- Commands can trigger custom mutations and actions in the meeting context.
- Example command: `/demote` (see above for details).

A screenshot and/or a short video can be added here to illustrate usage.

## Building the Plugin

To build the plugin for production use, follow these steps:

```bash
cd $HOME/src/plugin-template
npm ci
npm run build-bundle
```

The above command will generate the `dist` folder, containing the bundled JavaScript file named `<plugin-name>.js`. This file can be hosted on any HTTPS server along with its `manifest.json`.

If you install the Plugin separated to the manifest, remember to change the `javascriptEntrypointUrl` in the `manifest.json` to the correct endpoint.

To use the plugin in BigBlueButton, send this parameter along in create call:

```
pluginManifests=[{"url":"<your-domain>/path/to/manifest.json"}]
```

Or additionally, you can add this same configuration in the `.properties` file from `bbb-web` in `/usr/share/bbb-web/WEB-INF/classes/bigbluebutton.properties`

## How to Add New Commands

Commands are defined in the plugin's configuration as objects with a name, description, mutation (optional), and an `execute` function. To add a new command:

1. Open the file where commands are configured (usually `component.tsx` or a dedicated config file).
2. Add a new entry to the `CommandConfig` object, specifying:
   - `name`: The command name (used after `/` in chat).
   - `description`: A brief description of the command.
   - `mutation`: (Optional) The GraphQL mutation string to be used.
   - `execute`: The function that will be called when the command is triggered. It receives context such as the current user, user list, arguments, and mutation trigger.
3. Ensure the mutation is mapped in the `mutationMap` if your command uses a custom mutation.

Example:
```typescript
const DEFAULT_COMMANDS: CommandConfig = {
  demote: { ... },
  myCommand: {
    name: 'myCommand',
    description: 'Does something special',
    mutation: MY_MUTATION,
    execute: ({ mutation, users, senderId, args }) => {
      // Your logic here
    },
  },
};
```

## Development mode

As for development mode (running this plugin from source), please, refer back to https://github.com/bigbluebutton/bigbluebutton-html-plugin-sdk section `Running the Plugin from Source`
