/**
 * 이진 힙(Binary Heap)과 우선순위 큐(Priority Queue) 구현.
 *
 * 배열 하나로 완전 이진 트리를 표현한다.
 *   부모 = (i - 1) >> 1,  왼쪽 자식 = 2i + 1,  오른쪽 자식 = 2i + 2
 *
 * 비교 함수 규칙: compare(a, b) < 0 이면 a가 b보다 "먼저 나와야" 한다(루트에 가깝다).
 * 기본값은 숫자 오름차순 비교이므로 최소 힙이 된다. 최대 힙은 (a, b) => b - a 를 주면 된다.
 */
export type Comparator<T> = (a: T, b: T) => number;

/** 기본 비교 함수: 작은 값이 먼저 나온다(최소 힙). 숫자·문자열 등 < 연산이 가능한 값에 쓴다. */
const defaultComparator = <T>(a: T, b: T): number => (a < b ? -1 : a > b ? 1 : 0);

export class BinaryHeap<T> {
  private readonly items: T[] = [];
  private readonly compare: Comparator<T>;

  constructor(comparator: Comparator<T> = defaultComparator) {
    this.compare = comparator;
  }

  /**
   * 배열로부터 힙을 한 번에 만든다. Floyd의 heapify로 O(n).
   * 마지막 내부 노드부터 루트까지 거꾸로 sift-down 한다. 원본 배열은 변경하지 않는다.
   */
  static from<T>(items: Iterable<T>, comparator?: Comparator<T>): BinaryHeap<T> {
    const heap = new BinaryHeap<T>(comparator);
    heap.items.push(...Array.from(items));
    // 마지막 내부 노드의 인덱스 = 부모(n - 1) = (n - 2) >> 1
    for (let i = (heap.items.length - 2) >> 1; i >= 0; i--) {
      heap.siftDown(i);
    }
    return heap;
  }

  /** 원소 개수. O(1) */
  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** 원소를 추가한다. 맨 끝에 넣고 sift-up. O(log n) */
  push(value: T): void {
    this.items.push(value);
    this.siftUp(this.items.length - 1);
  }

  /** 루트(가장 우선순위 높은 값)를 꺼낸다. 비어 있으면 undefined. O(log n) */
  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop() as T;
    if (this.items.length > 0) {
      // 마지막 원소를 루트로 옮긴 뒤 아래로 내려 힙 성질을 복구한다.
      this.items[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  /** 루트를 제거하지 않고 확인한다. 비어 있으면 undefined. O(1) */
  peek(): T | undefined {
    return this.items[0];
  }

  clear(): void {
    this.items.length = 0;
  }

  /** 내부 배열의 복사본(힙 순서이며 정렬된 순서가 아님). O(n) */
  toArray(): T[] {
    return this.items.slice();
  }

  /** 위로 올리기: 부모보다 우선순위가 높으면 자리를 바꾸며 올라간다. */
  private siftUp(index: number): void {
    const value = this.items[index];
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.compare(value, this.items[parent]) >= 0) break;
      this.items[index] = this.items[parent]; // 부모를 아래로 내림
      index = parent;
    }
    this.items[index] = value;
  }

  /** 아래로 내리기: 더 우선순위 높은 자식과 자리를 바꾸며 내려간다. */
  private siftDown(index: number): void {
    const n = this.items.length;
    const value = this.items[index];
    while (true) {
      const left = 2 * index + 1;
      if (left >= n) break; // 자식이 없으면 리프
      const right = left + 1;
      const best =
        right < n && this.compare(this.items[right], this.items[left]) < 0 ? right : left;
      if (this.compare(this.items[best], value) >= 0) break;
      this.items[index] = this.items[best]; // 자식을 위로 올림
      index = best;
    }
    this.items[index] = value;
  }
}

/** BinaryHeap을 감싼 얇은 우선순위 큐. 비교 함수 기준으로 "가장 먼저 나올 값"이 dequeue 된다. */
export class PriorityQueue<T> {
  private readonly heap: BinaryHeap<T>;

  constructor(comparator?: Comparator<T>) {
    this.heap = new BinaryHeap<T>(comparator);
  }

  get size(): number {
    return this.heap.size;
  }

  isEmpty(): boolean {
    return this.heap.isEmpty();
  }

  enqueue(value: T): void {
    this.heap.push(value);
  }

  dequeue(): T | undefined {
    return this.heap.pop();
  }

  peek(): T | undefined {
    return this.heap.peek();
  }

  clear(): void {
    this.heap.clear();
  }
}

// 직접 실행(`yarn start`) 시에만 동작하는 데모. import 하면 아무 일도 일어나지 않는다.
const argv1: string | undefined = (globalThis as any).process?.argv?.[1];
if (argv1 && import.meta.url.endsWith(argv1.replace(/\\/g, "/").replace(/^.*\/src\//, "/src/"))) {
  const heap = BinaryHeap.from([5, 3, 8, 1, 9, 2, 7]);
  const sorted: number[] = [];
  while (!heap.isEmpty()) sorted.push(heap.pop() as number);
  console.log("힙 정렬 결과:", sorted.join(", "));
}
