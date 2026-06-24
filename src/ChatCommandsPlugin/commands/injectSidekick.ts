import React from 'react';
import ReactDOM from 'react-dom/client';
import { GenericContentSidekickArea } from 'bigbluebutton-html-plugin-sdk';
import { genericContentManager } from './commons/genericContentManager';
import { CommandExecutor } from './types';

interface GenericContentAttributes {
  id: string;
  name: string;
  section: string;
  buttonIcon: string;
  open: boolean;
}

const getQuotedValue = (args: string[], startIdx: number): { value: string; nextIdx: number } => {
  if (startIdx >= args.length) {
    return { value: '', nextIdx: startIdx };
  }

  const firstArg = args[startIdx];

  // Check if value starts with quote
  if (firstArg.startsWith('"')) {
    // If it starts and ends with quote on the same arg, return it
    if (firstArg.endsWith('"') && firstArg.length > 1) {
      return { value: firstArg.slice(1, -1), nextIdx: startIdx + 1 };
    }

    // Otherwise, collect args until we find the closing quote
    let value = firstArg.slice(1); // Remove opening quote
    let idx = startIdx + 1;

    while (idx < args.length) {
      const arg = args[idx];
      if (arg.endsWith('"')) {
        value += ` ${arg.slice(0, -1)}`; // Add content without closing quote
        return { value, nextIdx: idx + 1 };
      }
      value += ` ${arg}`;
      idx += 1;
    }

    // If we reach here, quote was never closed, return what we have
    return { value, nextIdx: idx };
  }

  // If no quotes, just return the single arg
  return { value: firstArg, nextIdx: startIdx + 1 };
};

const parseAttributes = (args: string[]): {
  attrs: Partial<GenericContentAttributes>; contentStart: number } => {
  const attrs: Partial<GenericContentAttributes> = {
    id: `generic-sidekick-${Date.now()}`,
    name: 'Generic Content',
    section: 'Custom',
    buttonIcon: 'copy',
    open: false,
  };

  let i = 0;

  while (i < args.length) {
    if (args[i] === '--id') {
      const { value, nextIdx } = getQuotedValue(args, i + 1);
      if (value) {
        attrs.id = value;
        i = nextIdx;
      } else {
        break;
      }
    } else if (args[i] === '--name') {
      const { value, nextIdx } = getQuotedValue(args, i + 1);
      if (value) {
        attrs.name = value;
        i = nextIdx;
      } else {
        break;
      }
    } else if (args[i] === '--section') {
      const { value, nextIdx } = getQuotedValue(args, i + 1);
      if (value) {
        attrs.section = value;
        i = nextIdx;
      } else {
        break;
      }
    } else if (args[i] === '--icon') {
      const { value, nextIdx } = getQuotedValue(args, i + 1);
      if (value) {
        attrs.buttonIcon = value;
        i = nextIdx;
      } else {
        break;
      }
    } else if (args[i] === '--open') {
      const { value, nextIdx } = getQuotedValue(args, i + 1);
      if (value) {
        attrs.open = value.toLowerCase() === 'true';
        i = nextIdx;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return { attrs, contentStart: i };
};

export const injectSidekickCommandExecutor: CommandExecutor = ({ pluginApi, args }) => {
  if (!args || args.length === 0) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: '❌ Usage: `/injectSidekick [--id ID] [--name NAME] [--section SECTION] [--icon ICON] [--open true|false] <url or html-content>`',
    });
    return;
  }

  // Ensure pluginApi reference is set in manager
  genericContentManager.setPluginApi(pluginApi);

  const { attrs, contentStart } = parseAttributes(args);
  const content = args.slice(contentStart).join(' ').trim();

  if (!content) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: '❌ No content provided. Usage: `/injectSidekick [--id ID] [--name NAME] [--section SECTION] [--icon ICON] [--open true|false] <url or html-content>`',
    });
    return;
  }

  try {
    const isUrl = /^https?:\/\//.test(content);

    const genericContent = new GenericContentSidekickArea({
      id: attrs.id,
      name: attrs.name ?? 'Generic Content Injected By Chat Commands Plugin',
      section: attrs.section ?? 'Chat Commands Plugin',
      buttonIcon: attrs.buttonIcon ?? 'copy',
      open: attrs.open ?? false,
      contentFunction: (element: HTMLElement) => {
        const root = ReactDOM.createRoot(element);

        if (isUrl) {
          root.render(
            React.createElement('iframe', {
              src: content,
              style: {
                width: '100%',
                height: '100%',
                border: 'none',
              },
            }),
          );
        } else {
          root.render(
            React.createElement('div', {
              dangerouslySetInnerHTML: { __html: content },
              style: {
                width: '100%',
                height: '100%',
                overflow: 'auto',
              },
            }),
          );
        }

        return root;
      },
    });

    // Add to manager (this will automatically update display)
    genericContentManager.addContent('sidekick', genericContent.id, genericContent.name, genericContent);

    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `✅ Content injected to sidekick "${attrs.name}" (ID: ${attrs.id}) ${isUrl ? '(URL)' : '(HTML)'}`,
    });
  } catch (error) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `❌ Failed to inject content to sidekick: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
};
