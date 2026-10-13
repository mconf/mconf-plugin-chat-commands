export interface SettingRow {
  category: string;
  key: string;
  label: string;
}

export interface SettingsTab {
  title: string;
  rows: SettingRow[];
}

export interface NotificationRow {
  label: string;
  audioKey: string;
  pushKey?: string;
}

const row = (category: string, key: string, label: string): SettingRow => ({
  category,
  key,
  label,
});

// Mirrors the tabs of the client's Settings modal (plus the layout picker),
// with the label each option has there.
export const SETTINGS_TABS: SettingsTab[] = [
  {
    title: 'Application',
    rows: [
      row('application', 'darkTheme', 'Dark mode'),
      row('application', 'animations', 'Animations'),
      row('application', 'fontSize', 'Font size'),
      row('application', 'locale', 'Language'),
      row('application', 'selfViewDisable', 'Self view disabled'),
      row('application', 'paginationEnabled', 'Webcam pagination'),
      row('application', 'pushToTalkEnabled', 'Push to talk'),
      row('application', 'wakeLock', 'Wake lock'),
      row('application', 'whiteboardToolbarAutoHide', 'Auto-hide whiteboard toolbar'),
      row('application', 'autoCloseReactionsBar', 'Auto-close reactions bar'),
      row('application', 'recordingIndicatorAutoCollapse', 'Collapse recording indicator'),
    ],
  },
  {
    title: 'Layout',
    rows: [
      row('layout', 'selectedLayout', 'Layout'),
      row('layout', 'pushLayout', 'Push layout to everyone'),
    ],
  },
  {
    title: 'Audio',
    rows: [
      row('audio', 'processingMode', 'Audio processing'),
      row('audio', 'inputDeviceId', 'Microphone'),
      row('audio', 'outputDeviceId', 'Speaker'),
      row('application', 'microphoneConstraints', 'Microphone constraints'),
    ],
  },
  {
    title: 'Data saving',
    rows: [
      row('dataSaving', 'viewParticipantsWebcams', 'Show participants\' webcams'),
      row('dataSaving', 'viewScreenshare', 'Show screen share'),
    ],
  },
  {
    title: 'Transcription',
    rows: [
      row('transcription', 'partialUtterances', 'Partial utterances'),
      row('transcription', 'minUtteranceLength', 'Minimum utterance length (s)'),
    ],
  },
];

export const NOTIFICATION_CATEGORY = 'application';

export const NOTIFICATION_ROWS: NotificationRow[] = [
  { label: 'Chat message', audioKey: 'chatAudioAlerts', pushKey: 'chatPushAlerts' },
  { label: 'User joins', audioKey: 'userJoinAudioAlerts', pushKey: 'userJoinPushAlerts' },
  { label: 'User leaves', audioKey: 'userLeaveAudioAlerts', pushKey: 'userLeavePushAlerts' },
  { label: 'Raised hand', audioKey: 'raiseHandAudioAlerts', pushKey: 'raiseHandPushAlerts' },
  { label: 'Guest waiting', audioKey: 'guestWaitingAudioAlerts', pushKey: 'guestWaitingPushAlerts' },
  { label: 'Mute / unmute', audioKey: 'muteUnmuteAudioAlerts' },
];

export const LAYOUT_LABELS: Record<string, string> = {
  unified: 'Unified',
  camerasOnly: 'Cameras only',
  presentationOnly: 'Presentation only',
  participantsAndChatOnly: 'Participants and chat only',
  pluginsOnly: 'Plugins only',
  mediaOnly: 'Media only',
};

export const MAIN_AREA_LABELS: Record<string, string> = {
  WHITEBOARD: 'Whiteboard',
  SCREEN_SHARE: 'Screen share',
  EXTERNAL_VIDEO: 'External video',
  PINNED_SHARED_NOTES: 'Shared notes',
  GENERIC_CONTENT: 'Plugin content',
};

export const settingLabel = (category: string, key: string): string => {
  const known = SETTINGS_TABS
    .reduce<SettingRow[]>((rows, tab) => rows.concat(tab.rows), [])
    .find((setting) => setting.category === category && setting.key === key);
  if (known) return known.label;
  const notification = NOTIFICATION_ROWS
    .find((entry) => entry.audioKey === key || entry.pushKey === key);
  if (notification) return `${notification.label} ${notification.audioKey === key ? 'sound' : 'popup'}`;
  return `${category}.${key}`;
};
