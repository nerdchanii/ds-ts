/**
 * 연결 리스트(Linked List) 두 가지 구현.
 *  - SinglyLinkedList<T> : 노드가 next 만 가진다 (head + tail 포인터 유지)
 *  - DoublyLinkedList<T> : 노드가 prev, next 를 모두 가진다
 *
 * 공통 규칙
 *  - 인덱스는 0부터 시작한다.
 *  - 인덱스가 범위를 벗어나면 RangeError 를 던진다.
 *  - 비어 있는 리스트에서 popFront / popBack 은 undefined 를 반환한다.
 */

/** 인덱스 검증 헬퍼: 0 <= index <= max 인 정수인지 확인한다. */
function assertIndex(index: number, max: number, op: string): void {
  if (!Number.isInteger(index) || index < 0 || index > max) {
    throw new RangeError(`${op}: 인덱스 ${index} 가 범위(0..${max})를 벗어났습니다`);
  }
}

// ---------------------------------------------------------------------------
// 단일 연결 리스트
// ---------------------------------------------------------------------------

class SNode<T> {
  next: SNode<T> | null = null;
  constructor(public value: T) {}
}

export class SinglyLinkedList<T> implements Iterable<T> {
  private head: SNode<T> | null = null;
  private tail: SNode<T> | null = null;
  private _size = 0;

  /** 원소 개수. O(1) (개수를 따로 기억해 두기 때문) */
  get size(): number {
    return this._size;
  }

  isEmpty(): boolean {
    return this._size === 0;
  }

  /** 맨 앞에 삽입. O(1) */
  pushFront(value: T): void {
    const node = new SNode(value);
    node.next = this.head;
    this.head = node;
    if (this.tail === null) this.tail = node; // 비어 있었다면 tail 도 새 노드
    this._size++;
  }

  /** 맨 뒤에 삽입. tail 포인터 덕분에 O(1) */
  pushBack(value: T): void {
    const node = new SNode(value);
    if (this.tail === null) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this._size++;
  }

  /** 맨 앞 원소 제거 후 반환. 비어 있으면 undefined. O(1) */
  popFront(): T | undefined {
    if (this.head === null) return undefined;
    const node = this.head;
    this.head = node.next;
    if (this.head === null) this.tail = null; // 마지막 원소였다면 tail 도 비움
    this._size--;
    return node.value;
  }

  /**
   * 맨 뒤 원소 제거 후 반환. 비어 있으면 undefined.
   * 단일 연결이라 tail 의 "이전 노드"를 알 수 없어 처음부터 따라가야 한다. O(n)
   */
  popBack(): T | undefined {
    if (this.tail === null) return undefined;
    if (this.head === this.tail) {
      const value = this.tail.value;
      this.head = this.tail = null;
      this._size--;
      return value;
    }
    let prev = this.head!;
    while (prev.next !== this.tail) prev = prev.next!; // tail 바로 앞 노드 찾기
    const value = this.tail.value;
    prev.next = null;
    this.tail = prev;
    this._size--;
    return value;
  }

  /** index 위치에 삽입 (0 <= index <= size). 중간 삽입은 탐색 O(n) */
  insertAt(index: number, value: T): void {
    assertIndex(index, this._size, "insertAt");
    if (index === 0) return this.pushFront(value);
    if (index === this._size) return this.pushBack(value);
    const prev = this.nodeAt(index - 1);
    const node = new SNode(value);
    node.next = prev.next;
    prev.next = node;
    this._size++;
  }

  /** index 위치 원소 제거 후 반환 (0 <= index < size). O(n) */
  removeAt(index: number): T {
    assertIndex(index, this._size - 1, "removeAt");
    if (index === 0) return this.popFront() as T;
    const prev = this.nodeAt(index - 1);
    const target = prev.next!;
    prev.next = target.next;
    if (target === this.tail) this.tail = prev;
    this._size--;
    return target.value;
  }

  /** index 번째 값 조회 (0 <= index < size). 임의 접근이 아니라 O(n) */
  get(index: number): T {
    assertIndex(index, this._size - 1, "get");
    return this.nodeAt(index).value;
  }

  /** 처음 일치하는 값의 인덱스, 없으면 -1. === 로 비교한다. O(n) */
  indexOf(value: T): number {
    let i = 0;
    for (let cur = this.head; cur !== null; cur = cur.next, i++) {
      if (cur.value === value) return i;
    }
    return -1;
  }

  /** 제자리(in-place) 뒤집기: next 방향을 하나씩 반대로 돌린다. O(n), 추가 공간 O(1) */
  reverse(): void {
    let prev: SNode<T> | null = null;
    let cur = this.head;
    this.tail = this.head; // 기존 head 가 새 tail
    while (cur !== null) {
      const next: SNode<T> | null = cur.next;
      cur.next = prev;
      prev = cur;
      cur = next;
    }
    this.head = prev;
  }

  clear(): void {
    this.head = this.tail = null;
    this._size = 0;
  }

  toArray(): T[] {
    return Array.from(this);
  }

  *[Symbol.iterator](): Iterator<T> {
    for (let cur = this.head; cur !== null; cur = cur.next) yield cur.value;
  }

  /** index 번째 노드를 head 에서부터 따라가 찾는다. (범위는 호출자가 보장) */
  private nodeAt(index: number): SNode<T> {
    let cur = this.head!;
    for (let i = 0; i < index; i++) cur = cur.next!;
    return cur;
  }
}

// ---------------------------------------------------------------------------
// 이중 연결 리스트
// ---------------------------------------------------------------------------

class DNode<T> {
  prev: DNode<T> | null = null;
  next: DNode<T> | null = null;
  constructor(public value: T) {}
}

export class DoublyLinkedList<T> implements Iterable<T> {
  private head: DNode<T> | null = null;
  private tail: DNode<T> | null = null;
  private _size = 0;

  get size(): number {
    return this._size;
  }

  isEmpty(): boolean {
    return this._size === 0;
  }

  /** 맨 앞에 삽입. O(1) */
  pushFront(value: T): void {
    const node = new DNode(value);
    node.next = this.head;
    if (this.head !== null) this.head.prev = node;
    else this.tail = node;
    this.head = node;
    this._size++;
  }

  /** 맨 뒤에 삽입. O(1) */
  pushBack(value: T): void {
    const node = new DNode(value);
    node.prev = this.tail;
    if (this.tail !== null) this.tail.next = node;
    else this.head = node;
    this.tail = node;
    this._size++;
  }

  /** 맨 앞 원소 제거 후 반환. 비어 있으면 undefined. O(1) */
  popFront(): T | undefined {
    if (this.head === null) return undefined;
    return this.unlink(this.head);
  }

  /** 맨 뒤 원소 제거 후 반환. prev 포인터 덕분에 단일 연결과 달리 O(1) */
  popBack(): T | undefined {
    if (this.tail === null) return undefined;
    return this.unlink(this.tail);
  }

  /** index 위치에 삽입 (0 <= index <= size). 가까운 쪽 끝에서 탐색하므로 최대 n/2 걸음 */
  insertAt(index: number, value: T): void {
    assertIndex(index, this._size, "insertAt");
    if (index === 0) return this.pushFront(value);
    if (index === this._size) return this.pushBack(value);
    const next = this.nodeAt(index); // 새 노드가 들어갈 자리를 차지하고 있던 노드
    const prev = next.prev!;
    const node = new DNode(value);
    node.prev = prev;
    node.next = next;
    prev.next = node;
    next.prev = node;
    this._size++;
  }

  /** index 위치 원소 제거 후 반환 (0 <= index < size) */
  removeAt(index: number): T {
    assertIndex(index, this._size - 1, "removeAt");
    return this.unlink(this.nodeAt(index));
  }

  get(index: number): T {
    assertIndex(index, this._size - 1, "get");
    return this.nodeAt(index).value;
  }

  indexOf(value: T): number {
    let i = 0;
    for (let cur = this.head; cur !== null; cur = cur.next, i++) {
      if (cur.value === value) return i;
    }
    return -1;
  }

  /** 모든 노드의 prev/next 를 맞바꾸고 head/tail 도 교환한다. O(n), 추가 공간 O(1) */
  reverse(): void {
    let cur = this.head;
    while (cur !== null) {
      const next: DNode<T> | null = cur.next;
      cur.next = cur.prev;
      cur.prev = next;
      cur = next;
    }
    const oldHead = this.head;
    this.head = this.tail;
    this.tail = oldHead;
  }

  clear(): void {
    this.head = this.tail = null;
    this._size = 0;
  }

  toArray(): T[] {
    return Array.from(this);
  }

  *[Symbol.iterator](): Iterator<T> {
    for (let cur = this.head; cur !== null; cur = cur.next) yield cur.value;
  }

  /** 노드 하나를 리스트에서 떼어내고 값을 반환한다. O(1) */
  private unlink(node: DNode<T>): T {
    if (node.prev !== null) node.prev.next = node.next;
    else this.head = node.next;
    if (node.next !== null) node.next.prev = node.prev;
    else this.tail = node.prev;
    node.prev = node.next = null;
    this._size--;
    return node.value;
  }

  /** 앞쪽 절반이면 head 에서, 뒤쪽 절반이면 tail 에서 출발해 탐색한다. (범위는 호출자가 보장) */
  private nodeAt(index: number): DNode<T> {
    if (index < this._size / 2) {
      let cur = this.head!;
      for (let i = 0; i < index; i++) cur = cur.next!;
      return cur;
    }
    let cur = this.tail!;
    for (let i = this._size - 1; i > index; i--) cur = cur.prev!;
    return cur;
  }
}
