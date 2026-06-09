import { genericContentManager, ContentType } from './commons/genericContentManager';
import { CommandExecutor } from './types';

export const listGenericContentCommandExecutor: CommandExecutor = ({ pluginApi, args }) => {
  const types: ContentType[] = [];

  if (!args || args.length === 0) {
    types.push('sidekick', 'main');
  } else {
    const type = args[0].toLowerCase();
    if (type === 'sidekick' || type === 'main') {
      types.push(type);
    } else {
      pluginApi.serverCommands?.chat.sendPublicChatMessage({
        textMessageInMarkdownFormat: '❌ Usage: `/listGenericContent` or `/listGenericContent <sidekick|main>`',
      });
      return;
    }
  }

  const messageParts = types.map((type) => {
    const contents = genericContentManager.getAllContent(type);

    if (contents.length === 0) {
      return `\n\nℹ️ No ${type} contents currently injected.`;
    }

    const list = contents
      .map((item, idx) => `${idx + 1}. **${item.name}** (ID: \`${item.id}\`)`)
      .join('\n');
    return `\n\n**${type.charAt(0).toUpperCase() + type.slice(1)} Contents:**\n${list}`;
  });

  const message = `${messageParts.join('\n\n')}\n\nUse \`/removeGenericContent <ID>\` to remove a specific item, or \`/removeGenericContent <type>\` to remove all.`;

  pluginApi.serverCommands?.chat.sendPublicChatMessage({
    textMessageInMarkdownFormat: message,
  });
};
