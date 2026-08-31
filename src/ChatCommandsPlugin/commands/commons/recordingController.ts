// Tracks whether a /record capture is currently in progress, to prevent overlapping recordings.
let activeRecording = false;

export const isRecordingActive = (): boolean => activeRecording;

export const setRecordingActive = (value: boolean): void => {
  activeRecording = value;
};
