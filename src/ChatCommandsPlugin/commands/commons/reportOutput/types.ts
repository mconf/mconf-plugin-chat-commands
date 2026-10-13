import { CurrentUserData, Meeting } from 'bigbluebutton-html-plugin-sdk';
import { CaptureSnapshot } from '../sessionCapture';
import { SettingsSnapshot } from '../stateSnapshot';

export interface ReportStep {
  time: number;
  action: string;
  element: string;
  dataTest?: string;
}

export interface DeviceLabels {
  inputDeviceId?: string;
  outputDeviceId?: string;
}

export interface MarkdownReportInput {
  generatedAt: number;
  capture: CaptureSnapshot;
  settings: SettingsSnapshot;
  deviceLabels: DeviceLabels;
  currentUser: CurrentUserData;
  meeting: Meeting;
  tracked: Record<string, unknown>;
  screenshotNote: string;
}

export interface TraceEvent {
  name: string;
  ph: string;
  pid: number;
  tid?: number;
  ts?: number;
  dur?: number;
  s?: string;
  cat?: string;
  args?: Record<string, unknown>;
}
