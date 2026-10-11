/**
 * 배열 기반 스택 (LIFO: Last In, First Out).
 * 배열의 끝(마지막 인덱스)을 top으로 사용하므로 push/pop이 O(1)이다.
 */
export class Stack<T> {
  /** 내부 저장소. 인덱스 0이 bottom, 마지막 인덱스가 top. */
  private items: T[] = [];

  /** 저장된 원소의 개수 */
  get size(): number {
    return this.items.length;
  }

  /** top에 원소를 추가한다. */
  push(value: T): void {
    this.items.push(value);
  }

  /** top 원소를 제거하고 반환한다. 비어 있으면 undefined. */
  pop(): T | undefined {
    return this.items.pop();
  }

  /** top 원소를 제거하지 않고 반환한다. 비어 있으면 undefined. */
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  /** 스택이 비어 있는지 여부 */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** 모든 원소를 제거한다. */
  clear(): void {
    this.items = [];
  }

  /** top → bottom 순서의 배열 복사본을 반환한다. */
  toArray(): T[] {
    return [...this.items].reverse();
  }

  /** top → bottom 순서로 순회한다. 원본은 변경하지 않는다. */
  *[Symbol.iterator](): IterableIterator<T> {
    for (let i = this.items.length - 1; i >= 0; i--) {
      yield this.items[i];
    }
  }
}
