import * as lamejs from '@breezystack/lamejs';

const MP3_BITRATE_KBPS = 128;
// lamejs requires PCM fed in fixed-size blocks; this is its documented frame size.
const MP3_BLOCK_SIZE = 1152;

const floatTo16BitPCM = (input: Float32Array): Int16Array => {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return output;
};

export const encodeToMp3 = async (blob: Blob): Promise<Blob> => {
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
  await audioContext.close();

  const channels = Math.min(audioBuffer.numberOfChannels, 2);
  const encoder = new lamejs.Mp3Encoder(channels, audioBuffer.sampleRate, MP3_BITRATE_KBPS);
  const left = floatTo16BitPCM(audioBuffer.getChannelData(0));
  const right = channels === 2 ? floatTo16BitPCM(audioBuffer.getChannelData(1)) : undefined;

  const mp3Chunks: BlobPart[] = [];
  for (let i = 0; i < left.length; i += MP3_BLOCK_SIZE) {
    const leftChunk = left.subarray(i, i + MP3_BLOCK_SIZE);
    const rightChunk = right?.subarray(i, i + MP3_BLOCK_SIZE);
    const mp3buf = rightChunk
      ? encoder.encodeBuffer(leftChunk, rightChunk)
      : encoder.encodeBuffer(leftChunk);
    if (mp3buf.length > 0) {
      // lamejs's types don't pin the Uint8Array's backing buffer to ArrayBuffer,
      // which BlobPart requires - copy into one that does.
      mp3Chunks.push(new Uint8Array(mp3buf));
    }
  }

  const finalChunk = encoder.flush();
  if (finalChunk.length > 0) {
    mp3Chunks.push(new Uint8Array(finalChunk));
  }

  return new Blob(mp3Chunks, { type: 'audio/mpeg' });
};
