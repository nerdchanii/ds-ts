/** 간선 한 개를 나타내는 값 객체 */
export interface Edge<T> {
  from: T;
  to: T;
  weight: number;
}

/** 그래프 생성 옵션 */
export interface GraphOptions {
  /** true면 방향 그래프, 기본값은 false(무방향) */
  directed?: boolean;
}

/**
 * 내부 전용 최소 힙 (다익스트라용). 외부에 export하지 않는다.
 * 배열 기반 완전 이진 트리: 부모 = (i-1)>>1, 자식 = 2i+1, 2i+2
 */
class MinHeap<V> {
  private items: { key: number; value: V }[] = [];

  get size(): number {
    return this.items.length;
  }

  push(key: number, value: V): void {
    this.items.push({ key, value });
    let i = this.items.length - 1;
    // 위로 올리기(sift up)
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent].key <= this.items[i].key) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): { key: number; value: V } | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      // 아래로 내리기(sift down)
      let i = 0;
      const n = this.items.length;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let smallest = i;
        if (l < n && this.items[l].key < this.items[smallest].key) smallest = l;
        if (r < n && this.items[r].key < this.items[smallest].key) smallest = r;
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  private swap(a: number, b: number): void {
    const t = this.items[a];
    this.items[a] = this.items[b];
    this.items[b] = t;
  }
}

/**
 * 인접 리스트 기반 그래프.
 * 내부 표현: Map<정점, Map<이웃 정점, 가중치>>
 *
 * 규칙
 * - 존재하지 않는 정점을 인자로 받는 조회성 메서드(neighbors, degree, bfs 등)는 Error를 던진다.
 * - hasVertex / hasEdge / removeEdge / removeVertex 는 없는 대상이면 false를 반환한다(던지지 않음).
 * - 무방향 그래프에서 자기 루프(u-u)는 degree에 2가 아닌 1로 센다(이웃 수 기준).
 */
export class Graph<T> {
  readonly directed: boolean;
  private adj: Map<T, Map<T, number>> = new Map();

  constructor(options: GraphOptions = {}) {
    this.directed = options.directed ?? false;
  }

  /** 정점 수 */
  get vertexCount(): number {
    return this.adj.size;
  }

  // ───────────────────────── 기본 연산 ─────────────────────────

  /** 정점 추가. 이미 있으면 아무 일도 하지 않는다. */
  addVertex(v: T): void {
    if (!this.adj.has(v)) this.adj.set(v, new Map());
  }

  /**
   * 간선 추가(없는 정점은 자동 생성). 이미 있으면 가중치를 덮어쓴다.
   * 무방향이면 양쪽에 모두 기록한다.
   */
  addEdge(u: T, v: T, weight: number = 1): void {
    if (Number.isNaN(weight)) throw new Error("가중치는 NaN일 수 없습니다.");
    this.addVertex(u);
    this.addVertex(v);
    this.adj.get(u)!.set(v, weight);
    if (!this.directed) this.adj.get(v)!.set(u, weight);
  }

  /** 간선 제거. 실제로 제거했으면 true */
  removeEdge(u: T, v: T): boolean {
    const row = this.adj.get(u);
    if (!row || !row.has(v)) return false;
    row.delete(v);
    if (!this.directed) this.adj.get(v)!.delete(u);
    return true;
  }

  /** 정점과 그에 닿는 모든 간선 제거. O(V) (모든 행에서 해당 정점을 지워야 하므로) */
  removeVertex(v: T): boolean {
    if (!this.adj.has(v)) return false;
    this.adj.delete(v);
    for (const row of this.adj.values()) row.delete(v);
    return true;
  }

  hasVertex(v: T): boolean {
    return this.adj.has(v);
  }

  hasEdge(u: T, v: T): boolean {
    return this.adj.get(u)?.has(v) ?? false;
  }

  /** 간선 가중치. 간선이 없으면 undefined */
  getWeight(u: T, v: T): number | undefined {
    return this.adj.get(u)?.get(v);
  }

  /** v에서 나가는 간선이 가리키는 이웃들(삽입 순서) */
  neighbors(v: T): T[] {
    return Array.from(this.row(v).keys());
  }

  /** 모든 정점(삽입 순서) */
  vertices(): T[] {
    return Array.from(this.adj.keys());
  }

  /** 모든 간선. 무방향 그래프는 각 간선을 한 번만 반환한다. */
  edges(): Edge<T>[] {
    const result: Edge<T>[] = [];
    const done = new Set<T>(); // 무방향: 이미 처리 끝난 정점(중복 방지)
    for (const [u, row] of this.adj) {
      for (const [v, weight] of row) {
        if (!this.directed && done.has(v)) continue;
        result.push({ from: u, to: v, weight });
      }
      done.add(u);
    }
    return result;
  }

  /** 무방향: 연결된 이웃 수. 방향 그래프에서는 outDegree와 같다. */
  degree(v: T): number {
    return this.row(v).size;
  }

  /** 나가는 간선 수 */
  outDegree(v: T): number {
    return this.row(v).size;
  }

  /** 들어오는 간선 수. 인접 리스트는 역방향 조회가 없어 O(V) */
  inDegree(v: T): number {
    this.row(v);
    let count = 0;
    for (const row of this.adj.values()) if (row.has(v)) count++;
    return count;
  }

  // ───────────────────────── 탐색 ─────────────────────────

  /** 너비 우선 탐색. 방문 순서를 반환한다. (큐 사용) */
  bfs(start: T): T[] {
    this.row(start);
    const order: T[] = [];
    const visited = new Set<T>([start]);
    // 배열 shift는 O(n)이므로 head 인덱스로 큐를 흉내 낸다.
    const queue: T[] = [start];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++];
      order.push(u);
      for (const v of this.adj.get(u)!.keys()) {
        if (!visited.has(v)) {
          visited.add(v); // 큐에 넣는 시점에 방문 표시 → 중복 삽입 방지
          queue.push(v);
        }
      }
    }
    return order;
  }

  /**
   * 깊이 우선 탐색(반복형, 명시적 스택). 방문 순서를 반환한다.
   * 이웃을 역순으로 push하므로 재귀 DFS와 같은 순서(첫 이웃 먼저)로 방문한다.
   */
  dfs(start: T): T[] {
    this.row(start);
    const order: T[] = [];
    const visited = new Set<T>();
    const stack: T[] = [start];
    while (stack.length > 0) {
      const u = stack.pop()!;
      if (visited.has(u)) continue; // 스택에 중복으로 들어올 수 있으므로 pop 시점에 검사
      visited.add(u);
      order.push(u);
      const nbrs = this.neighbors(u);
      for (let i = nbrs.length - 1; i >= 0; i--) {
        if (!visited.has(nbrs[i])) stack.push(nbrs[i]);
      }
    }
    return order;
  }

  /**
   * 가중치를 무시하고 간선 수가 가장 적은 경로(BFS).
   * start 포함 end 포함 정점 배열. 도달 불가면 undefined. start === end면 [start].
   */
  shortestPathUnweighted(start: T, end: T): T[] | undefined {
    this.row(start);
    this.row(end);
    const parent = new Map<T, T>();
    const visited = new Set<T>([start]);
    const queue: T[] = [start];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++];
      if (u === end) break;
      for (const v of this.adj.get(u)!.keys()) {
        if (!visited.has(v)) {
          visited.add(v);
          parent.set(v, u);
          queue.push(v);
        }
      }
    }
    if (!visited.has(end)) return undefined;
    const path: T[] = [end];
    let cur = end;
    while (cur !== start) {
      cur = parent.get(cur)!;
      path.push(cur);
    }
    return path.reverse();
  }

  /**
   * 다익스트라 최단 거리. 모든 정점을 키로 갖는 Map을 반환하며
   * 도달 불가능한 정점의 거리는 Infinity이다.
   * 음수 가중치 간선이 있으면 RangeError를 던진다.
   */
  dijkstra(start: T): Map<T, number> {
    this.row(start);
    for (const row of this.adj.values()) {
      for (const w of row.values()) {
        if (w < 0) throw new RangeError("다익스트라는 음수 가중치를 지원하지 않습니다.");
      }
    }
    const dist = new Map<T, number>();
    for (const v of this.adj.keys()) dist.set(v, Infinity);
    dist.set(start, 0);

    // 지연 삭제(lazy deletion): 거리 갱신 시 새 항목을 push하고, 오래된 항목은 pop 때 버린다.
    const heap = new MinHeap<T>();
    heap.push(0, start);
    while (heap.size > 0) {
      const { key: d, value: u } = heap.pop()!;
      if (d > dist.get(u)!) continue; // 낡은 항목
      for (const [v, w] of this.adj.get(u)!) {
        const nd = d + w;
        if (nd < dist.get(v)!) {
          dist.set(v, nd);
          heap.push(nd, v);
        }
      }
    }
    return dist;
  }

  /**
   * 위상 정렬(Kahn 알고리즘). 방향 그래프 전용. 무방향이면 Error.
   * 사이클이 있으면 Error 대신 `undefined`를 반환한다.
   */
  topologicalSort(): T[] | undefined {
    if (!this.directed) throw new Error("위상 정렬은 방향 그래프에서만 가능합니다.");
    const indeg = new Map<T, number>();
    for (const v of this.adj.keys()) indeg.set(v, 0);
    for (const row of this.adj.values()) {
      for (const v of row.keys()) indeg.set(v, indeg.get(v)! + 1);
    }
    const queue: T[] = [];
    for (const [v, d] of indeg) if (d === 0) queue.push(v);
    const order: T[] = [];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++];
      order.push(u);
      for (const v of this.adj.get(u)!.keys()) {
        const d = indeg.get(v)! - 1;
        indeg.set(v, d);
        if (d === 0) queue.push(v);
      }
    }
    // 모든 정점이 나오지 못했다면 사이클 때문에 진입차수가 0이 못 된 정점이 있다.
    return order.length === this.adj.size ? order : undefined;
  }

  /** 연결 요소(무방향 전용, 방향이면 Error). 각 요소는 정점 배열(BFS 순서). */
  connectedComponents(): T[][] {
    if (this.directed) throw new Error("연결 요소는 무방향 그래프에서만 정의됩니다.");
    const seen = new Set<T>();
    const result: T[][] = [];
    for (const s of this.adj.keys()) {
      if (seen.has(s)) continue;
      const comp = this.bfs(s);
      for (const v of comp) seen.add(v);
      result.push(comp);
    }
    return result;
  }

  // ───────────────────────── 내부 도우미 ─────────────────────────

  /** 정점의 인접 행을 꺼낸다. 없으면 Error */
  private row(v: T): Map<T, number> {
    const row = this.adj.get(v);
    if (!row) throw new Error(`존재하지 않는 정점입니다: ${String(v)}`);
    return row;
  }
}
