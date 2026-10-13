// Lets Chrome's "share this tab" bubble fade out before the frame is grabbed.
const SETTLE_DELAY_MS = 500;

// Chrome-only hints, not yet in the DOM typings: preferCurrentTab offers the
// current tab directly and selfBrowserSurface keeps it selectable.
interface CurrentTabDisplayMediaOptions extends DisplayMediaStreamOptions {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: 'include' | 'exclude';
}

export interface ScreenshotResult {
  png: Uint8Array | null;
  failureReason: string | null;
}

const failed = (failureReason: string): ScreenshotResult => ({ png: null, failureReason });

const wait = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

const grabFrame = async (stream: MediaStream): Promise<Blob> => {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  await video.play();
  await wait(SETTLE_DELAY_MS);

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')?.drawImage(video, 0, 0);
  video.srcObject = null;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas produced no image'))), 'image/png');
  });
};

export const captureScreenshot = async (): Promise<ScreenshotResult> => {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    return failed('screen capture is not supported in this browser');
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
    } as CurrentTabDisplayMediaOptions);
  } catch (error) {
    return failed('screen capture was cancelled or denied');
  }

  try {
    const blob = await grabFrame(stream);
    return { png: new Uint8Array(await blob.arrayBuffer()), failureReason: null };
  } catch (error) {
    return failed(error instanceof Error ? error.message : String(error));
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
};
