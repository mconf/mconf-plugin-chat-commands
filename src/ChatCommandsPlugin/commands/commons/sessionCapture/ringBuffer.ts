import { BufferContents } from './types';

/**
 * Keeps the newest entries whose combined size fits the budget, dropping the
 * oldest ones first. Sizes are computed once on push.
 */
export class RingBuffer<T> {
  private entries: T[] = [];

  private sizes: number[] = [];

  // Evicted entries are skipped by advancing `start` instead of shifting the
  // array on every push, which would be O(n) on the console hot path.
  private start = 0;

  private totalSize = 0;

  private droppedCount = 0;

  private readonly budget: number;

  private readonly sizeOf: (entry: T) => number;

  constructor(budget: number, sizeOf: (entry: T) => number) {
    this.budget = budget;
    this.sizeOf = sizeOf;
  }

  push(entry: T): void {
    const size = this.sizeOf(entry);
    this.entries.push(entry);
    this.sizes.push(size);
    this.totalSize += size;

    while (this.totalSize > this.budget && this.entries.length - this.start > 1) {
      this.totalSize -= this.sizes[this.start];
      this.start += 1;
      this.droppedCount += 1;
    }

    if (this.start > 0 && this.start * 2 > this.entries.length) {
      this.entries = this.entries.slice(this.start);
      this.sizes = this.sizes.slice(this.start);
      this.start = 0;
    }
  }

  restore(contents: BufferContents<T>): void {
    contents.entries.forEach((entry) => this.push(entry));
    this.droppedCount += contents.droppedCount;
  }

  contents(): BufferContents<T> {
    return {
      entries: this.entries.slice(this.start),
      droppedCount: this.droppedCount,
    };
  }

  /**
   * The newest entries fitting `budget`. Entries left out are added to the
   * dropped count, since a reload loses them.
   */
  newestWithin(budget: number): BufferContents<T> {
    let used = 0;
    let first = this.entries.length;
    while (first > this.start && used + this.sizes[first - 1] <= budget) {
      used += this.sizes[first - 1];
      first -= 1;
    }
    return {
      entries: this.entries.slice(first),
      droppedCount: this.droppedCount + (first - this.start),
    };
  }
}
