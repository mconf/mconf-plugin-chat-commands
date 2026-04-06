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

### `/join`
- **Description:** Makes HTTP requests to the provided BigBlueButton join URL to obtain valid session tokens, then establishes real GraphQL WebSocket connections to simulate multiple users joining a BigBlueButton meeting for load testing purposes.
- **Usage:**
  - With quotes (recommended for URLs with special characters): `/join "<join-url>" <number_of_users> [-v]`
  - Without quotes (for simple URLs): `/join <join-url> <number_of_users> [-v]`
  - Verbose mode: Add `-v` flag to receive detailed progress messages in the chat
- **Restrictions:** Number of users must be greater than 1. Requires valid BigBlueButton join URL that returns session tokens upon request.

### `/stopJoin`
- **Description:** Terminates all active WebSocket connections created by the `/join` command.
- **Usage:** Type `/stopJoin` in the chat.
- **Restrictions:** None.

### `/customJoin`
- **Description:** ⚠️ **ADVANCED FEATURE WITH SECURITY IMPLICATIONS** - Generates custom BigBlueButton join URLs using the server secret to create authenticated sessions with custom user data. This allows full control over user properties (name, role, custom metadata) when simulating joins. Unlike `/join`, which requires a pre-generated join URL, this command generates URLs directly using the BBB API secret.
- **Usage:** `/customJoin --secret "YOUR_SECRET" --pw "PASSWORD" <count> [options]`
- **Required Parameters:**
  - `--secret "SECRET"`: BigBlueButton server shared secret (found in `/etc/bigbluebutton/bbb-conf.properties`)
  - `--pw "PASSWORD"`: Meeting password (use attendee password for viewers, moderator password for moderators)
  - `<count>`: Number of users to join (positive integer)
- **Optional Parameters (auto-detected from current session if not provided):**
  - `--host "URL"`: BigBlueButton server URL (default: current host from window.location.origin)
  - `--meetingID "ID"`: Meeting/room identifier (default: auto-detected from DOM or meeting prop)
  - `--userdata "key1=value1,key2=value2"`: Custom userdata as comma-separated key=value pairs (e.g., `--userdata "bot=true,role=tester"`)
  - `-v`: Verbose mode (shows detailed progress messages in chat)
- **Examples:**
  - Join 5 viewers in current meeting (auto-detect host and meetingID):
    ```
    /customJoin --secret "abc123secret" --pw "attendeepass" 5 -v
    ```
  - Join to a different meeting:
    ```
    /customJoin --secret "abc123secret" --host "https://bbb.example.com" --meetingID "room123" --pw "attendeepass" 3
    ```
  - Join 2 moderators with custom userdata:
    ```
    /customJoin --secret "abc123secret" --pw "moderatorpass" 2 --userdata "bot=true,role=tester"
    ```
- **Security Warning:** ⚠️ This command exposes your BigBlueButton server secret in chat history and browser memory. The secret is extremely sensitive and should NEVER be shared. Only use this command in:
  - Secure development/testing environments
  - Private meetings where all participants are trusted
  - Environments where chat logs are not persisted or are securely managed
- **Features:**
  - Generates random user names using the **@faker-js/faker** library (realistic names in multiple locales)
  - Creates properly signed join URLs with SHA-1 checksums
  - Establishes real GraphQL WebSocket connections
  - Supports custom userdata fields as individual query parameters
  - Role (attendee/moderator) is determined by the password provided
- **Restrictions:** Count must be a positive integer. Requires valid BBB server credentials.

### `/stopCustomJoin`
- **Description:** Terminates all active WebSocket connections created by the `/customJoin` command.
- **Usage:** Type `/stopCustomJoin` in the chat.
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
