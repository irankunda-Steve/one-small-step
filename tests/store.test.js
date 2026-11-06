import test from "node:test";
import assert from "node:assert/strict";
import {
  STORAGE_KEY,
  blankPlan,
  deserialize,
  isNonEmpty,
  loadPlan,
  normalizeText,
  resolveScreen,
  savePlan,
  serialize,
} from "../js/store.js";

function memoryStorage(seed) {
  const data = seed ? { ...seed } : {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    _data: data,
  };
}

test("blank plan opens into the task screen", () => {
  assert.equal(resolveScreen(blankPlan()), "task");
});

test("empty submissions are rejected", () => {
  for (const v of ["", "   ", null, undefined]) {
    assert.equal(isNonEmpty(v), false);
  }
  assert.equal(isNonEmpty("  write  "), true);
  assert.equal(normalizeText("  write  "), "write");
});

test("task-only plan resumes at the step screen", () => {
  assert.equal(resolveScreen({ ...blankPlan(), task: "Study", stage: "step" }), "step");
});

test("complete plan resumes at the ready screen", () => {
  const plan = { task: "Study", step: "Open the book", lastCompleted: "", stage: "ready" };
  assert.equal(resolveScreen(plan), "ready");
});

test("completed plan resumes at the done screen", () => {
  const plan = { task: "Study", step: "Open the book", lastCompleted: "Open the book", stage: "done" };
  assert.equal(resolveScreen(plan), "done");
});

test("ready without both halves falls back to setup", () => {
  assert.equal(resolveScreen({ ...blankPlan(), task: "Study", step: "", stage: "ready" }), "step");
  assert.equal(resolveScreen({ ...blankPlan(), stage: "ready" }), "task");
});

test("save/load round-trips through localStorage", () => {
  const storage = memoryStorage();
  const plan = { task: "Prepare talk", step: "Write first sentence", lastCompleted: "", stage: "ready" };
  assert.equal(savePlan(plan, storage), true);
  assert.equal(storage._data[STORAGE_KEY], serialize(plan));
  assert.deepEqual(loadPlan(storage), plan);
});

test("corrupted storage recovers to a blank plan", () => {
  assert.deepEqual(loadPlan(memoryStorage({ [STORAGE_KEY]: "{nope" })), blankPlan());
  assert.deepEqual(deserialize(null), blankPlan());
  assert.deepEqual(deserialize(42), blankPlan());
});

test("unknown stages are sanitized", () => {
  const plan = deserialize(JSON.stringify({ task: "T", step: "S", stage: "warp" }));
  assert.equal(plan.stage, "task");
});
