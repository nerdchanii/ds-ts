import { describe, it, expect, beforeEach } from "vitest";
import { heap } from "./heap";

describe("힙", () => {
  it("힙을 생성할 수 있다.", () => {
    expect(new heap()).toBeInstanceOf(heap);
  });

  it("힙에 데이터를 추가할 수 있다.", () => {
    const h = new heap<number>();
    h.insert(1);
    h.insert(2);
    h.insert(3);
    expect(h.size).toBe(3);
  });

  describe("최소힙", () => {
    let minHeap: heap<number>;

    beforeEach(() => {
      minHeap = new heap<number>((a, b) => a > b);
    });

    it("최소힙에서 최소값을 확인할 수 있다", () => {
      minHeap.insert(3);
      minHeap.insert(1);
      minHeap.insert(2);
      expect(minHeap.peek()).toBe(1);
    });

    it("최소힙에서 값을 추출할 수 있다", () => {
      minHeap.insert(3);
      minHeap.insert(1);
      minHeap.insert(2);
      expect(minHeap.extract()).toBe(1);
      expect(minHeap.extract()).toBe(2);
      expect(minHeap.extract()).toBe(3);
    });
  });

  describe("최대힙", () => {
    let maxHeap: heap<number>;

    beforeEach(() => {
      maxHeap = new heap<number>((a, b) => a < b);
    });

    it("최대힙에서 최대값을 확인할 수 있다", () => {
      maxHeap.insert(3);
      maxHeap.insert(1);
      maxHeap.insert(2);
      expect(maxHeap.peek()).toBe(3);
    });

    it("최대힙에서 값을 추출할 수 있다", () => {
      maxHeap.insert(1);
      maxHeap.insert(3);
      maxHeap.insert(2);
      expect(maxHeap.extract()).toBe(3);
      expect(maxHeap.extract()).toBe(2);
      expect(maxHeap.extract()).toBe(1);
    });
  });

  it("힙이 비어있는지 확인할 수 있다", () => {
    const h = new heap<number>();
    expect(h.isEmpty()).toBe(true);
    h.insert(1);
    expect(h.isEmpty()).toBe(false);
  });
});

interface User {
  name: string;
  age: number;
}

describe("Data가 primitie한 값이 아닐때에도 힙을 구성할 수 있다.", () => {
  it("{name: string, age: number} 타입을 age를 이용하여 힙을 구성할 수 있다", () => {
    const h = new heap<User>((a, b) => a.age > b.age);
    h.insert({
      name: "chanii",
      age: 20,
    });
    h.insert({
      name: "hooni",
      age: 30,
    });

    expect(h.extract()).toEqual({ name: "chanii", age: 20 });
    expect(h.extract()).toEqual({ name: "hooni", age: 30 });
  });
});
