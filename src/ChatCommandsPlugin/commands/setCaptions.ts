import { pluginLogger, CaptionsLanguageEnum } from 'bigbluebutton-html-plugin-sdk';
import { CommandExecutor } from './types';

const LANGUAGE_MAP: Record<string, CaptionsLanguageEnum> = {
  none: CaptionsLanguageEnum.NONE,
  'en-US': CaptionsLanguageEnum.ENGLISH,
  en: CaptionsLanguageEnum.ENGLISH,
  'es-ES': CaptionsLanguageEnum.SPANISH,
  es: CaptionsLanguageEnum.SPANISH,
  'pt-PT': CaptionsLanguageEnum.PORTUGUESE,
  'pt-BR': CaptionsLanguageEnum.PORTUGUESE_BR,
  pt: CaptionsLanguageEnum.PORTUGUESE_BR,
  'fr-FR': CaptionsLanguageEnum.FRENCH,
  fr: CaptionsLanguageEnum.FRENCH,
  'de-DE': CaptionsLanguageEnum.GERMAN,
  de: CaptionsLanguageEnum.GERMAN,
};

export const setCaptionsCommandExecutor: CommandExecutor = ({ pluginApi, args }) => {
  const langArg = args?.[0] ?? 'none';
  const language = LANGUAGE_MAP[langArg];

  if (language === undefined) {
    const available = Object.keys(LANGUAGE_MAP).join(', ');
    pluginLogger.warn(`Unknown captions language: ${langArg}. Available: ${available}`);
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: `❌ **Unknown language**: \`${langArg}\`. Available options: ${available}`,
    });
    return;
  }

  pluginApi.uiCommands?.captions.setDisplayAudioCaptions({ displayAudioCaptions: language });
};
