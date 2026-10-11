import { describe, expect, it } from "vitest";
import { KeyedUnionFind, UnionFind } from "./union-find";

/** 최적화 없는 순진한 구현: 집합 id 배열, union은 O(n) 재라벨링 */
class NaiveUF {
  private label: number[];
  constructor(n: number) {
    this.label = Array.from({ length: n }, (_, i) => i);
  }
  union(a: number, b: number): boolean {
    const la = this.label[a];
    const lb = this.label[b];
    if (la === lb) return false;
    this.label = this.label.map((l) => (l === lb ? la : l));
    return true;
  }
  connected(a: number, b: number): boolean {
    return this.label[a] === this.label[b];
  }
  componentCount(): number {
    return new Set(this.label).size;
  }
  sizeOf(x: number): number {
    return this.label.filter((l) => l === this.label[x]).length;
  }
}

/** 시드 고정 의사난수 (mulberry32) */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("UnionFind 정상 케이스", () => {
  it("처음에는 모두 독립 집합이다", () => {
    const uf = new UnionFind(5);
    expect(uf.componentCount()).toBe(5);
    expect(uf.connected(0, 1)).toBe(false);
    expect(uf.sizeOf(3)).toBe(1);
    expect(uf.find(2)).toBe(2);
  });

  it("union은 합쳐지면 true, 이미 같은 집합이면 false", () => {
    const uf = new UnionFind(4);
    expect(uf.union(0, 1)).toBe(true);
    expect(uf.union(1, 0)).toBe(false);
    expect(uf.union(2, 3)).toBe(true);
    expect(uf.union(1, 2)).toBe(true);
    expect(uf.union(0, 3)).toBe(false);
    expect(uf.componentCount()).toBe(1);
  });

  it("connected는 추이적이다", () => {
    const uf = new UnionFind(6);
    uf.union(0, 1);
    uf.union(1, 2);
    expect(uf.connected(0, 2)).toBe(true);
    expect(uf.connected(0, 3)).toBe(false);
  });

  it("sizeOf는 집합 크기를 반환한다", () => {
    const uf = new UnionFind(6);
    uf.union(0, 1);
    uf.union(2, 1);
    expect(uf.sizeOf(0)).toBe(3);
    expect(uf.sizeOf(2)).toBe(3);
    expect(uf.sizeOf(5)).toBe(1);
  });

  it("같은 집합 원소의 find 결과는 동일하다", () => {
    const uf = new UnionFind(5);
    uf.union(0, 1);
    uf.union(3, 4);
    uf.union(1, 4);
    const r = uf.find(0);
    for (const x of [0, 1, 3, 4]) expect(uf.find(x)).toBe(r);
    expect(uf.find(2)).toBe(2);
  });

  it("union 순서와 무관하게 연결 관계가 같다", () => {
    const a = new UnionFind(5);
    const b = new UnionFind(5);
    a.union(0, 1);
    a.union(2, 3);
    a.union(1, 2);
    b.union(3, 2);
    b.union(1, 0);
    b.union(3, 0);
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < 5; j++) expect(a.connected(i, j)).toBe(b.connected(i, j));
  });

  it("add로 원소를 추가할 수 있다", () => {
    const uf = new UnionFind(2);
    const id = uf.add();
    expect(id).toBe(2);
    expect(uf.size).toBe(3);
    expect(uf.componentCount()).toBe(3);
    uf.union(0, id);
    expect(uf.connected(0, 2)).toBe(true);
  });
});

describe("UnionFind 빈 상태/경계", () => {
  it("n = 0 이면 원소도 집합도 없다", () => {
    const uf = new UnionFind(0);
    expect(uf.size).toBe(0);
    expect(uf.componentCount()).toBe(0);
    expect(() => uf.find(0)).toThrow(RangeError);
  });

  it("n = 1", () => {
    const uf = new UnionFind(1);
    expect(uf.union(0, 0)).toBe(false);
    expect(uf.componentCount()).toBe(1);
    expect(uf.sizeOf(0)).toBe(1);
  });

  it("자기 자신과 union하면 false", () => {
    const uf = new UnionFind(3);
    expect(uf.union(1, 1)).toBe(false);
    expect(uf.componentCount()).toBe(3);
  });

  it("범위를 벗어난 원소는 RangeError", () => {
    const uf = new UnionFind(3);
    expect(() => uf.find(-1)).toThrow(RangeError);
    expect(() => uf.find(3)).toThrow(RangeError);
    expect(() => uf.union(0, 3)).toThrow(RangeError);
    expect(() => uf.connected(-1, 0)).toThrow(RangeError);
    expect(() => uf.sizeOf(99)).toThrow(RangeError);
  });

  it("정수가 아닌 값은 RangeError", () => {
    const uf = new UnionFind(3);
    expect(() => uf.find(1.5)).toThrow(RangeError);
    expect(() => uf.find(NaN)).toThrow(RangeError);
  });

  it("잘못된 n으로 생성하면 RangeError", () => {
    expect(() => new UnionFind(-1)).toThrow(RangeError);
    expect(() => new UnionFind(2.5)).toThrow(RangeError);
    expect(() => new UnionFind(NaN)).toThrow(RangeError);
  });

  it("실패한 union은 상태를 바꾸지 않는다", () => {
    const uf = new UnionFind(3);
    uf.union(0, 1);
    expect(() => uf.union(1, 7)).toThrow(RangeError);
    expect(uf.componentCount()).toBe(2);
    expect(uf.sizeOf(0)).toBe(2);
  });
});

describe("UnionFind 많은 데이터", () => {
  it("100,000개를 사슬로 이어도 재귀 없이 동작한다", () => {
    const n = 100_000;
    const uf = new UnionFind(n);
    for (let i = 0; i + 1 < n; i++) expect(uf.union(i, i + 1)).toBe(true);
    expect(uf.componentCount()).toBe(1);
    expect(uf.sizeOf(0)).toBe(n);
    expect(uf.connected(0, n - 1)).toBe(true);
  });

  it("역순으로 이어도 정확하다", () => {
    const n = 50_000;
    const uf = new UnionFind(n);
    for (let i = n - 1; i > 0; i--) uf.union(i, i - 1);
    expect(uf.componentCount()).toBe(1);
    expect(uf.sizeOf(n - 1)).toBe(n);
  });

  it("짝수/홀수로 나누면 집합이 정확히 2개", () => {
    const n = 20_000;
    const uf = new UnionFind(n);
    for (let i = 2; i < n; i++) uf.union(i, i - 2);
    expect(uf.componentCount()).toBe(2);
    expect(uf.connected(0, n - 2)).toBe(true);
    expect(uf.connected(0, 1)).toBe(false);
    expect(uf.sizeOf(1)).toBe(n / 2);
  });
});

describe("순진한 구현과의 무작위 교차 검증", () => {
  for (const seed of [1, 2, 3, 42]) {
    it(`seed=${seed}`, () => {
      const n = 60;
      const rand = rng(seed);
      const pick = () => Math.floor(rand() * n);
      const uf = new UnionFind(n);
      const naive = new NaiveUF(n);
      for (let step = 0; step < 1500; step++) {
        const a = pick();
        const b = pick();
        if (rand() < 0.4) {
          expect(uf.union(a, b)).toBe(naive.union(a, b));
        } else {
          expect(uf.connected(a, b)).toBe(naive.connected(a, b));
        }
        if (step % 50 === 0) {
          expect(uf.componentCount()).toBe(naive.componentCount());
          expect(uf.sizeOf(a)).toBe(naive.sizeOf(a));
        }
      }
      expect(uf.componentCount()).toBe(naive.componentCount());
      for (let i = 0; i < n; i++) {
        expect(uf.sizeOf(i)).toBe(naive.sizeOf(i));
        for (let j = 0; j < n; j++) {
          expect(uf.connected(i, j)).toBe(naive.connected(i, j));
        }
      }
    });
  }
});

describe("KeyedUnionFind", () => {
  it("문자열 키로 makeSet/union/connected", () => {
    const uf = new KeyedUnionFind<string>();
    expect(uf.makeSet("a")).toBe(true);
    expect(uf.makeSet("a")).toBe(false);
    uf.makeSet("b");
    uf.makeSet("c");
    expect(uf.size).toBe(3);
    expect(uf.componentCount()).toBe(3);
    expect(uf.union("a", "b")).toBe(true);
    expect(uf.union("b", "a")).toBe(false);
    expect(uf.connected("a", "b")).toBe(true);
    expect(uf.connected("a", "c")).toBe(false);
    expect(uf.sizeOf("a")).toBe(2);
    expect(["a", "b"]).toContain(uf.find("a"));
    expect(uf.find("a")).toBe(uf.find("b"));
    expect(uf.find("c")).toBe("c");
  });

  it("객체 키는 참조로 구분된다", () => {
    const x = { id: 1 };
    const y = { id: 1 };
    const uf = new KeyedUnionFind<{ id: number }>();
    uf.makeSet(x);
    uf.makeSet(y);
    expect(uf.connected(x, y)).toBe(false);
    uf.union(x, y);
    expect(uf.find(x)).toBe(uf.find(y));
  });

  it("빈 상태와 미등록 키", () => {
    const uf = new KeyedUnionFind<number>();
    expect(uf.size).toBe(0);
    expect(uf.componentCount()).toBe(0);
    expect(uf.has(1)).toBe(false);
    expect(() => uf.find(1)).toThrow(RangeError);
    uf.makeSet(1);
    expect(() => uf.union(1, 2)).toThrow(RangeError);
    expect(() => uf.connected(2, 1)).toThrow(RangeError);
    expect(uf.componentCount()).toBe(1);
  });

  it("만 개 키를 처리하고 순진한 구현과 일치한다", () => {
    const n = 10_000;
    const uf = new KeyedUnionFind<string>();
    for (let i = 0; i < n; i++) uf.makeSet(`k${i}`);
    for (let i = 0; i + 3 < n; i++) uf.union(`k${i}`, `k${i + 3}`);
    expect(uf.componentCount()).toBe(3);
    expect(uf.connected("k0", `k${n - 1 - ((n - 1) % 3)}`)).toBe(true);
    expect(uf.connected("k0", "k1")).toBe(false);
  });

  it("무작위 연산 교차 검증", () => {
    const n = 40;
    const rand = rng(7);
    const uf = new KeyedUnionFind<string>();
    const naive = new NaiveUF(n);
    for (let i = 0; i < n; i++) uf.makeSet(`n${i}`);
    for (let step = 0; step < 800; step++) {
      const a = Math.floor(rand() * n);
      const b = Math.floor(rand() * n);
      if (rand() < 0.4) {
        expect(uf.union(`n${a}`, `n${b}`)).toBe(naive.union(a, b));
      } else {
        expect(uf.connected(`n${a}`, `n${b}`)).toBe(naive.connected(a, b));
      }
    }
    expect(uf.componentCount()).toBe(naive.componentCount());
  });
});

describe("활용 예: 크루스칼 MST", () => {
  it("간선을 가중치순으로 보며 사이클을 피한다", () => {
    const edges: [number, number, number][] = [
      [0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 3, 8], [3, 4, 3],
    ];
    const uf = new UnionFind(5);
    let total = 0;
    let used = 0;
    for (const [u, v, w] of [...edges].sort((a, b) => a[2] - b[2])) {
      if (uf.union(u, v)) {
        total += w;
        used++;
      }
    }
    expect(used).toBe(4);
    expect(total).toBe(1 + 2 + 3 + 5);
  });
});
