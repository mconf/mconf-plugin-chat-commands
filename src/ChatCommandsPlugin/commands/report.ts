import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { strToU8, zipSync, Zippable } from 'fflate';
import { CommandExecutor } from './types';
import { getSessionCapture, ConsoleEntry, TimelineEvent } from './commons/sessionCapture';
import { collectSettingsSnapshot, collectStateSnapshot } from './commons/stateSnapshot';
import { captureScreenshot } from './commons/screenshot';
import { triggerDownload } from './commons/download';
import { createMasker } from './commons/mask';
import { getSdkState } from './commons/sdkStateStore';
import { getLoadedPlugins } from './commons/loadedPlugins';
import { buildMarkdownReport } from './commons/reportOutput/markdownReport';
import { buildPerfettoTrace } from './commons/reportOutput/perfettoTrace';
import { resolveDeviceLabels } from './commons/reportOutput/deviceLabels';

const MASK_FLAG = '--mask';
const USAGE = `❌ **Usage**: \`/report [${MASK_FLAG}]\` — add \`${MASK_FLAG}\` to hide tokens, names and chat drafts.`;
const LEVEL_COLUMN_WIDTH = 18;

let reportInProgress = false;

const formatConsoleLog = (entries: ConsoleEntry[]): string => entries
  .map((entry) => {
    const level = `[${entry.level.toUpperCase()}]`.padEnd(LEVEL_COLUMN_WIDTH);
    return `${new Date(entry.time).toISOString()} ${level} ${entry.text}`;
  })
  .join('\n');

const withIsoTime = (events: TimelineEvent[]) => events
  .map((event) => ({ at: new Date(event.time).toISOString(), ...event }));

const readClientSessionUUID = (): string | null => {
  try {
    return window.sessionStorage.getItem('clientSessionUUID');
  } catch (error) {
    return null;
  }
};

export const reportCommandExecutor: CommandExecutor = async ({
  pluginApi,
  currentUser,
  meeting,
  users,
  args = [],
}) => {
  const sendMessage = (textMessageInMarkdownFormat: string) => {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({ textMessageInMarkdownFormat });
  };

  const unknownArgs = args.filter((arg) => arg !== '' && arg !== MASK_FLAG);
  if (unknownArgs.length > 0) {
    sendMessage(USAGE);
    return;
  }

  if (reportInProgress) {
    sendMessage('❌ A report is already being generated. Wait for it to download before requesting another one.');
    return;
  }
  reportInProgress = true;

  try {
    const mask = args.includes(MASK_FLAG);
    const generatedAt = new Date();

    // Frozen before the screen-capture prompt, so clicks on the prompt itself
    // don't end up in the report.
    const capture = getSessionCapture().snapshot();
    const tracked = getSdkState();
    const plugins = getLoadedPlugins();
    const settings = collectSettingsSnapshot(tracked.clientSettings);
    const state = collectStateSnapshot({
      currentUser,
      meeting,
      users,
      settings,
      includeApolloCache: !mask,
    });
    const meta = {
      generatedAt: generatedAt.toISOString(),
      captureStartedAt: new Date(capture.captureStartedAt).toISOString(),
      pageLoads: capture.pageLoads,
      masked: mask,
      url: window.location.href,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      screen: { width: window.screen.width, height: window.screen.height },
      online: navigator.onLine,
      clientSessionUUID: readClientSessionUUID(),
      console: {
        entries: capture.console.entries.length,
        dropped: capture.console.droppedCount,
      },
      timeline: {
        entries: capture.timeline.entries.length,
        dropped: capture.timeline.droppedCount,
      },
      notes: [
        'Capture starts when the plugin loads: logs printed by the client before that are not included.',
        'Browser-internal messages that never go through console.* are not included '
          + '(e.g. network errors shown only by DevTools).',
      ],
    };

    const deviceLabels = await resolveDeviceLabels(settings.current);
    const screenshot = await captureScreenshot();
    const screenshotNote = screenshot.png
      ? 'Included (`screenshot.png`)'
      : `Not captured: ${screenshot.failureReason}`;

    const masker = mask ? createMasker(currentUser, meeting, users) : null;
    const timeline = masker
      ? masker.maskTimeline(capture.timeline.entries)
      : capture.timeline.entries;
    if (masker) {
      const storage = state.storage as Record<string, Record<string, unknown>>;
      storage.local = masker.maskStorageDump(storage.local);
      storage.session = masker.maskStorageDump(storage.session);
    }
    const finalizeText = (text: string) => (masker ? masker.maskText(text) : text);

    const maskedCapture = { ...capture, timeline: { ...capture.timeline, entries: timeline } };
    const report = buildMarkdownReport({
      generatedAt: generatedAt.getTime(),
      capture: maskedCapture,
      settings,
      deviceLabels,
      currentUser,
      meeting,
      tracked,
      screenshotNote,
      plugins,
    });
    const details = {
      meta: { ...meta, screenshot: screenshotNote },
      state,
      plugins,
      timeline: withIsoTime(timeline),
    };

    const files: Zippable = {
      'report.md': strToU8(finalizeText(report)),
      'console.log': strToU8(finalizeText(formatConsoleLog(capture.console.entries))),
      'trace.json': strToU8(finalizeText(buildPerfettoTrace(maskedCapture, generatedAt.getTime()))),
      'details.json': strToU8(finalizeText(JSON.stringify(details, null, 2))),
    };
    if (screenshot.png) {
      // PNG is already compressed; deflating it again only costs time.
      files['screenshot.png'] = [screenshot.png, { level: 0 }];
    }

    const timestamp = generatedAt.toISOString().replace(/[:.]/g, '-');
    const filename = `report-${timestamp}.zip`;
    const zipped = zipSync(files) as BlobPart;
    triggerDownload(new Blob([zipped], { type: 'application/zip' }), filename);

    const screenshotWarning = screenshot.png ? '' : ` Screenshot not included: ${screenshot.failureReason}.`;
    sendMessage(`✅ Report saved as \`${filename}\`${mask ? ' (masked)' : ''}. Start with \`report.md\`.${screenshotWarning}`);
  } catch (error) {
    pluginLogger.error('Failed to generate /report', { error });
    sendMessage('❌ Failed to generate the report. Check the browser console for details.');
  } finally {
    reportInProgress = false;
  }
};
