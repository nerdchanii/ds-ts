/** 해시 함수: 키를 정수(부호 무관)로 변환한다. */
export type HashFn<K> = (key: K) => number;
/** 동등성 비교 함수: 두 키가 같은 키인지 판단한다. */
export type EqualsFn<K> = (a: K, b: K) => boolean;

export interface HashMapOptions<K> {
  /** 커스텀 해시 함수 (기본: 문자열/숫자/불린용 내장 해시) */
  hash?: HashFn<K>;
  /** 커스텀 동등성 함수 (기본: ===, 단 NaN끼리는 같다고 본다) */
  equals?: EqualsFn<K>;
  /** 초기 버킷 수 (기본 8) */
  initialCapacity?: number;
}

/** 체이닝용 연결 리스트 노드 */
class Node<K, V> {
  constructor(public key: K, public value: V, public next: Node<K, V> | null = null) {}
}

/** 문자열 해시: djb2 (hash = hash * 33 + c). 32비트 부호 없는 정수로 유지한다. */
export function hashString(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    // (h << 5) + h === h * 33. >>> 0 으로 32비트 부호 없는 정수 유지
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** 숫자 해시: 정수는 32비트 단위로 쪼개 비트를 섞고(murmur3 finalizer 계열), 소수/NaN/Infinity는 문자열로 바꿔 해시한다. */
export function hashNumber(num: number): number {
  if (!Number.isInteger(num)) return hashString(String(num)); // 0.1, NaN, Infinity 등
  const TWO32 = 4294967296;
  const lo = num % TWO32 | 0; // 하위 32비트 (음수도 처리, -0 -> 0)
  const hi = Math.floor(num / TWO32) | 0; // 상위 비트 (안전 정수 범위 밖에서도 결정적)
  return mix32(mix32(lo) ^ hi);
}

/** 불린 해시: 두 값을 서로 다른 정수로 보낸다. */
export function hashBoolean(b: boolean): number {
  return b ? 1231 : 1237; // Java Boolean.hashCode 와 같은 관례
}

/** 32비트 정수 혼합 (비슷한 정수가 같은 버킷에 몰리지 않게 비트를 퍼뜨린다). */
function mix32(x: number): number {
  x = x | 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x = x ^ (x >>> 16);
  return x >>> 0;
}

function defaultHash(key: unknown): number {
  switch (typeof key) {
    case 'string':
      return hashString(key);
    case 'number':
      return hashNumber(key);
    case 'boolean':
      return hashBoolean(key);
    default:
      throw new TypeError(
        '기본 해시는 string/number/boolean만 지원합니다. 다른 키 타입은 생성자에 hash/equals를 주입하세요.'
      );
  }
}

function defaultEquals(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b); // NaN 도 자기 자신과 같은 키로 취급
}

/** 분리 연결법(separate chaining) 해시 맵. 내장 Map/Object에 의존하지 않는다. */
export class HashMap<K, V> implements Iterable<[K, V]> {
  /** 부하율 상한: size / 버킷 수가 이 값을 넘으면 리해싱 */
  static readonly MAX_LOAD_FACTOR = 0.75;

  private buckets: Array<Node<K, V> | null>;
  private count = 0;
  private readonly hashFn: HashFn<K>;
  private readonly equalsFn: EqualsFn<K>;
  private readonly initialCapacity: number;

  constructor(options: HashMapOptions<K> = {}) {
    const cap = options.initialCapacity ?? 8;
    if (!Number.isInteger(cap) || cap < 1) {
      throw new RangeError('initialCapacity는 1 이상의 정수여야 합니다.');
    }
    this.initialCapacity = cap;
    this.hashFn = options.hash ?? (defaultHash as HashFn<K>);
    this.equalsFn = options.equals ?? (defaultEquals as EqualsFn<K>);
    this.buckets = new Array<Node<K, V> | null>(cap).fill(null);
  }

  /** 저장된 항목 수 */
  get size(): number {
    return this.count;
  }

  /** 현재 버킷 수 (학습/테스트용 관찰 지점) */
  get capacity(): number {
    return this.buckets.length;
  }

  /** 현재 부하율 */
  get loadFactor(): number {
    return this.count / this.buckets.length;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  /** 키 -> 버킷 인덱스. 해시가 음수/소수여도 안전하도록 32비트 부호 없는 정수로 정규화한다. */
  private indexFor(key: K, capacity: number = this.buckets.length): number {
    return (this.hashFn(key) >>> 0) % capacity;
  }

  private findNode(key: K): Node<K, V> | null {
    let node = this.buckets[this.indexFor(key)];
    while (node !== null) {
      if (this.equalsFn(node.key, key)) return node;
      node = node.next;
    }
    return null;
  }

  /** 삽입 또는 갱신. 같은 키가 있으면 값만 교체한다. 체이닝 맵 자신을 반환(체이닝 호출 가능). */
  set(key: K, value: V): this {
    const found = this.findNode(key);
    if (found) {
      found.value = value;
      return this;
    }
    const idx = this.indexFor(key);
    this.buckets[idx] = new Node(key, value, this.buckets[idx]); // 체인 머리에 삽입 O(1)
    this.count++;
    if (this.count / this.buckets.length > HashMap.MAX_LOAD_FACTOR) {
      this.resize(this.buckets.length * 2);
    }
    return this;
  }

  /** 값 조회. 없으면 undefined. */
  get(key: K): V | undefined {
    return this.findNode(key)?.value;
  }

  has(key: K): boolean {
    return this.findNode(key) !== null;
  }

  /** 삭제. 실제로 지웠으면 true. */
  delete(key: K): boolean {
    const idx = this.indexFor(key);
    let prev: Node<K, V> | null = null;
    let node = this.buckets[idx];
    while (node !== null) {
      if (this.equalsFn(node.key, key)) {
        if (prev === null) this.buckets[idx] = node.next;
        else prev.next = node.next;
        this.count--;
        return true;
      }
      prev = node;
      node = node.next;
    }
    return false;
  }

  /** 모든 항목 제거. 버킷 수는 초기 크기로 되돌린다. */
  clear(): void {
    this.buckets = new Array<Node<K, V> | null>(this.initialCapacity).fill(null);
    this.count = 0;
  }

  /** 버킷 순서대로 순회 (삽입 순서가 아님). 순회 중 수정은 지원하지 않는다. */
  *entries(): IterableIterator<[K, V]> {
    for (const head of this.buckets) {
      for (let node = head; node !== null; node = node.next) {
        yield [node.key, node.value];
      }
    }
  }

  *keys(): IterableIterator<K> {
    for (const [k] of this.entries()) yield k;
  }

  *values(): IterableIterator<V> {
    for (const [, v] of this.entries()) yield v;
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }

  /** 버킷을 newCapacity로 바꾸고 모든 노드를 다시 배치한다. 노드를 재사용하므로 추가 할당이 없다. */
  private resize(newCapacity: number): void {
    const next = new Array<Node<K, V> | null>(newCapacity).fill(null);
    for (const head of this.buckets) {
      let node = head;
      while (node !== null) {
        const following = node.next; // 링크를 바꾸기 전에 저장
        const idx = this.indexFor(node.key, newCapacity);
        node.next = next[idx];
        next[idx] = node;
        node = following;
      }
    }
    this.buckets = next;
  }
}
