/**
 * 서로소 집합(Disjoint Set Union, Union-Find)
 *
 * - 각 집합을 "트리"로 표현하고, 트리의 루트가 집합의 대표 원소가 된다.
 * - parent[x] === x 이면 x는 루트(대표)이다.
 * - 최적화 두 가지를 모두 적용한다.
 *   1) 경로 압축(path compression): find 중 만난 모든 노드를 루트에 직접 연결
 *   2) 크기 기준 합치기(union by size): 작은 트리를 큰 트리 밑에 붙임
 */
export class UnionFind {
  /** parent[i]: i의 부모. 루트면 자기 자신 */
  private parent: number[];
  /** sizes[r]: r이 루트일 때 그 집합의 원소 수 (루트가 아닌 칸의 값은 의미 없음) */
  private sizes: number[];
  /** 현재 서로소 집합의 개수 */
  private count: number;

  /** 0..n-1 의 n개 원소를 각각 독립된 집합으로 시작한다. */
  constructor(n: number) {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(`원소 개수는 0 이상의 정수여야 합니다: ${n}`);
    }
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.sizes = new Array<number>(n).fill(1);
    this.count = n;
  }

  /** 전체 원소 수 */
  get size(): number {
    return this.parent.length;
  }

  /** 현재 집합(연결 요소)의 개수 */
  componentCount(): number {
    return this.count;
  }

  /**
   * 새 원소를 하나 추가하고(독립 집합) 그 인덱스를 반환한다.
   * KeyedUnionFind 처럼 원소가 동적으로 늘어나는 경우에 사용한다.
   */
  add(): number {
    const id = this.parent.length;
    this.parent.push(id);
    this.sizes.push(1);
    this.count++;
    return id;
  }

  /** x가 속한 집합의 대표(루트)를 반환한다. 반복형 2-pass 경로 압축. */
  find(x: number): number {
    this.assertInRange(x);
    // 1차 패스: 루트까지 올라간다.
    let root = x;
    while (this.parent[root] !== root) {
      root = this.parent[root];
    }
    // 2차 패스: 지나온 모든 노드를 루트에 직접 연결한다.
    let cur = x;
    while (this.parent[cur] !== root) {
      const next = this.parent[cur];
      this.parent[cur] = root;
      cur = next;
    }
    return root;
  }

  /** a, b가 속한 집합을 합친다. 실제로 합쳐졌으면 true, 이미 같은 집합이면 false. */
  union(a: number, b: number): boolean {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    // 항상 ra가 더 큰 트리가 되도록 맞춘 뒤, 작은 쪽(rb)을 큰 쪽 밑에 붙인다.
    if (this.sizes[ra] < this.sizes[rb]) {
      [ra, rb] = [rb, ra];
    }
    this.parent[rb] = ra;
    this.sizes[ra] += this.sizes[rb];
    this.count--;
    return true;
  }

  /** a와 b가 같은 집합에 속하는가? */
  connected(a: number, b: number): boolean {
    return this.find(a) === this.find(b);
  }

  /** x가 속한 집합의 원소 수 */
  sizeOf(x: number): number {
    return this.sizes[this.find(x)];
  }

  private assertInRange(x: number): void {
    if (!Number.isInteger(x) || x < 0 || x >= this.parent.length) {
      throw new RangeError(
        `원소는 0 이상 ${this.parent.length - 1} 이하의 정수여야 합니다: ${x}`
      );
    }
  }
}

/**
 * 임의의 키(T)를 쓸 수 있는 Union-Find.
 * 내부에서 Map으로 키 → 인덱스를 매핑하고, 실제 연산은 UnionFind에 위임한다.
 * 키 비교는 Map 규칙(SameValueZero)을 따르므로 객체는 참조 동일성으로 구분된다.
 */
export class KeyedUnionFind<T> {
  private uf = new UnionFind(0);
  private indexOf = new Map<T, number>();
  /** 인덱스 → 키 (find 결과를 키로 되돌리기 위함) */
  private keys: T[] = [];

  /** 등록된 키의 수 */
  get size(): number {
    return this.keys.length;
  }

  /** 현재 집합의 개수 */
  componentCount(): number {
    return this.uf.componentCount();
  }

  /** 키가 등록되어 있는가? */
  has(key: T): boolean {
    return this.indexOf.has(key);
  }

  /** 키를 독립 집합으로 등록한다. 새로 만들었으면 true, 이미 있으면 false(아무 일도 안 함). */
  makeSet(key: T): boolean {
    if (this.indexOf.has(key)) return false;
    this.indexOf.set(key, this.uf.add());
    this.keys.push(key);
    return true;
  }

  /** key가 속한 집합의 대표 키. 등록되지 않은 키면 RangeError. */
  find(key: T): T {
    return this.keys[this.uf.find(this.indexFor(key))];
  }

  /** 두 키의 집합을 합친다. 합쳐졌으면 true. 등록되지 않은 키면 RangeError. */
  union(a: T, b: T): boolean {
    return this.uf.union(this.indexFor(a), this.indexFor(b));
  }

  /** 두 키가 같은 집합인가? 등록되지 않은 키면 RangeError. */
  connected(a: T, b: T): boolean {
    return this.uf.connected(this.indexFor(a), this.indexFor(b));
  }

  /** key가 속한 집합의 크기 */
  sizeOf(key: T): number {
    return this.uf.sizeOf(this.indexFor(key));
  }

  private indexFor(key: T): number {
    const idx = this.indexOf.get(key);
    if (idx === undefined) {
      throw new RangeError(`등록되지 않은 키입니다: ${String(key)}`);
    }
    return idx;
  }
}
