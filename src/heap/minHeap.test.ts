import { describe, it, expect, beforeEach } from "vitest";
import { MinHeap } from "./minHeap";

describe("최소힙", () => {
  it("최소힙을 생성할 수 있다.", () => {
    expect(new MinHeap()).toBeInstanceOf(MinHeap);
  });

  it("최소힙에 데이터를 추가할 수 있다.", () => {
    const heap = new MinHeap();
    heap.insert(1);
    heap.insert(2);
    heap.insert(3);
    expect(heap.size()).toBe(3);
  });

  it("최소힙에 [1, 3, 10, 2, 5]를 추가하고 최소값을 추출하면 1, 2, 3이 나온다.", () => {
    const heap = new MinHeap();
    heap.insert(1);
    heap.insert(3);
    heap.insert(10);
    heap.insert(2);
    heap.insert(5);
    expect(heap.extract()).toBe(1);
    expect(heap.extract()).toBe(2);
    expect(heap.extract()).toBe(3);
  });
});

describe("최소힙에 데이터를 추가하고 추출할 수 있다.", () => {
  beforeEach(() => {
    console.clear();
  });
  it.each([
    {
      input: "[0, 12345678, 1, 2, 0, 0, 0, 0, 32]",
      output: [0, 1, 2, 12345678, 0],
    },
    {
      input: "[1, 2, 10, 20, 30, 0, 30, 30, 30, 0, 0, 0, 0, 0, 0, 0]",
      output: [1, 2, 10, 20, 30, 30, 30, 30],
    },
    {
      input: "[1,2,3,0,0,0,0]",
      output: [1, 2, 3, 0],
    },
  ])("$input의 결과는 $output이다", ({ input, output }) => {
    const heap = new MinHeap<number>();
    const result: number[] = [];
    let parsedInput = JSON.parse(input) as number[];
    parsedInput.forEach((v) => {
      if (v !== 0) heap.insert(v);
      else result.push(heap.extract() ?? 0);
      console.log(heap.inner);
    });
    expect(result).toEqual(output);
  });
});
