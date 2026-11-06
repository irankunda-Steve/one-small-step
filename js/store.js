// Pure plan model + storage helpers for One Small Step (no DOM).
// Imported by both the app and the tests.

export const STORAGE_KEY = "onesmallstep.plan.v1";

export const STAGES = ["task", "step", "ready", "done"];

export function blankPlan() {
  return { task: "", step: "", lastCompleted: "", stage: "task" };
}

export function normalizeText(value) {
  return (value ?? "").toString().trim();
}

export function isNonEmpty(value) {
  return normalizeText(value).length > 0;
}

// Decide which screen a returning visitor should land on.
export function resolveScreen(plan) {
  const p = plan ?? {};
  if (p.stage === "done" && isNonEmpty(p.lastCompleted)) return "done";
  if (isNonEmpty(p.task) && isNonEmpty(p.step) && p.stage === "ready") return "ready";
  if (isNonEmpty(p.task)) return "step";
  return "task";
}

function sanitize(raw) {
  const base = blankPlan();
  if (!raw || typeof raw !== "object") return base;
  const plan = {
    task: normalizeText(raw.task),
    step: normalizeText(raw.step),
    lastCompleted: normalizeText(raw.lastCompleted),
    stage: STAGES.includes(raw.stage) ? raw.stage : "task",
  };
  // A "ready" plan without both halves is really still in setup.
  if (plan.stage === "ready" && !(plan.task && plan.step)) {
    plan.stage = plan.task ? "step" : "task";
  }
  if (plan.stage === "done" && !plan.lastCompleted) {
    plan.stage = plan.task ? "step" : "task";
  }
  return plan;
}

export function serialize(plan) {
  return JSON.stringify(sanitize(plan));
}

export function deserialize(raw) {
  if (typeof raw !== "string" || !raw) return blankPlan();
  try {
    return sanitize(JSON.parse(raw));
  } catch {
    return blankPlan();
  }
}

function defaultStorage() {
  try {
    if (typeof globalThis !== "undefined" && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Storage unavailable (private mode, SSR) — caller gets a blank plan.
  }
  return null;
}

export function loadPlan(storage = defaultStorage()) {
  if (!storage) return blankPlan();
  try {
    return deserialize(storage.getItem(STORAGE_KEY));
  } catch {
    return blankPlan();
  }
}

export function savePlan(plan, storage = defaultStorage()) {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, serialize(plan));
    return true;
  } catch {
    return false;
  }
}
