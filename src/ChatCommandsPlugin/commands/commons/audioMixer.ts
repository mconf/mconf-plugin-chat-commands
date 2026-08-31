export interface AudioMix {
  track: MediaStreamTrack;
  close: () => void;
}

export const mixAudioTracks = (tracks: MediaStreamTrack[]): AudioMix => {
  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();

  tracks.forEach((track) => {
    const source = audioContext.createMediaStreamSource(new MediaStream([track]));
    source.connect(destination);
  });

  return {
    track: destination.stream.getAudioTracks()[0],
    close: () => { audioContext.close(); },
  };
};
