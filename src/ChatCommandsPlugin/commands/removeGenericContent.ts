import { genericContentManager, ContentType } from './commons/genericContentManager';
import { CommandExecutor } from './types';

const parseContentType = (arg: string): ContentType | null => {
  const type = arg.toLowerCase();
  return type === 'sidekick' || type === 'main' ? type : null;
};

export const removeGenericContentCommandExecutor: CommandExecutor = ({ pluginApi, args }) => {
  if (!args || args.length === 0) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: '❌ Usage: `/removeGenericContent <ID>` or `/removeGenericContent <sidekick|main> [ID]`',
    });
    return;
  }

  const firstArgType = parseContentType(args[0]);
  const hasType = firstArgType !== null;

  if (hasType) {
    // First argument is a type (sidekick or main)
    if (args.length === 1) {
      // Remove all of this type
      const contents = genericContentManager.getAllContent(firstArgType);

      if (contents.length === 0) {
        pluginApi.serverCommands?.chat.sendPublicChatMessage({
          textMessageInMarkdownFormat: `ℹ️ No ${firstArgType} contents to remove.`,
        });
        return;
      }

      genericContentManager.removeAllContent(firstArgType);

      pluginApi.serverCommands?.chat.sendPublicChatMessage({
        textMessageInMarkdownFormat: `✅ Removed all ${contents.length} ${firstArgType} content(s).`,
      });
    } else {
      // Remove specific content by ID in this type
      const id = args.slice(1).join(' ').trim();

      if (genericContentManager.exists(firstArgType, id)) {
        genericContentManager.removeContent(firstArgType, id);

        pluginApi.serverCommands?.chat.sendPublicChatMessage({
          textMessageInMarkdownFormat: `✅ Removed ${firstArgType} content with ID: \`${id}\``,
        });
      } else {
        pluginApi.serverCommands?.chat.sendPublicChatMessage({
          textMessageInMarkdownFormat: `❌ ${firstArgType.charAt(0).toUpperCase() + firstArgType.slice(1)} content with ID \`${id}\` not found. Use \`/listGenericContent\` to see available contents.`,
        });
      }
    }
  } else {
    // First argument is an ID (not a type), search in all types
    const id = args.join(' ').trim();
    const result = genericContentManager.removeContentById(id);

    if (result) {
      pluginApi.serverCommands?.chat.sendPublicChatMessage({
        textMessageInMarkdownFormat: `✅ Removed ${result.type} content with ID: \`${id}\``,
      });
    } else {
      pluginApi.serverCommands?.chat.sendPublicChatMessage({
        textMessageInMarkdownFormat: `❌ Content with ID \`${id}\` not found in any area. Use \`/listGenericContent\` to see available contents.`,
      });
    }
  }
};
