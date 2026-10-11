/**
 * 원형 버퍼(circular buffer) 기반 Queue / Deque.
 *
 * - 배열 하나(buffer)와 두 개의 정보(head, count)만으로 큐를 표현한다.
 * - head: 첫 번째 원소의 인덱스, count: 현재 원소 수.
 * - 논리 인덱스 i 의 실제 위치는 (head + i) % capacity.
 * - 가득 차면 용량을 2배로 늘리고 원소를 논리 순서대로 새 배열 앞쪽에 복사한다(resize).
 */

const DEFAULT_CAPACITY = 4;

/** Queue 와 Deque 가 공유하는 원형 버퍼 구현 (내부용, export 하지 않음). */
class CircularBuffer<T> {
  protected buffer: (T | undefined)[];
  protected head = 0;
  protected count = 0;

  constructor(initialCapacity: number = DEFAULT_CAPACITY) {
    if (!Number.isInteger(initialCapacity) || initialCapacity < 1) {
      throw new RangeError("initialCapacity는 1 이상의 정수여야 합니다.");
    }
    this.buffer = new Array<T | undefined>(initialCapacity);
  }

  /** 현재 원소 수 */
  get size(): number {
    return this.count;
  }

  /** 현재 버퍼 용량 (테스트/학습용으로 공개) */
  get capacity(): number {
    return this.buffer.length;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  clear(): void {
    this.buffer = new Array<T | undefined>(DEFAULT_CAPACITY);
    this.head = 0;
    this.count = 0;
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      result.push(this.at(i));
    }
    return result;
  }

  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this.count; i++) {
      yield this.at(i);
    }
  }

  /** 논리 인덱스(앞에서 i번째)의 원소. 범위 검사는 호출자 책임. */
  protected at(i: number): T {
    return this.buffer[(this.head + i) % this.buffer.length] as T;
  }

  /** 뒤에 추가 */
  protected addBack(value: T): void {
    this.ensureCapacity();
    this.buffer[(this.head + this.count) % this.buffer.length] = value;
    this.count++;
  }

  /** 앞에 추가: head 를 한 칸 뒤로(원형) 옮긴 뒤 그 자리에 쓴다. */
  protected addFront(value: T): void {
    this.ensureCapacity();
    this.head = (this.head - 1 + this.buffer.length) % this.buffer.length;
    this.buffer[this.head] = value;
    this.count++;
  }

  /** 앞에서 제거. 비어 있으면 undefined. */
  protected removeFront(): T | undefined {
    if (this.count === 0) return undefined;
    const value = this.buffer[this.head] as T;
    this.buffer[this.head] = undefined; // 참조를 끊어 GC 가 회수하게 함
    this.head = (this.head + 1) % this.buffer.length;
    this.count--;
    return value;
  }

  /** 뒤에서 제거. 비어 있으면 undefined. */
  protected removeBack(): T | undefined {
    if (this.count === 0) return undefined;
    const idx = (this.head + this.count - 1) % this.buffer.length;
    const value = this.buffer[idx] as T;
    this.buffer[idx] = undefined;
    this.count--;
    return value;
  }

  protected peekAtFront(): T | undefined {
    return this.count === 0 ? undefined : this.at(0);
  }

  protected peekAtBack(): T | undefined {
    return this.count === 0 ? undefined : this.at(this.count - 1);
  }

  /** 가득 찼으면 용량 2배 확장. 논리 순서대로 복사하므로 head 는 0 으로 리셋된다. */
  private ensureCapacity(): void {
    if (this.count < this.buffer.length) return;
    const oldCap = this.buffer.length;
    const next = new Array<T | undefined>(oldCap * 2);
    for (let i = 0; i < this.count; i++) {
      next[i] = this.buffer[(this.head + i) % oldCap];
    }
    this.buffer = next;
    this.head = 0;
  }
}

/** FIFO 큐. 모든 핵심 연산이 (분할상환) O(1). */
export class Queue<T> extends CircularBuffer<T> {
  /** 뒤에 추가 */
  enqueue(value: T): void {
    this.addBack(value);
  }

  /** 앞에서 꺼냄. 비어 있으면 undefined */
  dequeue(): T | undefined {
    return this.removeFront();
  }

  /** 앞 원소를 제거하지 않고 확인. 비어 있으면 undefined */
  peek(): T | undefined {
    return this.peekAtFront();
  }
}

/** 양방향 큐(double-ended queue). 양끝 삽입/삭제가 모두 (분할상환) O(1). */
export class Deque<T> extends CircularBuffer<T> {
  pushFront(value: T): void {
    this.addFront(value);
  }

  pushBack(value: T): void {
    this.addBack(value);
  }

  popFront(): T | undefined {
    return this.removeFront();
  }

  popBack(): T | undefined {
    return this.removeBack();
  }

  peekFront(): T | undefined {
    return this.peekAtFront();
  }

  peekBack(): T | undefined {
    return this.peekAtBack();
  }

  /** 앞에서 index번째 원소 (범위 밖이면 undefined) */
  get(index: number): T | undefined {
    if (!Number.isInteger(index) || index < 0 || index >= this.count) return undefined;
    return this.at(index);
  }
}
