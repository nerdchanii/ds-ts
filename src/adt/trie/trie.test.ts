import { describe, it, expect } from "vitest";
import { Trie } from "./trie";

describe("Trie 정상 케이스", () => {
  it("insert / has / startsWith", () => {
    const t = new Trie();
    expect(t.insert("apple")).toBe(true);
    expect(t.insert("apple")).toBe(false); // 중복
    expect(t.has("apple")).toBe(true);
    expect(t.has("app")).toBe(false); // 접두사일 뿐 단어는 아님
    expect(t.startsWith("app")).toBe(true);
    expect(t.startsWith("apple")).toBe(true);
    expect(t.startsWith("apples")).toBe(false);
    expect(t.startsWith("b")).toBe(false);
    expect(t.size).toBe(1);
  });

  it("autocomplete 는 사전순이며 접두사 자신이 먼저 나온다", () => {
    const t = new Trie();
    ["apply", "apple", "app", "banana", "ape", "application"].forEach((w) => t.insert(w));
    expect(t.autocomplete("app")).toEqual(["app", "apple", "application", "apply"]);
    expect(t.autocomplete("ap", 2)).toEqual(["ape", "app"]);
    expect(t.autocomplete("x")).toEqual([]);
    expect(t.autocomplete("")).toEqual(["ape", "app", "apple", "application", "apply", "banana"]);
  });

  it("countWithPrefix", () => {
    const t = new Trie();
    ["app", "apple", "apply", "bat"].forEach((w) => t.insert(w));
    expect(t.countWithPrefix("app")).toBe(3);
    expect(t.countWithPrefix("appl")).toBe(2);
    expect(t.countWithPrefix("b")).toBe(1);
    expect(t.countWithPrefix("z")).toBe(0);
    expect(t.countWithPrefix("")).toBe(4);
    t.insert("app"); // 중복 삽입은 개수에 영향 없음
    expect(t.countWithPrefix("app")).toBe(3);
  });

  it("값 저장/조회", () => {
    const t = new Trie<string>();
    t.insert("사과", "apple");
    expect(t.get("사과")).toBe("apple");
    t.insert("사과", "fruit");
    expect(t.get("사과")).toBe("fruit");
    expect(t.get("사")).toBeUndefined();
  });

  it("iterator 는 사전순", () => {
    const t = new Trie();
    ["c", "a", "ab", "b"].forEach((w) => t.insert(w));
    expect([...t]).toEqual(["a", "ab", "b", "c"]);
  });
});

describe("Trie 삭제", () => {
  it("app/apple: 짧은 단어(접두사) 삭제 시 긴 단어는 유지", () => {
    const t = new Trie();
    t.insert("app");
    t.insert("apple");
    expect(t.remove("app")).toBe(true);
    expect(t.has("app")).toBe(false);
    expect(t.has("apple")).toBe(true);
    expect(t.startsWith("app")).toBe(true);
    expect(t.size).toBe(1);
    expect(t.countWithPrefix("app")).toBe(1);
  });

  it("app/apple: 긴 단어 삭제 시 짧은 단어는 유지, 불필요한 가지는 제거", () => {
    const t = new Trie();
    t.insert("app");
    t.insert("apple");
    expect(t.remove("apple")).toBe(true);
    expect(t.has("app")).toBe(true);
    expect(t.has("apple")).toBe(false);
    expect(t.startsWith("appl")).toBe(false); // 가지가 잘렸음
    expect(t.autocomplete("app")).toEqual(["app"]);
    expect(t.size).toBe(1);
  });

  it("없는 단어/접두사 삭제는 false 이며 상태를 바꾸지 않는다", () => {
    const t = new Trie();
    t.insert("apple");
    expect(t.remove("app")).toBe(false);
    expect(t.remove("applesauce")).toBe(false);
    expect(t.remove("zzz")).toBe(false);
    expect(t.size).toBe(1);
    expect(t.has("apple")).toBe(true);
  });

  it("다른 단어와 공유하지 않는 가지만 잘라낸다", () => {
    const t = new Trie();
    ["car", "card", "care", "cat"].forEach((w) => t.insert(w));
    t.remove("card");
    expect(t.autocomplete("car")).toEqual(["car", "care"]);
    t.remove("car");
    expect(t.autocomplete("ca")).toEqual(["care", "cat"]);
    t.remove("care");
    expect(t.startsWith("car")).toBe(false);
    expect(t.autocomplete("c")).toEqual(["cat"]);
  });

  it("마지막 단어를 지우면 빈 트라이", () => {
    const t = new Trie();
    t.insert("hello");
    t.remove("hello");
    expect(t.isEmpty()).toBe(true);
    expect(t.startsWith("h")).toBe(false);
    expect([...t]).toEqual([]);
  });

  it("삭제 후 재삽입", () => {
    const t = new Trie<number>();
    t.insert("abc", 1);
    t.remove("abc");
    expect(t.get("abc")).toBeUndefined();
    t.insert("abc", 2);
    expect(t.get("abc")).toBe(2);
    expect(t.size).toBe(1);
  });
});

describe("Trie 유니코드", () => {
  it("한글 단어", () => {
    const t = new Trie();
    ["사과", "사과나무", "사랑", "바나나", "사자"].forEach((w) => t.insert(w));
    expect(t.has("사과")).toBe(true);
    expect(t.has("사")).toBe(false);
    expect(t.startsWith("사")).toBe(true);
    expect(t.countWithPrefix("사과")).toBe(2);
    expect(t.autocomplete("사")).toEqual(["사과", "사과나무", "사랑", "사자"]);
    expect(t.remove("사과")).toBe(true);
    expect(t.autocomplete("사과")).toEqual(["사과나무"]);
  });

  it("이모지(서로게이트 쌍)를 한 글자로 처리", () => {
    const t = new Trie();
    t.insert("🍎pie");
    t.insert("🍎");
    t.insert("🍌");
    expect(t.startsWith("🍎")).toBe(true);
    expect(t.countWithPrefix("🍎")).toBe(2);
    expect(t.autocomplete("🍎")).toEqual(["🍎", "🍎pie"]);
    // 서로게이트 쌍의 앞 절반만으로는 접두사가 되지 않는다.
    expect(t.startsWith("🍎".charAt(0))).toBe(false);
    expect([...t]).toEqual(["🍌", "🍎", "🍎pie"]); // U+1F34C < U+1F34E
    t.remove("🍎");
    expect(t.has("🍎pie")).toBe(true);
  });
});

describe("Trie 빈 상태 / 경계", () => {
  it("빈 트라이", () => {
    const t = new Trie();
    expect(t.isEmpty()).toBe(true);
    expect(t.size).toBe(0);
    expect(t.has("a")).toBe(false);
    expect(t.startsWith("a")).toBe(false);
    expect(t.startsWith("")).toBe(false);
    expect(t.autocomplete("")).toEqual([]);
    expect(t.countWithPrefix("")).toBe(0);
    expect(t.remove("a")).toBe(false);
    expect([...t]).toEqual([]);
  });

  it("빈 문자열 단어", () => {
    const t = new Trie();
    expect(t.has("")).toBe(false);
    t.insert("");
    expect(t.has("")).toBe(true);
    expect(t.size).toBe(1);
    t.insert("a");
    expect([...t]).toEqual(["", "a"]);
    expect(t.remove("")).toBe(true);
    expect(t.has("a")).toBe(true);
    expect(t.size).toBe(1);
  });

  it("limit 경계", () => {
    const t = new Trie();
    ["a", "b", "c"].forEach((w) => t.insert(w));
    expect(t.autocomplete("", 0)).toEqual([]);
    expect(t.autocomplete("", -1)).toEqual([]);
    expect(t.autocomplete("", 1)).toEqual(["a"]);
    expect(t.autocomplete("", 100)).toEqual(["a", "b", "c"]);
  });

  it("clear", () => {
    const t = new Trie();
    ["a", "ab", ""].forEach((w) => t.insert(w));
    t.clear();
    expect(t.isEmpty()).toBe(true);
    expect(t.has("")).toBe(false);
    expect(t.startsWith("a")).toBe(false);
    t.insert("z");
    expect([...t]).toEqual(["z"]);
  });

  it("한 글자 단어와 매우 긴 단어(재귀 깊이 문제 없음)", () => {
    const t = new Trie();
    const long = "a".repeat(100000);
    t.insert(long);
    t.insert("a");
    expect(t.has(long)).toBe(true);
    expect(t.countWithPrefix("a")).toBe(2);
    expect(t.autocomplete("a", 1)).toEqual(["a"]);
    expect(t.remove(long)).toBe(true);
    expect(t.has(long)).toBe(false);
    expect([...t]).toEqual(["a"]);
  });
});

describe("Trie 많은 데이터", () => {
  it("20000 개 삽입 후 조회/개수/정렬 검증", () => {
    const t = new Trie();
    const words: string[] = [];
    for (let i = 0; i < 20000; i++) words.push("w" + ((i * 7919) % 20000).toString(36));
    const unique = Array.from(new Set(words));
    unique.forEach((w) => t.insert(w));
    expect(t.size).toBe(unique.length);
    unique.forEach((w) => expect(t.has(w)).toBe(true));
    const sorted = [...unique].sort();
    expect([...t]).toEqual(sorted);
    const p = "w1";
    expect(t.countWithPrefix(p)).toBe(sorted.filter((w) => w.startsWith(p)).length);
    expect(t.autocomplete(p, 10)).toEqual(sorted.filter((w) => w.startsWith(p)).slice(0, 10));
  });

  it("절반 삭제 후에도 일관성 유지, 전부 삭제하면 빈 상태", () => {
    const t = new Trie();
    const words: string[] = [];
    for (let i = 0; i < 5000; i++) words.push("k" + i);
    words.forEach((w) => t.insert(w));
    words.filter((_, i) => i % 2 === 0).forEach((w) => expect(t.remove(w)).toBe(true));
    const rest = words.filter((_, i) => i % 2 === 1);
    expect(t.size).toBe(rest.length);
    expect([...t]).toEqual([...rest].sort());
    expect(t.countWithPrefix("k")).toBe(rest.length);
    rest.forEach((w) => t.remove(w));
    expect(t.isEmpty()).toBe(true);
    expect(t.startsWith("k")).toBe(false);
  });
});
