import { describe, it, expect } from "vitest";
import { Queue, Deque } from "./queue";

describe("Queue", () => {
  it("FIFO 순서로 동작한다", () => {
    const q = new Queue<number>();
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    expect(q.size).toBe(3);
    expect(q.peek()).toBe(1);
    expect(q.dequeue()).toBe(1);
    expect(q.dequeue()).toBe(2);
    expect(q.dequeue()).toBe(3);
    expect(q.isEmpty()).toBe(true);
  });

  it("빈 큐에서 dequeue/peek 는 undefined", () => {
    const q = new Queue<string>();
    expect(q.isEmpty()).toBe(true);
    expect(q.dequeue()).toBeUndefined();
    expect(q.peek()).toBeUndefined();
    expect(q.size).toBe(0);
    expect(q.toArray()).toEqual([]);
  });

  it("undefined 값도 원소로 저장할 수 있다 (size 로 구분)", () => {
    const q = new Queue<number | undefined>();
    q.enqueue(undefined);
    expect(q.size).toBe(1);
    expect(q.isEmpty()).toBe(false);
    expect(q.dequeue()).toBeUndefined();
    expect(q.size).toBe(0);
  });

  it("clear 후 재사용 가능", () => {
    const q = new Queue<number>();
    [1, 2, 3, 4, 5, 6].forEach((x) => q.enqueue(x));
    q.clear();
    expect(q.size).toBe(0);
    expect(q.toArray()).toEqual([]);
    q.enqueue(9);
    expect(q.toArray()).toEqual([9]);
  });

  it("toArray 와 iterator 는 앞에서 뒤 순서", () => {
    const q = new Queue<number>();
    [1, 2, 3].forEach((x) => q.enqueue(x));
    expect(q.toArray()).toEqual([1, 2, 3]);
    expect([...q]).toEqual([1, 2, 3]);
    expect(q.size).toBe(3); // 순회가 큐를 소비하지 않음
  });

  it("wrap-around: head 가 버퍼 끝을 넘어가도 순서 유지", () => {
    const q = new Queue<number>(4);
    [1, 2, 3, 4].forEach((x) => q.enqueue(x));
    expect(q.dequeue()).toBe(1);
    expect(q.dequeue()).toBe(2);
    q.enqueue(5); // 인덱스 0 으로 감김
    q.enqueue(6); // 인덱스 1
    expect(q.capacity).toBe(4); // 확장 없이 재사용
    expect(q.toArray()).toEqual([3, 4, 5, 6]);
    expect(q.peek()).toBe(3);
  });

  it("resize: wrap 된 상태에서 확장해도 순서 유지", () => {
    const q = new Queue<number>(4);
    [1, 2, 3, 4].forEach((x) => q.enqueue(x));
    q.dequeue();
    q.dequeue();
    q.enqueue(5);
    q.enqueue(6); // 가득 참 + wrap
    q.enqueue(7); // 확장 발생
    expect(q.capacity).toBe(8);
    expect(q.toArray()).toEqual([3, 4, 5, 6, 7]);
    expect(q.dequeue()).toBe(3);
  });

  it("용량은 2배씩 늘어난다", () => {
    const q = new Queue<number>(2);
    expect(q.capacity).toBe(2);
    q.enqueue(1);
    q.enqueue(2);
    expect(q.capacity).toBe(2);
    q.enqueue(3);
    expect(q.capacity).toBe(4);
    q.enqueue(4);
    q.enqueue(5);
    expect(q.capacity).toBe(8);
  });

  it("잘못된 초기 용량은 RangeError", () => {
    expect(() => new Queue<number>(0)).toThrow(RangeError);
    expect(() => new Queue<number>(1.5)).toThrow(RangeError);
  });

  it("많은 데이터: 100,000개 enqueue/dequeue", () => {
    const q = new Queue<number>();
    const n = 100_000;
    for (let i = 0; i < n; i++) q.enqueue(i);
    expect(q.size).toBe(n);
    for (let i = 0; i < n; i++) expect(q.dequeue()).toBe(i);
    expect(q.isEmpty()).toBe(true);
  });

  it("많은 데이터: 번갈아 넣고 빼도 배열 모델과 일치", () => {
    const q = new Queue<number>(2);
    const model: number[] = [];
    let seed = 12345;
    const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff);
    for (let i = 0; i < 20_000; i++) {
      if (rand() % 3 !== 0) {
        q.enqueue(i);
        model.push(i);
      } else {
        expect(q.dequeue()).toBe(model.shift());
      }
    }
    expect(q.toArray()).toEqual(model);
  });

  it("BFS 예시: 너비 우선 순회", () => {
    const graph: Record<string, string[]> = {
      A: ["B", "C"], B: ["D"], C: ["D", "E"], D: ["F"], E: ["F"], F: [],
    };
    const visited = new Set<string>(["A"]);
    const order: string[] = [];
    const q = new Queue<string>();
    q.enqueue("A");
    while (!q.isEmpty()) {
      const cur = q.dequeue() as string;
      order.push(cur);
      for (const next of graph[cur]) {
        if (!visited.has(next)) {
          visited.add(next);
          q.enqueue(next);
        }
      }
    }
    expect(order).toEqual(["A", "B", "C", "D", "E", "F"]);
  });
});

describe("Deque", () => {
  it("양끝 push/pop/peek", () => {
    const d = new Deque<number>();
    d.pushBack(2);
    d.pushBack(3);
    d.pushFront(1);
    d.pushFront(0);
    expect(d.toArray()).toEqual([0, 1, 2, 3]);
    expect(d.peekFront()).toBe(0);
    expect(d.peekBack()).toBe(3);
    expect(d.popFront()).toBe(0);
    expect(d.popBack()).toBe(3);
    expect(d.toArray()).toEqual([1, 2]);
    expect(d.size).toBe(2);
  });

  it("빈 Deque 경계", () => {
    const d = new Deque<number>();
    expect(d.isEmpty()).toBe(true);
    expect(d.popFront()).toBeUndefined();
    expect(d.popBack()).toBeUndefined();
    expect(d.peekFront()).toBeUndefined();
    expect(d.peekBack()).toBeUndefined();
    expect(d.get(0)).toBeUndefined();
  });

  it("원소 1개일 때 front/back 이 같다", () => {
    const d = new Deque<string>();
    d.pushFront("x");
    expect(d.peekFront()).toBe("x");
    expect(d.peekBack()).toBe("x");
    expect(d.popBack()).toBe("x");
    expect(d.isEmpty()).toBe(true);
  });

  it("pushFront 만으로 head 가 앞쪽으로 wrap 된다", () => {
    const d = new Deque<number>(4);
    for (let i = 1; i <= 4; i++) d.pushFront(i);
    expect(d.capacity).toBe(4);
    expect(d.toArray()).toEqual([4, 3, 2, 1]);
  });

  it("pushFront 로 가득 찬 뒤 확장해도 순서 유지", () => {
    const d = new Deque<number>(4);
    for (let i = 1; i <= 5; i++) d.pushFront(i);
    expect(d.capacity).toBe(8);
    expect(d.toArray()).toEqual([5, 4, 3, 2, 1]);
    d.pushBack(0);
    expect(d.toArray()).toEqual([5, 4, 3, 2, 1, 0]);
  });

  it("popBack 이 wrap 된 위치에서도 올바르다", () => {
    const d = new Deque<number>(4);
    [1, 2, 3, 4].forEach((x) => d.pushBack(x));
    d.popFront();
    d.popFront();
    d.pushBack(5);
    d.pushBack(6); // 논리: 3,4,5,6 (물리 wrap)
    expect(d.popBack()).toBe(6);
    expect(d.popBack()).toBe(5);
    expect(d.toArray()).toEqual([3, 4]);
  });

  it("get 으로 인덱스 접근, 범위 밖은 undefined", () => {
    const d = new Deque<number>();
    [10, 20, 30].forEach((x) => d.pushBack(x));
    expect(d.get(0)).toBe(10);
    expect(d.get(2)).toBe(30);
    expect(d.get(3)).toBeUndefined();
    expect(d.get(-1)).toBeUndefined();
  });

  it("iterator 와 clear", () => {
    const d = new Deque<number>();
    [1, 2, 3].forEach((x) => d.pushBack(x));
    expect([...d]).toEqual([1, 2, 3]);
    d.clear();
    expect(d.size).toBe(0);
    expect([...d]).toEqual([]);
  });

  it("많은 데이터: 양끝 번갈아 100,000개", () => {
    const d = new Deque<number>(2);
    const n = 100_000;
    for (let i = 0; i < n; i++) {
      if (i % 2 === 0) d.pushBack(i);
      else d.pushFront(i);
    }
    expect(d.size).toBe(n);
    expect(d.peekFront()).toBe(n - 1);
    expect(d.peekBack()).toBe(n - 2);
    let sum = 0;
    while (!d.isEmpty()) sum += d.popFront() as number;
    expect(sum).toBe((n * (n - 1)) / 2);
  });

  it("무작위 연산이 배열 모델과 일치", () => {
    const d = new Deque<number>(2);
    const model: number[] = [];
    let seed = 987;
    const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff);
    for (let i = 0; i < 30_000; i++) {
      switch (rand() % 4) {
        case 0: d.pushFront(i); model.unshift(i); break;
        case 1: d.pushBack(i); model.push(i); break;
        case 2: expect(d.popFront()).toBe(model.shift()); break;
        default: expect(d.popBack()).toBe(model.pop()); break;
      }
    }
    expect(d.toArray()).toEqual(model);
  });

  it("슬라이딩 윈도우 최댓값 (단조 덱) 예시", () => {
    const nums = [1, 3, -1, -3, 5, 3, 6, 7];
    const k = 3;
    const dq = new Deque<number>(); // 인덱스 저장
    const result: number[] = [];
    nums.forEach((v, i) => {
      while (!dq.isEmpty() && nums[dq.peekBack() as number] <= v) dq.popBack();
      dq.pushBack(i);
      if ((dq.peekFront() as number) <= i - k) dq.popFront();
      if (i >= k - 1) result.push(nums[dq.peekFront() as number]);
    });
    expect(result).toEqual([3, 3, 5, 5, 6, 7]);
  });
});
