/**
 * 동적 배열(Dynamic Array)
 *
 * JS 내장 배열의 자동 크기 조절에 기대지 않고, `new Array(capacity)`로 만든
 * 고정 길이 슬롯을 직접 관리한다.
 *  - 용량이 가득 차면 2배로 확장(grow)
 *  - 사용량이 용량의 1/4 이하가 되면 절반으로 축소(shrink)
 *
 * 불변식:
 *  1) 0 <= length <= slots.length (= capacity)
 *  2) 유효한 원소는 slots[0 .. length-1] 에만 있고, 나머지 슬롯은 undefined
 *  3) capacity >= MIN_CAPACITY
 */
export class DynamicArray<T> implements Iterable<T> {
  /** 최소 용량. 이보다 작게는 축소하지 않는다. */
  static readonly MIN_CAPACITY = 4;

  /** 고정 길이 슬롯. 길이는 resize 때만 바뀐다(새 배열로 교체). */
  private slots: (T | undefined)[];
  /** 실제 저장된 원소 수 */
  private length = 0;

  constructor(initialCapacity: number = DynamicArray.MIN_CAPACITY) {
    if (!Number.isInteger(initialCapacity) || initialCapacity < 0) {
      throw new RangeError(`initialCapacity는 0 이상의 정수여야 합니다: ${initialCapacity}`);
    }
    this.slots = new Array<T | undefined>(
      Math.max(initialCapacity, DynamicArray.MIN_CAPACITY)
    );
  }

  /** 저장된 원소 수. O(1) */
  size(): number {
    return this.length;
  }

  /** 현재 할당된 슬롯 수. O(1) */
  capacity(): number {
    return this.slots.length;
  }

  isEmpty(): boolean {
    return this.length === 0;
  }

  /** 끝에 원소 추가. 평균(amortized) O(1) */
  push(value: T): void {
    if (this.length === this.slots.length) {
      this.resize(this.slots.length * 2); // grow
    }
    this.slots[this.length++] = value;
  }

  /** 끝 원소 제거 후 반환. 비어 있으면 RangeError. 평균 O(1) */
  pop(): T {
    if (this.length === 0) {
      throw new RangeError("빈 배열에서 pop할 수 없습니다");
    }
    const value = this.slots[this.length - 1] as T;
    this.slots[--this.length] = undefined; // 참조 해제(GC 허용)
    this.shrinkIfNeeded();
    return value;
  }

  /** index 위치 원소 조회. 범위 밖이면 RangeError. O(1) */
  get(index: number): T {
    this.checkIndex(index, this.length);
    return this.slots[index] as T;
  }

  /** index 위치 원소 교체. 범위 밖이면 RangeError. O(1) */
  set(index: number, value: T): void {
    this.checkIndex(index, this.length);
    this.slots[index] = value;
  }

  /** index 위치에 삽입(뒤 원소는 한 칸씩 밀림). 허용 범위 0..size. O(n) */
  insertAt(index: number, value: T): void {
    this.checkIndex(index, this.length + 1); // index == size 허용(끝에 삽입)
    if (this.length === this.slots.length) {
      this.resize(this.slots.length * 2);
    }
    for (let i = this.length; i > index; i--) {
      this.slots[i] = this.slots[i - 1];
    }
    this.slots[index] = value;
    this.length++;
  }

  /** index 위치 원소 제거 후 반환(뒤 원소는 한 칸씩 당겨짐). O(n) */
  removeAt(index: number): T {
    this.checkIndex(index, this.length);
    const value = this.slots[index] as T;
    for (let i = index; i < this.length - 1; i++) {
      this.slots[i] = this.slots[i + 1];
    }
    this.slots[--this.length] = undefined;
    this.shrinkIfNeeded();
    return value;
  }

  /** 모든 원소 제거하고 최소 용량으로 되돌림. O(1) 할당 */
  clear(): void {
    this.slots = new Array<T | undefined>(DynamicArray.MIN_CAPACITY);
    this.length = 0;
  }

  /** 내장 배열로 복사. O(n) */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.length; i++) {
      result.push(this.slots[i] as T);
    }
    return result;
  }

  /** for...of 지원 */
  [Symbol.iterator](): Iterator<T> {
    let i = 0;
    return {
      next: (): IteratorResult<T> =>
        i < this.length
          ? { value: this.slots[i++] as T, done: false }
          : { value: undefined, done: true },
    };
  }

  // ---------------------------------------------------------------- 내부

  /** 0 <= index < limit 이 아니면 RangeError */
  private checkIndex(index: number, limit: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= limit) {
      throw new RangeError(`인덱스 범위 오류: ${index} (허용: 0 ~ ${limit - 1})`);
    }
  }

  /** 사용량이 용량의 1/4 이하이면 절반으로 축소(최소 용량 아래로는 안 줄임) */
  private shrinkIfNeeded(): void {
    const half = this.slots.length / 2;
    if (this.length <= this.slots.length / 4 && half >= DynamicArray.MIN_CAPACITY) {
      this.resize(half);
    }
  }

  /** 새 슬롯 배열을 만들어 원소를 복사(O(n)). newCapacity >= length 여야 함 */
  private resize(newCapacity: number): void {
    const next = new Array<T | undefined>(newCapacity);
    for (let i = 0; i < this.length; i++) {
      next[i] = this.slots[i];
    }
    this.slots = next;
  }
}
