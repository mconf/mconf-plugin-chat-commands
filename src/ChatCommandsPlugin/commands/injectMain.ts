import React from 'react';
import ReactDOM from 'react-dom/client';
import { GenericContentMainArea } from 'bigbluebutton-html-plugin-sdk';
import { genericContentManager } from './commons/genericContentManager';
import { CommandExecutor } from './types';

interface GenericContentAttributes {
  id: string;
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

const parseAttributes = (args: string[]):
{ attrs: GenericContentAttributes; contentStart: number } => {
  const attrs: GenericContentAttributes = {
    id: `generic-main-${Date.now()}`,
  };

  let i = 0;

  if (args[i] === '--id') {
    const { value, nextIdx } = getQuotedValue(args, i + 1);
    if (value) {
      attrs.id = value;
      i = nextIdx;
    }
  }

  return { attrs, contentStart: i };
};

export const injectMainCommandExecutor: CommandExecutor = ({ pluginApi, args }) => {
  if (!args || args.length === 0) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: '❌ Usage: `/injectMain [--id ID] <url or html-content>`',
    });
    return;
  }

  // Ensure pluginApi reference is set in manager
  genericContentManager.setPluginApi(pluginApi);

  const { attrs, contentStart } = parseAttributes(args);
  const content = args.slice(contentStart).join(' ').trim();

  if (!content) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: '❌ No content provided. Usage: `/injectMain [--id ID] <url or html-content>`',
    });
    return;
  }

  try {
    const isUrl = /^https?:\/\//.test(content);

    const genericContent = new GenericContentMainArea({
      id: attrs.id,
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
    const mainName = `Main Content (${attrs.id})`;
    genericContentManager.addContent('main', genericContent.id, mainName, genericContent);

    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `✅ Content injected to main area (ID: ${attrs.id}) ${isUrl ? '(URL)' : '(HTML)'}`,
    });
  } catch (error) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `❌ Failed to inject content to main area: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
};
