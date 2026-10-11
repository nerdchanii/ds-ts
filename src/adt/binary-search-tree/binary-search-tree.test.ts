import { describe, it, expect } from "vitest";
import { BinarySearchTree } from "./binary-search-tree";

/** 예시 트리:      8
 *               /   \
 *              3     10
 *             / \      \
 *            1   6      14
 *               / \    /
 *              4   7  13
 */
const build = (values = [8, 3, 10, 1, 6, 14, 4, 7, 13]) => {
  const t = new BinarySearchTree<number>();
  values.forEach((v) => t.insert(v));
  return t;
};

// 재현 가능한 의사 난수 (mulberry32)
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

describe("BinarySearchTree - 정상 케이스", () => {
  it("삽입 후 has / size / min / max", () => {
    const t = build();
    expect(t.size).toBe(9);
    expect(t.has(7)).toBe(true);
    expect(t.has(5)).toBe(false);
    expect(t.min()).toBe(1);
    expect(t.max()).toBe(14);
  });

  it("중복 키는 무시한다", () => {
    const t = build();
    expect(t.insert(6)).toBe(false);
    expect(t.insert(99)).toBe(true);
    expect(t.size).toBe(10);
  });

  it("순회 4종", () => {
    const t = build();
    expect([...t.inOrder()]).toEqual([1, 3, 4, 6, 7, 8, 10, 13, 14]);
    expect([...t.preOrder()]).toEqual([8, 3, 1, 6, 4, 7, 10, 14, 13]);
    expect([...t.postOrder()]).toEqual([1, 4, 7, 6, 3, 13, 14, 10, 8]);
    expect([...t.levelOrder()]).toEqual([8, 3, 10, 1, 6, 14, 4, 7, 13]);
    expect([...t]).toEqual([...t.inOrder()]);
  });

  it("height", () => {
    expect(build().height()).toBe(4);
  });

  it("successor / predecessor (트리에 없는 값도 가능)", () => {
    const t = build();
    expect(t.successor(8)).toBe(10);
    expect(t.successor(7)).toBe(8);
    expect(t.successor(5)).toBe(6);
    expect(t.predecessor(8)).toBe(7);
    expect(t.predecessor(10)).toBe(8);
    expect(t.predecessor(5)).toBe(4);
    expect(t.successor(14)).toBeUndefined();
    expect(t.predecessor(1)).toBeUndefined();
  });

  it("커스텀 comparator (객체, 내림차순)", () => {
    const t = new BinarySearchTree<{ id: number }>((a, b) => b.id - a.id);
    [5, 2, 9].forEach((id) => t.insert({ id }));
    expect([...t.inOrder()].map((o) => o.id)).toEqual([9, 5, 2]);
    expect(t.has({ id: 2 })).toBe(true);
    expect(t.insert({ id: 5 })).toBe(false);
  });

  it("문자열 기본 비교", () => {
    const t = new BinarySearchTree<string>();
    ["pear", "apple", "fig"].forEach((s) => t.insert(s));
    expect([...t]).toEqual(["apple", "fig", "pear"]);
  });
});

describe("BinarySearchTree - remove 세 가지 경우", () => {
  it("자식 0개 (리프)", () => {
    const t = build();
    expect(t.remove(13)).toBe(true);
    expect(t.has(13)).toBe(false);
    expect([...t]).toEqual([1, 3, 4, 6, 7, 8, 10, 14]);
    expect(t.size).toBe(8);
  });

  it("자식 1개", () => {
    const t = build();
    expect(t.remove(14)).toBe(true); // 왼쪽 자식(13)만 가짐
    expect(t.remove(10)).toBe(true); // 오른쪽 자식(13)만 가짐
    expect([...t.levelOrder()]).toEqual([8, 3, 13, 1, 6, 4, 7]);
    expect(t.size).toBe(7);
  });

  it("자식 2개 (후속자로 대체)", () => {
    const t = build();
    expect(t.remove(3)).toBe(true);
    expect([...t.levelOrder()]).toEqual([8, 4, 10, 1, 6, 14, 7, 13]);
    expect(t.remove(8)).toBe(true); // 루트, 자식 2개
    expect(t.min()).toBe(1);
    expect([...t]).toEqual([1, 4, 6, 7, 10, 13, 14]);
  });

  it("후속자가 바로 오른쪽 자식인 경우", () => {
    const t = build([5, 2, 8, 9]);
    t.remove(8); // 8 의 후속자 9 는 8 의 오른쪽 자식
    expect([...t.levelOrder()]).toEqual([5, 2, 9]);
  });

  it("루트가 자식 1개일 때 루트 교체", () => {
    const t = build([1, 2, 3]);
    t.remove(1);
    expect([...t.levelOrder()]).toEqual([2, 3]);
  });

  it("없는 값 삭제는 false 이고 변화 없음", () => {
    const t = build();
    expect(t.remove(100)).toBe(false);
    expect(t.size).toBe(9);
  });
});

describe("BinarySearchTree - 빈 상태 / 경계", () => {
  it("빈 트리", () => {
    const t = new BinarySearchTree<number>();
    expect(t.isEmpty()).toBe(true);
    expect(t.size).toBe(0);
    expect(t.height()).toBe(0);
    expect(t.min()).toBeUndefined();
    expect(t.max()).toBeUndefined();
    expect(t.has(1)).toBe(false);
    expect(t.remove(1)).toBe(false);
    expect(t.successor(1)).toBeUndefined();
    expect(t.predecessor(1)).toBeUndefined();
    expect([...t.inOrder()]).toEqual([]);
    expect([...t.preOrder()]).toEqual([]);
    expect([...t.postOrder()]).toEqual([]);
    expect([...t.levelOrder()]).toEqual([]);
  });

  it("노드 하나", () => {
    const t = build([42]);
    expect(t.height()).toBe(1);
    expect(t.min()).toBe(42);
    expect(t.max()).toBe(42);
    expect(t.remove(42)).toBe(true);
    expect(t.isEmpty()).toBe(true);
    expect(t.height()).toBe(0);
  });

  it("clear 후 재사용", () => {
    const t = build();
    t.clear();
    expect(t.isEmpty()).toBe(true);
    expect(t.has(8)).toBe(false);
    t.insert(1);
    expect([...t]).toEqual([1]);
  });

  it("전부 삭제하면 빈 트리", () => {
    const t = build();
    [8, 3, 10, 1, 6, 14, 4, 7, 13].forEach((v) => t.remove(v));
    expect(t.isEmpty()).toBe(true);
    expect(t.height()).toBe(0);
  });
});

describe("BinarySearchTree - 많은 데이터", () => {
  it("무작위 삽입/삭제 후에도 inOrder 가 정렬을 유지하고 Set 과 일치", () => {
    const rand = rng(12345);
    const t = new BinarySearchTree<number>();
    const ref = new Set<number>();
    for (let i = 0; i < 20000; i++) {
      const v = Math.floor(rand() * 2000);
      if (rand() < 0.6) {
        expect(t.insert(v)).toBe(!ref.has(v));
        ref.add(v);
      } else {
        expect(t.remove(v)).toBe(ref.has(v));
        ref.delete(v);
      }
      if (i % 1000 === 0) {
        const arr = [...t.inOrder()];
        expect(arr).toEqual([...arr].sort((a, b) => a - b));
        expect(arr.length).toBe(ref.size);
      }
    }
    const result = [...t.inOrder()];
    expect(result).toEqual([...ref].sort((a, b) => a - b));
    expect(t.size).toBe(ref.size);
    // 순회 결과들의 원소 집합은 모두 같아야 한다.
    const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);
    expect(sorted([...t.preOrder()])).toEqual(result);
    expect(sorted([...t.postOrder()])).toEqual(result);
    expect(sorted([...t.levelOrder()])).toEqual(result);
  });

  it("정렬된 입력 20,000개: 높이 n(연결 리스트 모양)이어도 스택 오버플로 없음", () => {
    const n = 20_000;
    const t = new BinarySearchTree<number>();
    for (let i = 0; i < n; i++) t.insert(i);
    expect(t.size).toBe(n);
    expect(t.height()).toBe(n);
    expect(t.has(n - 1)).toBe(true);
    expect(t.max()).toBe(n - 1);
    expect([...t.inOrder()].length).toBe(n);
    expect([...t.postOrder()].length).toBe(n);
    expect(t.remove(0)).toBe(true);
    expect(t.min()).toBe(1);
  });

  it("무작위 입력은 높이가 O(log n) 근처", () => {
    const rand = rng(7);
    const t = new BinarySearchTree<number>();
    for (let i = 0; i < 50000; i++) t.insert(Math.floor(rand() * 1e9));
    expect(t.height()).toBeLessThan(60);
  });
});
