import { describe, it, expect } from "vitest";
import { DynamicArray } from "./dynamic-array";

describe("DynamicArray 기본 동작", () => {
  it("push/get/size", () => {
    const a = new DynamicArray<number>();
    a.push(10);
    a.push(20);
    a.push(30);
    expect(a.size()).toBe(3);
    expect(a.get(0)).toBe(10);
    expect(a.get(2)).toBe(30);
  });

  it("set은 값을 교체한다", () => {
    const a = new DynamicArray<string>();
    a.push("a");
    a.push("b");
    a.set(1, "z");
    expect(a.toArray()).toEqual(["a", "z"]);
  });

  it("pop은 LIFO 순서로 반환한다", () => {
    const a = new DynamicArray<number>();
    [1, 2, 3].forEach((x) => a.push(x));
    expect(a.pop()).toBe(3);
    expect(a.pop()).toBe(2);
    expect(a.size()).toBe(1);
  });

  it("insertAt: 앞/중간/끝", () => {
    const a = new DynamicArray<number>();
    [2, 4].forEach((x) => a.push(x));
    a.insertAt(0, 1);
    a.insertAt(2, 3);
    a.insertAt(4, 5);
    expect(a.toArray()).toEqual([1, 2, 3, 4, 5]);
  });

  it("removeAt: 앞/중간/끝과 반환값", () => {
    const a = new DynamicArray<number>();
    [1, 2, 3, 4, 5].forEach((x) => a.push(x));
    expect(a.removeAt(0)).toBe(1);
    expect(a.removeAt(1)).toBe(3);
    expect(a.removeAt(2)).toBe(5);
    expect(a.toArray()).toEqual([2, 4]);
  });

  it("iterator / spread / for...of", () => {
    const a = new DynamicArray<number>();
    [1, 2, 3].forEach((x) => a.push(x));
    expect([...a]).toEqual([1, 2, 3]);
    const seen: number[] = [];
    for (const x of a) seen.push(x);
    expect(seen).toEqual([1, 2, 3]);
  });

  it("undefined/null 값도 저장할 수 있다", () => {
    const a = new DynamicArray<number | undefined>();
    a.push(undefined);
    a.push(1);
    expect(a.size()).toBe(2);
    expect(a.get(0)).toBeUndefined();
    expect(a.pop()).toBe(1);
    expect(a.pop()).toBeUndefined();
  });

  it("toArray는 복사본이다", () => {
    const a = new DynamicArray<number>();
    a.push(1);
    const arr = a.toArray();
    arr.push(99);
    expect(a.size()).toBe(1);
  });
});

describe("빈 상태 / 경계", () => {
  it("새 배열은 비어 있고 최소 용량이다", () => {
    const a = new DynamicArray<number>();
    expect(a.isEmpty()).toBe(true);
    expect(a.size()).toBe(0);
    expect(a.capacity()).toBe(DynamicArray.MIN_CAPACITY);
    expect(a.toArray()).toEqual([]);
    expect([...a]).toEqual([]);
  });

  it("빈 배열 pop/get/set/removeAt은 RangeError", () => {
    const a = new DynamicArray<number>();
    expect(() => a.pop()).toThrow(RangeError);
    expect(() => a.get(0)).toThrow(RangeError);
    expect(() => a.set(0, 1)).toThrow(RangeError);
    expect(() => a.removeAt(0)).toThrow(RangeError);
  });

  it("범위 밖 인덱스(음수, size, 소수, NaN)는 RangeError", () => {
    const a = new DynamicArray<number>();
    [1, 2, 3].forEach((x) => a.push(x));
    expect(() => a.get(-1)).toThrow(RangeError);
    expect(() => a.get(3)).toThrow(RangeError);
    expect(() => a.get(1.5)).toThrow(RangeError);
    expect(() => a.get(NaN)).toThrow(RangeError);
    expect(() => a.set(3, 0)).toThrow(RangeError);
    expect(() => a.removeAt(3)).toThrow(RangeError);
    expect(() => a.insertAt(-1, 0)).toThrow(RangeError);
    expect(() => a.insertAt(4, 0)).toThrow(RangeError); // size+1
    expect(() => a.insertAt(3, 0)).not.toThrow(); // size는 허용
  });

  it("빈 배열에서 insertAt(0)은 허용된다", () => {
    const a = new DynamicArray<number>();
    a.insertAt(0, 7);
    expect(a.toArray()).toEqual([7]);
  });

  it("잘못된 initialCapacity는 RangeError, 작은 값은 최소 용량으로 보정", () => {
    expect(() => new DynamicArray<number>(-1)).toThrow(RangeError);
    expect(() => new DynamicArray<number>(1.5)).toThrow(RangeError);
    expect(new DynamicArray<number>(0).capacity()).toBe(DynamicArray.MIN_CAPACITY);
    expect(new DynamicArray<number>(10).capacity()).toBe(10);
  });

  it("clear 후 빈 상태·최소 용량이며 재사용 가능", () => {
    const a = new DynamicArray<number>();
    for (let i = 0; i < 100; i++) a.push(i);
    a.clear();
    expect(a.isEmpty()).toBe(true);
    expect(a.capacity()).toBe(DynamicArray.MIN_CAPACITY);
    a.push(1);
    expect(a.toArray()).toEqual([1]);
  });
});

describe("확장/축소 경계 (capacity 관찰)", () => {
  it("가득 찬 뒤 다음 push에서 2배로 확장", () => {
    const a = new DynamicArray<number>();
    for (let i = 0; i < 4; i++) a.push(i);
    expect(a.capacity()).toBe(4); // 가득 찼지만 아직 확장 전
    a.push(4);
    expect(a.capacity()).toBe(8);
    for (let i = 5; i < 8; i++) a.push(i);
    expect(a.capacity()).toBe(8);
    a.push(8);
    expect(a.capacity()).toBe(16);
  });

  it("insertAt도 가득 차면 확장한다", () => {
    const a = new DynamicArray<number>();
    for (let i = 0; i < 4; i++) a.push(i);
    a.insertAt(0, 99);
    expect(a.capacity()).toBe(8);
    expect(a.toArray()).toEqual([99, 0, 1, 2, 3]);
  });

  it("사용량이 용량의 1/4 이하가 되면 절반으로 축소", () => {
    const a = new DynamicArray<number>();
    for (let i = 0; i < 9; i++) a.push(i); // capacity 16
    expect(a.capacity()).toBe(16);
    for (let i = 0; i < 4; i++) a.pop(); // size 5 -> 아직 > 4
    expect(a.size()).toBe(5);
    expect(a.capacity()).toBe(16);
    a.pop(); // size 4 == 16/4 -> 축소
    expect(a.capacity()).toBe(8);
    a.pop(); // size 3 (> 8/4)
    expect(a.capacity()).toBe(8);
    a.pop(); // size 2 == 8/4 -> 축소
    expect(a.capacity()).toBe(4);
  });

  it("최소 용량 아래로는 축소하지 않는다", () => {
    const a = new DynamicArray<number>();
    a.push(1);
    a.push(2);
    a.pop();
    a.pop();
    expect(a.capacity()).toBe(DynamicArray.MIN_CAPACITY);
  });

  it("removeAt도 축소를 일으킨다", () => {
    const a = new DynamicArray<number>();
    for (let i = 0; i < 9; i++) a.push(i); // capacity 16
    for (let i = 0; i < 5; i++) a.removeAt(0); // size 4 -> 축소
    expect(a.capacity()).toBe(8);
    expect(a.toArray()).toEqual([5, 6, 7, 8]);
  });

  it("확장·축소 경계에서 push/pop을 반복해도 thrashing이 없다", () => {
    // 확장 직후(size 5, cap 8) 에서 pop하면 size 4 > 8/4 이므로 축소 안 됨
    const a = new DynamicArray<number>();
    for (let i = 0; i < 5; i++) a.push(i);
    expect(a.capacity()).toBe(8);
    for (let k = 0; k < 10; k++) {
      a.pop();
      a.push(k);
      expect(a.capacity()).toBe(8);
    }
  });

  it("축소/확장 후에도 원소가 보존된다", () => {
    const a = new DynamicArray<number>();
    for (let i = 0; i < 20; i++) a.push(i);
    while (a.size() > 3) a.pop();
    expect(a.toArray()).toEqual([0, 1, 2]);
    expect(a.capacity()).toBe(8); // 32 -> 16 -> 8 (size 3 > 8/4 이므로 여기서 멈춤)
  });
});

describe("많은 데이터", () => {
  it("100,000개 push 후 값·용량 확인, 모두 pop하면 최소 용량 복귀", () => {
    const n = 100_000;
    const a = new DynamicArray<number>();
    for (let i = 0; i < n; i++) a.push(i);
    expect(a.size()).toBe(n);
    expect(a.capacity()).toBe(131072); // 2^17
    expect(a.get(0)).toBe(0);
    expect(a.get(n - 1)).toBe(n - 1);
    for (let i = n - 1; i >= 0; i--) expect(a.pop()).toBe(i);
    expect(a.isEmpty()).toBe(true);
    expect(a.capacity()).toBe(DynamicArray.MIN_CAPACITY);
  });

  it("내장 배열과 무작위 연산 결과가 항상 일치(모델 기반 테스트)", () => {
    // 간단한 선형 합동 생성기로 재현 가능한 난수 사용
    let seed = 12345;
    const rand = (m: number) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % m;
    };
    const a = new DynamicArray<number>();
    const model: number[] = [];
    for (let step = 0; step < 5000; step++) {
      const op = rand(5);
      if (op === 0 || op === 1) {
        a.push(step);
        model.push(step);
      } else if (op === 2 && model.length > 0) {
        expect(a.pop()).toBe(model.pop());
      } else if (op === 3) {
        const idx = rand(model.length + 1);
        a.insertAt(idx, step);
        model.splice(idx, 0, step);
      } else if (op === 4 && model.length > 0) {
        const idx = rand(model.length);
        expect(a.removeAt(idx)).toBe(model.splice(idx, 1)[0]);
      }
      expect(a.size()).toBe(model.length);
      expect(a.capacity()).toBeGreaterThanOrEqual(a.size());
    }
    expect(a.toArray()).toEqual(model);
  });
});
