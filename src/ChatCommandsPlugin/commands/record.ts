import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { CommandExecutor } from './types';
import { isRecordingActive, setRecordingActive } from './commons/recordingController';
import { AudioMix, mixAudioTracks } from './commons/audioMixer';
import { encodeToMp3 } from './commons/mp3Encoder';

type RecordMode = 'audio' | 'video';

// Chrome's picker hides the current tab from the "Chrome Tab" list unless this
// is set - without it, users can't select the conference tab to record it.
interface DisplayMediaStreamOptionsWithSelfCapture extends DisplayMediaStreamOptions {
  selfBrowserSurface?: 'include' | 'exclude';
}

const pickMimeType = (mode: RecordMode): string | undefined => {
  const candidates = mode === 'video'
    ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    : ['audio/webm;codecs=opus', 'audio/webm'];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
};

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export const recordCommandExecutor: CommandExecutor = async ({ pluginApi, args }) => {
  const modeArg = args?.[0]?.toLowerCase();
  const optionArg = args?.[1]?.toLowerCase();

  if (modeArg !== 'audio' && modeArg !== 'video') {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: '❌ **Usage**: `/record <audio|video> [mic]`',
    });
    return;
  }

  if (optionArg !== undefined && optionArg !== 'mic') {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: '❌ **Usage**: `/record <audio|video> [mic]` — add `mic` to also capture your microphone audio.',
    });
    return;
  }

  const includeMic = optionArg === 'mic';

  if (isRecordingActive()) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: '❌ A recording is already in progress. Click **Stop sharing** in your browser to finish it before starting a new one.',
    });
    return;
  }

  if (
    typeof MediaRecorder === 'undefined'
    || !navigator.mediaDevices?.getDisplayMedia
    || (includeMic && !navigator.mediaDevices?.getUserMedia)
  ) {
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: '❌ Recording is not supported in this browser.',
    });
    return;
  }

  const mode: RecordMode = modeArg;

  const abort = (
    message: string,
    stream?: MediaStream,
    micStream?: MediaStream,
    audioMix?: AudioMix,
  ) => {
    stream?.getTracks().forEach((track) => track.stop());
    micStream?.getTracks().forEach((track) => track.stop());
    audioMix?.close();
    setRecordingActive(false);
    pluginApi.serverCommands?.chat.sendPublicChatMessage({ textMessageInMarkdownFormat: message });
  };

  setRecordingActive(true);

  let stream: MediaStream;
  try {
    // Browsers require video to be requested even for audio-only capture -
    // there is no audio-only getDisplayMedia mode in the spec.
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
      selfBrowserSurface: 'include',
    } as DisplayMediaStreamOptionsWithSelfCapture);
  } catch (error) {
    pluginLogger.warn('getDisplayMedia failed for /record command', { error });
    setRecordingActive(false);
    pluginApi.serverCommands?.chat.sendPublicChatMessage({
      textMessageInMarkdownFormat: '❌ Screen capture was cancelled or denied.',
    });
    return;
  }

  const videoTrack = stream.getVideoTracks()[0];
  const audioTracks = stream.getAudioTracks();

  if (mode === 'audio' && audioTracks.length === 0) {
    abort(
      '❌ No audio track was shared. When the picker opens, make sure to check **"Share tab audio"** (or your browser\'s equivalent) — audio-only capture isn\'t supported by browsers, so a screen/tab must still be selected.',
      stream,
    );
    return;
  }

  const mimeType = pickMimeType(mode);
  if (!mimeType) {
    abort('❌ Your browser does not support recording this media type.', stream);
    return;
  }

  let micStream: MediaStream | undefined;
  if (includeMic) {
    try {
      // A fresh capture of the physical mic input, independent of the stream
      // the conference itself is sending - there's no way to tap into that one.
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      pluginLogger.warn('getUserMedia failed for /record command mic option', { error });
      abort('❌ Microphone permission was denied or cancelled. Recording was not started.', stream);
      return;
    }
  }

  let audioMix: AudioMix | undefined;
  let recordStream: MediaStream;
  if (micStream) {
    audioMix = mixAudioTracks([...audioTracks, micStream.getAudioTracks()[0]]);
    recordStream = mode === 'audio'
      ? new MediaStream([audioMix.track])
      : new MediaStream([videoTrack, audioMix.track]);
  } else {
    recordStream = mode === 'audio' ? new MediaStream(audioTracks) : stream;
  }

  const recorder = new MediaRecorder(recordStream, { mimeType });
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  recorder.onstop = () => {
    stream.getTracks().forEach((track) => track.stop());
    micStream?.getTracks().forEach((track) => track.stop());
    audioMix?.close();
    setRecordingActive(false);

    const blob = new Blob(chunks, { type: mimeType });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (mode !== 'audio') {
      const filename = `video-recording-${timestamp}.webm`;
      triggerDownload(blob, filename);
      pluginApi.serverCommands?.chat.sendPublicChatMessage({
        textMessageInMarkdownFormat: `✅ Recording saved as \`${filename}\` and downloaded to your device.`,
      });
      return;
    }

    encodeToMp3(blob)
      .then((mp3Blob) => {
        const filename = `audio-recording-${timestamp}.mp3`;
        triggerDownload(mp3Blob, filename);
        pluginApi.serverCommands?.chat.sendPublicChatMessage({
          textMessageInMarkdownFormat: `✅ Recording saved as \`${filename}\` and downloaded to your device.`,
        });
      })
      .catch((error) => {
        pluginLogger.warn('MP3 conversion failed for /record command', { error });
        const filename = `audio-recording-${timestamp}.webm`;
        triggerDownload(blob, filename);
        pluginApi.serverCommands?.chat.sendPublicChatMessage({
          textMessageInMarkdownFormat: `⚠️ Could not convert the recording to MP3, downloaded as \`${filename}\` instead.`,
        });
      });
  };

  videoTrack.addEventListener('ended', () => {
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
  });

  recorder.start();

  const micNote = includeMic
    ? ', including your microphone (your system\'s default input device — it may not be the one selected in the conference)'
    : '';
  pluginApi.serverCommands?.chat.sendPublicChatMessage({
    textMessageInMarkdownFormat: `🔴 Recording ${mode} started${micNote}. Click **Stop sharing** in your browser's sharing indicator to finish and download it.`,
  });
};
