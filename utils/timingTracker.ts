export interface BuildTimings {
  html?: number;
  ts?: number;
  scss?: number;
  assets?: number;
  total?: number;
}

export const timings: BuildTimings = {};