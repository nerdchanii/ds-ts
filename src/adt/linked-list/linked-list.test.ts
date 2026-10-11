import { describe, it, expect } from "vitest";
import { SinglyLinkedList, DoublyLinkedList } from "./linked-list";

// 두 구현이 같은 ADT 를 만족하는지 동일한 테스트로 검증한다.
const impls = [
  ["SinglyLinkedList", () => new SinglyLinkedList<number>()],
  ["DoublyLinkedList", () => new DoublyLinkedList<number>()],
] as const;

describe.each(impls)("%s", (_name, make) => {
  describe("정상 케이스", () => {
    it("pushBack / pushFront 순서", () => {
      const l = make();
      l.pushBack(2);
      l.pushBack(3);
      l.pushFront(1);
      expect(l.toArray()).toEqual([1, 2, 3]);
      expect(l.size).toBe(3);
      expect(l.isEmpty()).toBe(false);
    });

    it("popFront / popBack", () => {
      const l = make();
      [1, 2, 3, 4].forEach((v) => l.pushBack(v));
      expect(l.popFront()).toBe(1);
      expect(l.popBack()).toBe(4);
      expect(l.toArray()).toEqual([2, 3]);
    });

    it("insertAt: 앞/중간/뒤", () => {
      const l = make();
      l.insertAt(0, 10); // [10]
      l.insertAt(1, 30); // [10,30]
      l.insertAt(1, 20); // [10,20,30]
      l.insertAt(3, 40); // [10,20,30,40]
      expect(l.toArray()).toEqual([10, 20, 30, 40]);
    });

    it("removeAt: 앞/중간/뒤", () => {
      const l = make();
      [1, 2, 3, 4, 5].forEach((v) => l.pushBack(v));
      expect(l.removeAt(2)).toBe(3);
      expect(l.removeAt(0)).toBe(1);
      expect(l.removeAt(2)).toBe(5);
      expect(l.toArray()).toEqual([2, 4]);
      l.pushBack(9); // 마지막 제거 후에도 tail 이 올바른지 확인
      expect(l.toArray()).toEqual([2, 4, 9]);
    });

    it("get / indexOf", () => {
      const l = make();
      [5, 6, 7, 6].forEach((v) => l.pushBack(v));
      expect(l.get(0)).toBe(5);
      expect(l.get(3)).toBe(6);
      expect(l.indexOf(6)).toBe(1); // 처음 일치하는 위치
      expect(l.indexOf(99)).toBe(-1);
    });

    it("reverse 후 head/tail 연산이 일관됨", () => {
      const l = make();
      [1, 2, 3, 4].forEach((v) => l.pushBack(v));
      l.reverse();
      expect(l.toArray()).toEqual([4, 3, 2, 1]);
      l.pushBack(0);
      l.pushFront(9);
      expect(l.toArray()).toEqual([9, 4, 3, 2, 1, 0]);
      expect(l.popBack()).toBe(0);
      expect(l.popFront()).toBe(9);
      l.reverse();
      expect(l.toArray()).toEqual([1, 2, 3, 4]);
    });

    it("iterator / spread / for-of", () => {
      const l = make();
      [1, 2, 3].forEach((v) => l.pushBack(v));
      expect([...l]).toEqual([1, 2, 3]);
      const out: number[] = [];
      for (const v of l) out.push(v);
      expect(out).toEqual([1, 2, 3]);
    });

    it("clear", () => {
      const l = make();
      [1, 2, 3].forEach((v) => l.pushBack(v));
      l.clear();
      expect(l.size).toBe(0);
      expect(l.isEmpty()).toBe(true);
      expect(l.toArray()).toEqual([]);
      l.pushBack(7);
      expect(l.toArray()).toEqual([7]);
    });
  });

  describe("빈 상태 / 경계", () => {
    it("빈 리스트", () => {
      const l = make();
      expect(l.size).toBe(0);
      expect(l.isEmpty()).toBe(true);
      expect(l.popFront()).toBeUndefined();
      expect(l.popBack()).toBeUndefined();
      expect(l.indexOf(1)).toBe(-1);
      expect(l.toArray()).toEqual([]);
      l.reverse(); // 예외 없이 동작
      expect(l.isEmpty()).toBe(true);
    });

    it("원소 1개: pop 후 비고, 다시 사용 가능", () => {
      const l = make();
      l.pushBack(1);
      expect(l.popBack()).toBe(1);
      expect(l.isEmpty()).toBe(true);
      l.pushFront(2);
      expect(l.popFront()).toBe(2);
      l.pushBack(3);
      expect(l.toArray()).toEqual([3]);
      l.reverse();
      expect(l.toArray()).toEqual([3]);
    });

    it("범위 밖 인덱스는 RangeError", () => {
      const l = make();
      expect(() => l.get(0)).toThrow(RangeError);
      expect(() => l.removeAt(0)).toThrow(RangeError);
      expect(() => l.insertAt(1, 1)).toThrow(RangeError);
      expect(() => l.insertAt(-1, 1)).toThrow(RangeError);
      l.pushBack(1);
      l.pushBack(2);
      expect(() => l.get(2)).toThrow(RangeError);
      expect(() => l.get(-1)).toThrow(RangeError);
      expect(() => l.get(1.5)).toThrow(RangeError);
      expect(() => l.get(NaN)).toThrow(RangeError);
      expect(() => l.removeAt(2)).toThrow(RangeError);
      expect(() => l.insertAt(3, 1)).toThrow(RangeError);
      expect(l.toArray()).toEqual([1, 2]); // 실패한 연산은 상태를 바꾸지 않음
    });

    it("insertAt(size) 는 허용 (맨 뒤 삽입)", () => {
      const l = make();
      l.pushBack(1);
      l.insertAt(1, 2);
      expect(l.toArray()).toEqual([1, 2]);
      l.pushBack(3);
      expect(l.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe("많은 데이터", () => {
    it("100,000 개 삽입/순회/제거", () => {
      const N = 100_000;
      const l = make();
      for (let i = 0; i < N; i++) l.pushBack(i);
      expect(l.size).toBe(N);
      expect(l.get(0)).toBe(0);
      expect(l.get(N - 1)).toBe(N - 1);
      let sum = 0;
      for (const v of l) sum += v;
      expect(sum).toBe((N * (N - 1)) / 2);
      l.reverse();
      expect(l.get(0)).toBe(N - 1);
      expect(l.indexOf(0)).toBe(N - 1);
      for (let i = 0; i < N; i++) l.popFront();
      expect(l.isEmpty()).toBe(true);
    });

    it("배열 기반 모델과 무작위 연산 결과 일치", () => {
      const l = make();
      const model: number[] = [];
      let seed = 12345;
      const rand = (n: number) => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed % n;
      };
      for (let step = 0; step < 3000; step++) {
        const op = rand(7);
        const v = rand(1000);
        if (op === 0) { l.pushFront(v); model.unshift(v); }
        else if (op === 1) { l.pushBack(v); model.push(v); }
        else if (op === 2) { expect(l.popFront()).toBe(model.shift()); }
        else if (op === 3) { expect(l.popBack()).toBe(model.pop()); }
        else if (op === 4) {
          const i = rand(model.length + 1);
          l.insertAt(i, v); model.splice(i, 0, v);
        } else if (op === 5 && model.length > 0) {
          const i = rand(model.length);
          expect(l.removeAt(i)).toBe(model.splice(i, 1)[0]);
        } else if (op === 6 && rand(10) === 0) {
          l.reverse(); model.reverse();
        }
        expect(l.size).toBe(model.length);
      }
      expect(l.toArray()).toEqual(model);
    });
  });
});

describe("제네릭", () => {
  it("문자열/객체도 저장", () => {
    const s = new SinglyLinkedList<string>();
    s.pushBack("a");
    s.pushBack("b");
    expect(s.toArray()).toEqual(["a", "b"]);
    const o = { id: 1 };
    const d = new DoublyLinkedList<{ id: number }>();
    d.pushBack(o);
    expect(d.indexOf(o)).toBe(0);
    expect(d.indexOf({ id: 1 })).toBe(-1); // === 비교이므로 참조가 달라 못 찾음
  });
});
