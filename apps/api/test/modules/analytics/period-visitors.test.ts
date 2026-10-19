import { describe, expect, it } from "vitest";
import { buildHourlyPeriods } from "@repo/platform/engine/modules/analytics/analytics.service";

interface Bucket {
  minute: number;
  requests: number;
  unique_requests: number;
  bandwidth_in: number;
  bandwidth_out: number;
  response_time: number;
}

function bucket(minute: number, requests: number, uniqueRequests: number): Bucket {
  return {
    minute,
    requests,
    unique_requests: uniqueRequests,
    bandwidth_in: 0,
    bandwidth_out: 0,
    response_time: 0,
  };
}

describe("per-period visitor metrics", () => {
  // The edge's `:u` counter is incremented per non-static REQUEST, and the edge
  // dedups visitors per DAY — not per minute or per hour. Summing those minute
  // counters therefore measures page requests, and used to be published as
  // `uniqueVisitors`, over-counting people (one browser returning three times
  // read as three visitors).
  const returningVisitor = [bucket(0, 10, 9), bucket(1, 12, 11), bucket(2, 8, 8)];

  it("publishes minute unique-request counters as page requests, never as visitors", () => {
    const [period] = buildHourlyPeriods(returningVisitor, 0, 2);
    expect(period.pageRequests).toBe(28);
    expect(period.uniqueVisitors).toBeNull();
  });

  it("reports an empty period as zero page requests, not zero visitors", () => {
    const [period] = buildHourlyPeriods([], 0, 0);
    expect(period.pageRequests).toBe(0);
    expect(period.uniqueVisitors).toBeNull();
  });
});
