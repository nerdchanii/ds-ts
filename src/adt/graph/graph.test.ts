import { describe, it, expect } from "vitest";
import { Graph } from "./graph";

describe("Graph 기본 연산", () => {
  it("무방향: 간선이 양쪽에 생기고 edges는 한 번만 나온다", () => {
    const g = new Graph<string>();
    g.addEdge("A", "B", 3);
    g.addEdge("B", "C");
    expect(g.hasEdge("A", "B")).toBe(true);
    expect(g.hasEdge("B", "A")).toBe(true);
    expect(g.getWeight("B", "A")).toBe(3);
    expect(g.vertices()).toEqual(["A", "B", "C"]);
    expect(g.edges()).toHaveLength(2);
    expect(g.degree("B")).toBe(2);
    expect(g.neighbors("B")).toEqual(["A", "C"]);
  });

  it("방향: 한쪽만 생기고 in/out degree가 구분된다", () => {
    const g = new Graph<number>({ directed: true });
    g.addEdge(1, 2);
    g.addEdge(3, 2);
    expect(g.hasEdge(1, 2)).toBe(true);
    expect(g.hasEdge(2, 1)).toBe(false);
    expect(g.inDegree(2)).toBe(2);
    expect(g.outDegree(2)).toBe(0);
    expect(g.outDegree(1)).toBe(1);
    expect(g.edges()).toHaveLength(2);
  });

  it("addEdge는 가중치를 덮어쓰고, addVertex는 멱등이다", () => {
    const g = new Graph<string>();
    g.addVertex("A");
    g.addVertex("A");
    g.addEdge("A", "B", 1);
    g.addEdge("A", "B", 9);
    expect(g.vertexCount).toBe(2);
    expect(g.getWeight("A", "B")).toBe(9);
    expect(g.edges()).toEqual([{ from: "A", to: "B", weight: 9 }]);
  });

  it("removeEdge / removeVertex", () => {
    const g = new Graph<string>();
    g.addEdge("A", "B");
    g.addEdge("B", "C");
    expect(g.removeEdge("A", "B")).toBe(true);
    expect(g.hasEdge("B", "A")).toBe(false);
    expect(g.removeEdge("A", "B")).toBe(false);
    expect(g.removeVertex("B")).toBe(true);
    expect(g.vertices()).toEqual(["A", "C"]);
    expect(g.degree("C")).toBe(0);
    expect(g.removeVertex("B")).toBe(false);
  });

  it("방향 그래프 removeVertex는 들어오는 간선도 지운다", () => {
    const g = new Graph<number>({ directed: true });
    g.addEdge(1, 2);
    g.addEdge(2, 3);
    g.removeVertex(2);
    expect(g.outDegree(1)).toBe(0);
    expect(g.edges()).toEqual([]);
  });

  it("자기 루프는 edges에 한 번만 나온다", () => {
    const g = new Graph<string>();
    g.addEdge("A", "A");
    expect(g.edges()).toHaveLength(1);
    expect(g.degree("A")).toBe(1);
  });
});

describe("빈 상태 / 경계", () => {
  it("빈 그래프", () => {
    const g = new Graph<string>();
    expect(g.vertices()).toEqual([]);
    expect(g.edges()).toEqual([]);
    expect(g.hasVertex("A")).toBe(false);
    expect(g.hasEdge("A", "B")).toBe(false);
    expect(g.connectedComponents()).toEqual([]);
    expect(new Graph<string>({ directed: true }).topologicalSort()).toEqual([]);
  });

  it("없는 정점 조회는 Error, 삭제는 false", () => {
    const g = new Graph<string>();
    expect(() => g.neighbors("X")).toThrow();
    expect(() => g.degree("X")).toThrow();
    expect(() => g.bfs("X")).toThrow();
    expect(() => g.dfs("X")).toThrow();
    expect(() => g.dijkstra("X")).toThrow();
    expect(g.removeVertex("X")).toBe(false);
    expect(g.removeEdge("X", "Y")).toBe(false);
  });

  it("NaN 가중치 거부, 방향/무방향 전용 메서드 검사", () => {
    const g = new Graph<string>();
    expect(() => g.addEdge("A", "B", NaN)).toThrow();
    expect(() => g.topologicalSort()).toThrow();
    expect(() => new Graph<string>({ directed: true }).connectedComponents()).toThrow();
  });

  it("정점 하나짜리 그래프의 탐색", () => {
    const g = new Graph<string>();
    g.addVertex("A");
    expect(g.bfs("A")).toEqual(["A"]);
    expect(g.dfs("A")).toEqual(["A"]);
    expect(g.shortestPathUnweighted("A", "A")).toEqual(["A"]);
    expect(g.dijkstra("A").get("A")).toBe(0);
  });
});

describe("탐색", () => {
  //   A - B - D
  //   |   |
  //   C   E - F
  const build = () => {
    const g = new Graph<string>();
    g.addEdge("A", "B");
    g.addEdge("A", "C");
    g.addEdge("B", "D");
    g.addEdge("B", "E");
    g.addEdge("E", "F");
    return g;
  };

  it("bfs: 레벨 순서", () => {
    expect(build().bfs("A")).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("dfs: 깊이 우선 순서(첫 이웃 먼저)", () => {
    expect(build().dfs("A")).toEqual(["A", "B", "D", "E", "F", "C"]);
  });

  it("사이클이 있어도 무한 루프 없이 한 번씩만 방문", () => {
    const g = new Graph<number>();
    g.addEdge(1, 2);
    g.addEdge(2, 3);
    g.addEdge(3, 1);
    expect(g.bfs(1).sort()).toEqual([1, 2, 3]);
    expect(g.dfs(1)).toEqual([1, 2, 3]);
  });

  it("shortestPathUnweighted", () => {
    const g = build();
    expect(g.shortestPathUnweighted("C", "F")).toEqual(["C", "A", "B", "E", "F"]);
    g.addVertex("Z");
    expect(g.shortestPathUnweighted("A", "Z")).toBeUndefined();
  });

  it("방향 그래프의 탐색은 간선 방향을 따른다", () => {
    const g = new Graph<number>({ directed: true });
    g.addEdge(1, 2);
    g.addEdge(3, 1);
    expect(g.bfs(1)).toEqual([1, 2]);
    expect(g.shortestPathUnweighted(2, 1)).toBeUndefined();
  });
});

describe("dijkstra", () => {
  it("고전 예제의 정답 거리", () => {
    const g = new Graph<string>();
    g.addEdge("A", "B", 7);
    g.addEdge("A", "C", 9);
    g.addEdge("A", "F", 14);
    g.addEdge("B", "C", 10);
    g.addEdge("B", "D", 15);
    g.addEdge("C", "D", 11);
    g.addEdge("C", "F", 2);
    g.addEdge("D", "E", 6);
    g.addEdge("E", "F", 9);
    const d = g.dijkstra("A");
    expect(Object.fromEntries(d)).toEqual({ A: 0, B: 7, C: 9, D: 20, E: 20, F: 11 });
  });

  it("방향 그래프, 가중치 0, 도달 불가는 Infinity", () => {
    const g = new Graph<string>({ directed: true });
    g.addEdge("S", "A", 0);
    g.addEdge("S", "B", 5);
    g.addEdge("A", "B", 2);
    g.addEdge("B", "S", 1);
    g.addVertex("X");
    const d = g.dijkstra("S");
    expect(d.get("A")).toBe(0);
    expect(d.get("B")).toBe(2);
    expect(d.get("X")).toBe(Infinity);
  });

  it("음수 가중치는 RangeError", () => {
    const g = new Graph<string>({ directed: true });
    g.addEdge("A", "B", -1);
    expect(() => g.dijkstra("A")).toThrow(RangeError);
  });
});

describe("topologicalSort", () => {
  it("DAG: 모든 간선에서 from이 to보다 앞", () => {
    const g = new Graph<string>({ directed: true });
    g.addEdge("shirt", "tie");
    g.addEdge("tie", "jacket");
    g.addEdge("pants", "shoes");
    g.addEdge("pants", "belt");
    g.addEdge("belt", "jacket");
    g.addVertex("socks");
    const order = g.topologicalSort()!;
    expect(order).toHaveLength(g.vertexCount);
    const pos = new Map(order.map((v, i) => [v, i]));
    for (const e of g.edges()) expect(pos.get(e.from)!).toBeLessThan(pos.get(e.to)!);
  });

  it("사이클이 있으면 undefined", () => {
    const g = new Graph<string>({ directed: true });
    g.addEdge("A", "B");
    g.addEdge("B", "C");
    g.addEdge("C", "A");
    g.addEdge("C", "D");
    expect(g.topologicalSort()).toBeUndefined();
  });

  it("자기 루프도 사이클", () => {
    const g = new Graph<number>({ directed: true });
    g.addEdge(1, 1);
    expect(g.topologicalSort()).toBeUndefined();
  });
});

describe("connectedComponents", () => {
  it("여러 연결 요소와 고립 정점", () => {
    const g = new Graph<number>();
    g.addEdge(1, 2);
    g.addEdge(2, 3);
    g.addEdge(4, 5);
    g.addVertex(6);
    const comps = g.connectedComponents().map((c) => c.sort((a, b) => a - b));
    expect(comps).toEqual([[1, 2, 3], [4, 5], [6]]);
  });
});

describe("많은 데이터", () => {
  const N = 20000;

  it("긴 체인에서 반복형 DFS/BFS가 스택 오버플로 없이 동작", () => {
    const g = new Graph<number>();
    for (let i = 0; i < N - 1; i++) g.addEdge(i, i + 1);
    const dfs = g.dfs(0);
    expect(dfs).toHaveLength(N);
    expect(dfs[N - 1]).toBe(N - 1);
    expect(g.bfs(0)).toHaveLength(N);
    expect(g.shortestPathUnweighted(0, N - 1)).toHaveLength(N);
    expect(g.connectedComponents()).toHaveLength(1);
  });

  it("체인 dijkstra 거리와 큰 DAG 위상 정렬", () => {
    const g = new Graph<number>({ directed: true });
    for (let i = 0; i < N - 1; i++) g.addEdge(i, i + 1, 2);
    g.addEdge(0, N - 1, 5); // 지름길
    const d = g.dijkstra(0);
    expect(d.get(N - 1)).toBe(5);
    expect(d.get(N - 2)).toBe(2 * (N - 2));
    expect(g.topologicalSort()).toHaveLength(N);
  });

  it("격자 그래프에서 최단 거리 = 맨해튼 거리", () => {
    const S = 60;
    const g = new Graph<number>();
    for (let r = 0; r < S; r++) {
      for (let c = 0; c < S; c++) {
        if (c + 1 < S) g.addEdge(r * S + c, r * S + c + 1);
        if (r + 1 < S) g.addEdge(r * S + c, (r + 1) * S + c);
      }
    }
    const d = g.dijkstra(0);
    expect(d.get(S * S - 1)).toBe(2 * (S - 1));
    expect(g.shortestPathUnweighted(0, S * S - 1)).toHaveLength(2 * (S - 1) + 1);
  });
});
