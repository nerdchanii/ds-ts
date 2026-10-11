import { describe, it, expect } from "vitest";
import { Stack } from "./stack";

/** 괄호 검사: 활용 예 */
function isBalanced(text: string): boolean {
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack = new Stack<string>();
  for (const ch of text) {
    if ("([{".includes(ch)) stack.push(ch);
    else if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.isEmpty();
}

describe("Stack 정상 동작", () => {
  it("push 후 LIFO 순서로 pop 한다", () => {
    const s = new Stack<number>();
    s.push(1);
    s.push(2);
    s.push(3);
    expect(s.size).toBe(3);
    expect(s.pop()).toBe(3);
    expect(s.pop()).toBe(2);
    expect(s.pop()).toBe(1);
  });

  it("peek는 제거하지 않는다", () => {
    const s = new Stack<string>();
    s.push("a");
    s.push("b");
    expect(s.peek()).toBe("b");
    expect(s.size).toBe(2);
  });

  it("toArray와 이터레이터는 top → bottom 순서다", () => {
    const s = new Stack<number>();
    [1, 2, 3].forEach((n) => s.push(n));
    expect(s.toArray()).toEqual([3, 2, 1]);
    expect([...s]).toEqual([3, 2, 1]);
    expect(s.size).toBe(3);
  });

  it("toArray 결과를 바꿔도 스택은 영향받지 않는다", () => {
    const s = new Stack<number>();
    s.push(1);
    s.toArray().push(99);
    expect(s.size).toBe(1);
  });

  it("clear 후 비어 있다", () => {
    const s = new Stack<number>();
    s.push(1);
    s.clear();
    expect(s.isEmpty()).toBe(true);
    expect(s.size).toBe(0);
  });
});

describe("Stack 빈 상태/경계", () => {
  it("빈 스택의 pop/peek는 undefined", () => {
    const s = new Stack<number>();
    expect(s.isEmpty()).toBe(true);
    expect(s.pop()).toBeUndefined();
    expect(s.peek()).toBeUndefined();
    expect(s.size).toBe(0);
    expect(s.toArray()).toEqual([]);
    expect([...s]).toEqual([]);
  });

  it("마지막 원소를 pop 하면 다시 빈 상태가 된다", () => {
    const s = new Stack<number>();
    s.push(1);
    expect(s.isEmpty()).toBe(false);
    s.pop();
    expect(s.isEmpty()).toBe(true);
    expect(s.pop()).toBeUndefined();
  });

  it("undefined 값도 저장할 수 있고 size로 구분된다", () => {
    const s = new Stack<number | undefined>();
    s.push(undefined);
    expect(s.size).toBe(1);
    expect(s.pop()).toBeUndefined();
    expect(s.size).toBe(0);
  });

  it("clear 후 재사용할 수 있다", () => {
    const s = new Stack<number>();
    s.push(1);
    s.clear();
    s.push(2);
    expect(s.toArray()).toEqual([2]);
  });
});

describe("Stack 많은 데이터", () => {
  it("100,000개 push/pop 이 정확하다", () => {
    const n = 100_000;
    const s = new Stack<number>();
    for (let i = 0; i < n; i++) s.push(i);
    expect(s.size).toBe(n);
    expect(s.peek()).toBe(n - 1);
    for (let i = n - 1; i >= 0; i--) expect(s.pop()).toBe(i);
    expect(s.isEmpty()).toBe(true);
  });
});

describe("활용 예: 괄호 검사", () => {
  it("올바른 괄호", () => {
    expect(isBalanced("")).toBe(true);
    expect(isBalanced("{[()]}()")).toBe(true);
    expect(isBalanced("f(a[1], {b: 2})")).toBe(true);
  });
  it("잘못된 괄호", () => {
    expect(isBalanced("(")).toBe(false);
    expect(isBalanced(")")).toBe(false);
    expect(isBalanced("([)]")).toBe(false);
    expect(isBalanced("((())")).toBe(false);
  });
});
