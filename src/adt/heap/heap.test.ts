import { describe, expect, it } from "vitest";
import { BinaryHeap, PriorityQueue } from "./heap";

/** 힙 성질 검사: 모든 노드가 부모보다 우선순위가 낮거나 같다. */
function isValidMinHeap(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[(i - 1) >> 1] > arr[i]) return false;
  }
  return true;
}

function drain<T>(heap: BinaryHeap<T>): T[] {
  const out: T[] = [];
  while (!heap.isEmpty()) out.push(heap.pop() as T);
  return out;
}

describe("BinaryHeap 기본 동작", () => {
  it("기본은 최소 힙이다", () => {
    const h = new BinaryHeap<number>();
    [5, 3, 8, 1, 4].forEach((v) => h.push(v));
    expect(h.peek()).toBe(1);
    expect(h.size).toBe(5);
    expect(drain(h)).toEqual([1, 3, 4, 5, 8]);
  });

  it("comparator로 최대 힙을 만들 수 있다", () => {
    const h = new BinaryHeap<number>((a, b) => b - a);
    [5, 3, 8, 1, 4].forEach((v) => h.push(v));
    expect(drain(h)).toEqual([8, 5, 4, 3, 1]);
  });

  it("객체를 키로 비교할 수 있다", () => {
    const h = new BinaryHeap<{ name: string; p: number }>((a, b) => a.p - b.p);
    h.push({ name: "c", p: 3 });
    h.push({ name: "a", p: 1 });
    h.push({ name: "b", p: 2 });
    expect(drain(h).map((x) => x.name)).toEqual(["a", "b", "c"]);
  });

  it("push 할 때마다 힙 성질이 유지된다", () => {
    const h = new BinaryHeap<number>();
    for (const v of [9, 4, 7, 1, 8, 2, 6, 3, 5, 0]) {
      h.push(v);
      expect(isValidMinHeap(h.toArray())).toBe(true);
    }
  });

  it("toArray는 복사본이라 수정해도 힙에 영향이 없다", () => {
    const h = BinaryHeap.from([3, 1, 2]);
    const arr = h.toArray();
    arr.length = 0;
    expect(h.size).toBe(3);
  });

  it("clear 후 비어 있고 다시 사용할 수 있다", () => {
    const h = BinaryHeap.from([3, 1, 2]);
    h.clear();
    expect(h.isEmpty()).toBe(true);
    expect(h.size).toBe(0);
    h.push(7);
    expect(h.peek()).toBe(7);
  });

  it("중복 값을 모두 보존한다", () => {
    const h = BinaryHeap.from([2, 2, 1, 1, 3, 3]);
    expect(drain(h)).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe("빈 상태와 경계", () => {
  it("빈 힙에서 pop/peek은 undefined", () => {
    const h = new BinaryHeap<number>();
    expect(h.isEmpty()).toBe(true);
    expect(h.pop()).toBeUndefined();
    expect(h.peek()).toBeUndefined();
    expect(h.size).toBe(0);
  });

  it("원소 1개: pop 후 비어 있다", () => {
    const h = new BinaryHeap<number>();
    h.push(42);
    expect(h.pop()).toBe(42);
    expect(h.isEmpty()).toBe(true);
    expect(h.pop()).toBeUndefined();
  });

  it("from([])은 빈 힙", () => {
    expect(BinaryHeap.from<number>([]).isEmpty()).toBe(true);
  });

  it("from은 원본 배열을 변경하지 않고, Iterable도 받는다", () => {
    const src = [5, 4, 3, 2, 1];
    const h = BinaryHeap.from(src);
    expect(src).toEqual([5, 4, 3, 2, 1]);
    expect(isValidMinHeap(h.toArray())).toBe(true);
    expect(drain(BinaryHeap.from(new Set([3, 1, 2])))).toEqual([1, 2, 3]);
  });

  it("from에 comparator를 전달할 수 있다", () => {
    expect(drain(BinaryHeap.from([1, 5, 3], (a, b) => b - a))).toEqual([5, 3, 1]);
  });

  it("문자열도 기본 비교로 동작한다", () => {
    expect(drain(BinaryHeap.from(["pear", "apple", "fig"]))).toEqual(["apple", "fig", "pear"]);
  });

  it("push와 pop을 섞어 써도 올바르다", () => {
    const h = new BinaryHeap<number>();
    h.push(5);
    h.push(2);
    expect(h.pop()).toBe(2);
    h.push(1);
    h.push(9);
    expect(h.pop()).toBe(1);
    expect(h.pop()).toBe(5);
    expect(h.pop()).toBe(9);
  });
});

describe("많은 데이터 / 무작위", () => {
  // 재현 가능한 의사난수(LCG)
  function makeRng(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s;
    };
  }

  it("무작위 데이터를 push/pop 하면 Array.sort 결과와 같다", () => {
    const rng = makeRng(1);
    const data = Array.from({ length: 5000 }, () => (rng() % 2001) - 1000);
    const h = new BinaryHeap<number>();
    data.forEach((v) => h.push(v));
    expect(drain(h)).toEqual([...data].sort((a, b) => a - b));
  });

  it("BinaryHeap.from(heapify)도 Array.sort와 같다 (여러 크기)", () => {
    const rng = makeRng(7);
    for (const n of [1, 2, 3, 10, 100, 1023, 1024, 5000]) {
      const data = Array.from({ length: n }, () => rng() % 500);
      const h = BinaryHeap.from(data);
      expect(isValidMinHeap(h.toArray())).toBe(true);
      expect(drain(h)).toEqual([...data].sort((a, b) => a - b));
    }
  });

  it("최대 힙도 내림차순 정렬과 같다", () => {
    const rng = makeRng(99);
    const data = Array.from({ length: 2000 }, () => rng() % 10000);
    const h = BinaryHeap.from(data, (a, b) => b - a);
    expect(drain(h)).toEqual([...data].sort((a, b) => b - a));
  });

  it("무작위 push/pop 혼합을 단순 모델(정렬 배열)과 비교한다", () => {
    const rng = makeRng(2024);
    const h = new BinaryHeap<number>();
    const model: number[] = [];
    for (let i = 0; i < 20000; i++) {
      if (rng() % 3 !== 0 || model.length === 0) {
        const v = rng() % 1000;
        h.push(v);
        model.push(v);
        model.sort((a, b) => a - b);
      } else {
        expect(h.pop()).toBe(model.shift());
      }
      expect(h.size).toBe(model.length);
    }
  });

  it("10만 개도 처리한다", () => {
    const rng = makeRng(5);
    const data = Array.from({ length: 100000 }, () => rng());
    const out = drain(BinaryHeap.from(data));
    expect(out).toEqual([...data].sort((a, b) => a - b));
  });
});

describe("PriorityQueue", () => {
  it("기본은 작은 값 우선", () => {
    const q = new PriorityQueue<number>();
    [3, 1, 2].forEach((v) => q.enqueue(v));
    expect(q.size).toBe(3);
    expect(q.peek()).toBe(1);
    expect([q.dequeue(), q.dequeue(), q.dequeue()]).toEqual([1, 2, 3]);
    expect(q.isEmpty()).toBe(true);
  });

  it("빈 큐에서 dequeue/peek은 undefined", () => {
    const q = new PriorityQueue<string>();
    expect(q.dequeue()).toBeUndefined();
    expect(q.peek()).toBeUndefined();
  });

  it("comparator와 clear", () => {
    const q = new PriorityQueue<{ job: string; pri: number }>((a, b) => b.pri - a.pri);
    q.enqueue({ job: "low", pri: 1 });
    q.enqueue({ job: "high", pri: 10 });
    expect(q.dequeue()?.job).toBe("high");
    q.clear();
    expect(q.size).toBe(0);
  });

  it("다익스트라 스타일: [거리, 노드] 쌍을 거리순으로 꺼낸다", () => {
    const q = new PriorityQueue<[number, string]>((a, b) => a[0] - b[0]);
    q.enqueue([7, "C"]);
    q.enqueue([2, "A"]);
    q.enqueue([5, "B"]);
    expect([q.dequeue()![1], q.dequeue()![1], q.dequeue()![1]]).toEqual(["A", "B", "C"]);
  });
});
