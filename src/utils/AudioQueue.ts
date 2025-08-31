export class AudioQueue {
  private queue: ArrayBuffer[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(data: ArrayBuffer | Uint8Array) {
    const buffer = data instanceof Uint8Array ? data.buffer as ArrayBuffer : data;
    this.queue.push(buffer);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  clearQueue() {
    this.queue = [];
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const buf = this.queue.shift()!;

    try {
      // Attempt to decode as audio file (WAV/PCM). If decodeAudioData fails,
      // we gracefully ignore playback for this item.
      const audioBuffer = await this.audioContext.decodeAudioData(buf.slice(0));
      const src = this.audioContext.createBufferSource();
      src.buffer = audioBuffer;
      src.connect(this.audioContext.destination);
      src.onended = () => {
        // continue to next in queue
        this.playNext().catch((e) => {
          console.warn('AudioQueue playNext error', e);
          this.isPlaying = false;
        });
      };
      src.start();
    } catch (err) {
      // If decoding fails, log and continue
      console.warn('AudioQueue: failed to decode audio, skipping. Error:', err);
      // small delay to avoid tight loop
      setTimeout(() => {
        this.playNext().catch(e => console.warn('AudioQueue continuation error', e));
      }, 50);
    }
  }
}
