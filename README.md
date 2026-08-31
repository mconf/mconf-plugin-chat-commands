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

### `/injectSidekick`
- **Description:** Injects generic content (URL or HTML) into the sidekick panel area with customizable attributes.
- **Usage:**
  - Basic usage with URL: `/injectSidekick https://example.com`
  - With custom attributes: `/injectSidekick --id "my-content" --name "My Panel" --section "Tools" --icon "copy" --open "true" https://example.com`
  - With HTML content: `/injectSidekick --id "my-html" --name "HTML Panel" <h1>Welcome</h1><p>Custom content</p>`
- **Optional Parameters:**
  - `--id "ID"`: Unique identifier for the content item (default: auto-generated with timestamp)
  - `--name "NAME"`: Display name for the panel (default: "Generic Content")
  - `--section "SECTION"`: Section/category name in sidekick (default: "Custom")
  - `--icon "ICON"`: Icon name for the button (default: "copy")
  - `--open "true|false"`: Whether panel is open by default (default: "false")
- **Note:** Use double quotes (`"`) around values that contain spaces. The parser supports multi-word values enclosed in quotes.
- **Examples:**
  - `/injectSidekick --id "test" --name "Test Panel" --section "Plugins" --icon "cog" --open "true" https://example.com`
  - `/injectSidekick --name "My HTML" <div style="padding:20px"><h1>Hello!</h1></div>`
- **Restrictions:** None.

### `/injectMain`
- **Description:** Injects generic content (URL or HTML) into the main presentation area.
- **Usage:**
  - Basic usage with URL: `/injectMain https://example.com`
  - With custom ID: `/injectMain --id "my-main-content" https://example.com`
  - With HTML content: `/injectMain <h1>Welcome to Main Area</h1>`
- **Optional Parameters:**
  - `--id "ID"`: Unique identifier for the content item (default: auto-generated with timestamp)
- **Note:** Use double quotes (`"`) around values that contain spaces.
- **Examples:**
  - `/injectMain --id "dashboard" https://example.com/dashboard`
  - `/injectMain <div style="width:100%;height:100%;background:#f0f0f0">Main Content</div>`
- **Restrictions:** None.

### `/listGenericContent`
- **Description:** Lists all currently injected generic contents (sidekick or main) with their IDs. Works for both sidekick and main areas independently - injecting sidekick content will NOT remove existing main content and vice-versa.
- **Usage:**
  - List all contents (sidekick and main): `/listGenericContent`
  - List specific type: `/listGenericContent <sidekick|main>`
- **Output:** Displays all injected contents with their names and IDs, organized by type.
- **Examples:**
  - `/listGenericContent` - Shows all injected sidekicks and main contents
  - `/listGenericContent sidekick` - Shows only injected sidekicks
  - `/listGenericContent main` - Shows only injected main contents
- **Related Commands:** Use `/removeGenericContent <type> <ID>` to remove a specific content.
- **Restrictions:** None.

### `/removeGenericContent`
- **Description:** Remove generic content by ID (searches in both sidekick and main), or remove all contents of a specific type. Can remove content with just an ID without specifying the type.
- **Usage:**
  - Remove by ID (searches all types): `/removeGenericContent <ID>`
  - Remove all of a type: `/removeGenericContent <sidekick|main>`
  - Remove specific content from a type: `/removeGenericContent <sidekick|main> <ID>`
- **Note:** Use double quotes (`"`) if the ID contains spaces.
- **Examples:**
  - `/removeGenericContent teste` - Removes content with ID `teste` from any area
  - `/removeGenericContent sidekick` - Removes all injected sidekicks
  - `/removeGenericContent main` - Removes all injected main contents
  - `/removeGenericContent sidekick teste` - Removes sidekick with ID `teste`
  - `/removeGenericContent main "my dashboard"` - Removes main content with ID `my dashboard`
  - `/removeGenericContent "tool1"` - Removes content with ID `tool1` from any area (searches both sidekick and main)
- **Related Commands:** Use `/listGenericContent` to view all available content IDs and types before removing.
- **Restrictions:** None.

### `/record`
- **Description:** Records what you see and/or hear via the browser's screen share (`getDisplayMedia`) and downloads the result to your device. `video` records the shared screen with its audio and downloads a `.webm` file; `audio` records only the shared audio and downloads it as an `.mp3` file (converted in the browser after recording). The optional `mic` flag additionally captures and mixes in your microphone.
- **Usage:** `/record <audio|video> [mic]`
- **Examples:**
  - `/record video` - Records the shared screen with its audio
  - `/record audio` - Records only the shared tab/screen audio
  - `/record audio mic` - Same as above, plus your microphone mixed in
- **Note:** Browsers require a screen/tab/window to be selected even for `audio` mode — audio-only capture isn't supported by the Screen Capture API. For `audio` mode, make sure to check "Share tab audio" (or your browser's equivalent) in the picker, otherwise the recording will be rejected for having no audio track.
- **Disclaimer:** The `mic` flag captures your system's **default** microphone via `getUserMedia` — it is a separate capture, not a tap into the audio the conference is actually sending. If you use more than one microphone and the conference isn't using your OS default input device, `/record` will pick up the wrong one. Double-check your default input device before relying on this to capture your voice. Only use `mic` when you know the conference itself is using your default microphone.
- **Stopping:** Click "Stop sharing" in your browser's sharing indicator — the recording is finalized and downloaded automatically. There is no `/stopRecord` command.
- **Restrictions:** Only one recording can be active at a time. Requires a browser that supports `getDisplayMedia` and `MediaRecorder`. The `mic` option additionally requires `getUserMedia` support and microphone permission.

## UI Control Commands

These commands control the BigBlueButton user interface elements and settings.

### UI Element Visibility

#### `/showActionsBar`
- **Description:** Show the actions bar (bottom toolbar with action buttons).
- **Usage:** Type `/showActionsBar` in the chat.
- **Restrictions:** None.

#### `/hideActionsBar`
- **Description:** Hide the actions bar (bottom toolbar with action buttons).
- **Usage:** Type `/hideActionsBar` in the chat.
- **Restrictions:** None.

#### `/showNavBar`
- **Description:** Show the navigation bar (top navigation menu).
- **Usage:** Type `/showNavBar` in the chat.
- **Restrictions:** None.

#### `/hideNavBar`
- **Description:** Hide the navigation bar (top navigation menu).
- **Usage:** Type `/hideNavBar` in the chat.
- **Restrictions:** None.

### Presentation and Sidekick Areas

#### `/openPresentation`
- **Description:** Open the presentation area (display slides or screen share).
- **Usage:** Type `/openPresentation` in the chat.
- **Restrictions:** None.

#### `/closePresentation`
- **Description:** Close the presentation area.
- **Usage:** Type `/closePresentation` in the chat.
- **Restrictions:** None.

#### `/openSidekick`
- **Description:** Open the sidekick panel (right-side panel for notes and content).
- **Usage:** Type `/openSidekick` in the chat.
- **Related Commands:** Use `/injectSidekick` to inject content into the sidekick panel.
- **Restrictions:** None.

#### `/closeSidekick`
- **Description:** Close the sidekick panel.
- **Usage:** Type `/closeSidekick` in the chat.
- **Restrictions:** None.

### Camera and Self-View

#### `/enableSelfView`
- **Description:** Enable self-view display for all cameras (show local video feed).
- **Usage:** Type `/enableSelfView` in the chat.
- **Restrictions:** None.

#### `/disableSelfView`
- **Description:** Disable self-view display for all cameras (hide local video feed).
- **Usage:** Type `/disableSelfView` in the chat.
- **Restrictions:** None.

### Audio Settings

#### `/setCaptions`
- **Description:** Set audio captions/subtitles language for the meeting.
- **Usage:** `/setCaptions <language>`
- **Available Languages:**
  - `none` - Disable captions
  - `en` - English
  - `en-US` - English (US)
  - `es` - Spanish
  - `pt` - Portuguese
  - `pt-BR` - Portuguese (Brazil)
  - `fr` - French
  - `de` - German
- **Examples:**
  - `/setCaptions en` - Enable English captions
  - `/setCaptions pt-BR` - Enable Portuguese (Brazil) captions
  - `/setCaptions none` - Disable captions
- **Restrictions:** None.

#### `/setSpeakerLevel`
- **Description:** Set the volume level for conference speaker (audio output).
- **Usage:** `/setSpeakerLevel <0-1>`
- **Parameters:**
  - Level range: `0` (mute) to `1` (maximum volume)
  - Use decimals for precise levels (e.g., `0.5` for 50%)
- **Examples:**
  - `/setSpeakerLevel 1` - Maximum volume
  - `/setSpeakerLevel 0.5` - 50% volume
  - `/setSpeakerLevel 0` - Mute
- **Restrictions:** None.

#### `/setVideoVolume`
- **Description:** Set the volume level for external video (screen share or video content).
- **Usage:** `/setVideoVolume <0-1>`
- **Parameters:**
  - Level range: `0` (mute) to `1` (maximum volume)
  - Use decimals for precise levels (e.g., `0.5` for 50%)
- **Examples:**
  - `/setVideoVolume 1` - Maximum volume
  - `/setVideoVolume 0.5` - 50% volume
  - `/setVideoVolume 0` - Mute
- **Restrictions:** None.

### Notifications

#### `/notify`
- **Description:** Send a custom UI notification to the meeting participants.
- **Usage:** `/notify <type> <icon> <message>`
- **Notification Types:**
  - `info` - Information notification (blue)
  - `default` - Default notification
  - `warning` - Warning notification (yellow)
  - `success` - Success notification (green)
  - `error` - Error notification (red)
- **Icon Names:** Any FontAwesome icon name (e.g., `bell`, `check`, `exclamation`, `info-circle`)
- **Examples:**
  - `/notify success check "Setup completed successfully!"`
  - `/notify warning exclamation "Please check your microphone"`
  - `/notify error times "An error occurred"`
- **Restrictions:** None.

#### `/enableNotifications`
- **Description:** Enable UI notification display in the meeting.
- **Usage:** Type `/enableNotifications` in the chat.
- **Related Commands:** Use `/notify` to send notifications, or `/disableNotifications` to hide them.
- **Restrictions:** None.

#### `/disableNotifications`
- **Description:** Disable UI notification display in the meeting (notifications will not be shown).
- **Usage:** Type `/disableNotifications` in the chat.
- **Related Commands:** Use `/enableNotifications` to re-enable notifications.
- **Restrictions:** None.

### User Status and Layout

#### `/setAway`
- **Description:** Set your user status to "away" (indicates you are not actively participating).
- **Usage:** Type `/setAway` in the chat.
- **Related Commands:** Use `/setPresent` to return to active status.
- **Restrictions:** None.

#### `/setPresent`
- **Description:** Set your user status to "present" (indicates you are actively participating).
- **Usage:** Type `/setPresent` in the chat.
- **Related Commands:** Use `/setAway` to set away status.
- **Restrictions:** None.

#### `/setLayout`
- **Description:** Set the enforced layout for the meeting (controls how the UI elements are arranged).
- **Usage:** `/setLayout <layout_type>`
- **Available Layouts:**
  - `SMART_LAYOUT` - Automatically adjust layout based on content
  - `PRESENTATION_FOCUS` - Focus on presentation/screen share area
  - `VIDEO_FOCUS` - Focus on video participants
  - `CAMERAS_ONLY` - Show only camera feeds
  - `PRESENTATION_ONLY` - Show only presentation
  - `PARTICIPANTS_AND_CHAT_ONLY` - Show participants and chat
  - `MEDIA_ONLY` - Show only media
  - `CUSTOM_LAYOUT` - Custom layout configuration
  - `PLUGINS_ONLY` - Show only plugins
- **Examples:**
  - `/setLayout PRESENTATION_FOCUS` - Focus on presentation
  - `/setLayout VIDEO_FOCUS` - Focus on video participants
  - `/setLayout SMART_LAYOUT` - Automatic layout
- **Restrictions:** None.

### Chat Input Form

#### `/openChatForm`
- **Description:** Open the chat message input form.
- **Usage:** Type `/openChatForm` in the chat.
- **Related Commands:** Use `/fillChatForm` to pre-fill the input with text.
- **Restrictions:** None.

#### `/fillChatForm`
- **Description:** Pre-fill the chat input form with specified text (text is ready to send with Enter key).
- **Usage:** `/fillChatForm <text>`
- **Examples:**
  - `/fillChatForm Hello everyone!` - Pre-fill with greeting
  - `/fillChatForm This is a test message` - Pre-fill with test message
- **Related Commands:** Use `/openChatForm` to just open the input form.
- **Restrictions:** None.

## Description

This is an experimental internal plugin developed by mconf for BigBlueButton. Its main purpose is to allow the inclusion and execution of custom chat commands in meetings. The plugin is designed to be easily extensible, enabling developers to add new commands with minimal effort.

### Features
- Easily add new chat commands by extending the configuration.
- Commands can trigger custom mutations and actions in the meeting context.
- Support for injecting multiple generic content items to sidekick and main areas.
- Sidekick and main contents are managed separately - injecting content in one area does NOT affect the other.
- Generic content manager allows flexible management of both areas with unified list and remove operations.
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
