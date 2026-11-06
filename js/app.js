import { blankPlan, isNonEmpty, loadPlan, normalizeText, resolveScreen, savePlan } from "./store.js";

// Screens in DOM order.
const SCREENS = ["task", "step", "ready", "done"];
const screenEls = {
  task: document.getElementById("screen-task"),
  step: document.getElementById("screen-step"),
  ready: document.getElementById("screen-ready"),
  done: document.getElementById("screen-done"),
};

const taskInput = document.getElementById("taskInput");
const stepInput = document.getElementById("stepInput");
const taskError = document.getElementById("taskError");
const stepError = document.getElementById("stepError");
const stepTaskContext = document.getElementById("stepTaskContext");
const readyTask = document.getElementById("readyTask");
const readyStepText = document.getElementById("readyStepText");
const doneStepText = document.getElementById("doneStepText");

let plan = loadPlan();
let current = "task";

function persist() {
  savePlan(plan);
}

function show(name) {
  current = name;
  for (const key of SCREENS) {
    const el = screenEls[key];
    const active = key === name;
    el.hidden = !active;
    el.classList.remove("enter");
    if (active) {
      // Restart the fade on every visit.
      void el.offsetWidth;
      el.classList.add("enter");
    }
  }
  // Prefill + sync visible copy from the saved plan.
  if (name === "task") {
    taskInput.value = plan.task;
    hideError(taskError);
  }
  if (name === "step") {
    stepTaskContext.textContent = plan.task;
    // Keep an in-progress draft, except right after completion
    // ("Choose the next step" clears plan.step first for a blank field).
    if (document.activeElement !== stepInput) stepInput.value = plan.step;
    hideError(stepError);
  }
  if (name === "ready") {
    readyTask.textContent = plan.task;
    readyStepText.textContent = plan.step;
  }
  if (name === "done") {
    doneStepText.textContent = plan.lastCompleted;
  }
  const focusTarget =
    name === "task" ? taskInput
    : name === "step" ? stepInput
    : name === "ready" ? readyStepText
    : document.getElementById("doneMsg");
  if (focusTarget) focusTarget.focus({ preventScroll: true });
}

function showError(el, input) {
  el.hidden = false;
  input.setAttribute("aria-invalid", "true");
  input.focus();
}

function hideError(el) {
  el.hidden = true;
}

function clearInvalid(input) {
  input.removeAttribute("aria-invalid");
}

// --- Screen 1 → 2 -----------------------------------------------------------
document.getElementById("taskContinue").addEventListener("click", () => {
  const value = normalizeText(taskInput.value);
  if (!isNonEmpty(value)) {
    showError(taskError, taskInput);
    return;
  }
  hideError(taskError);
  clearInvalid(taskInput);
  plan.task = value;
  plan.stage = "step";
  persist();
  stepInput.value = plan.step; // prefill existing step when revising the task
  show("step");
});
taskInput.addEventListener("input", () => {
  hideError(taskError);
  clearInvalid(taskInput);
  plan.task = normalizeText(taskInput.value);
  persist();
});

// --- Screen 2: back / continue ------------------------------------------------
document.getElementById("stepBack").addEventListener("click", () => {
  plan.step = normalizeText(stepInput.value); // keep the draft
  plan.stage = plan.task ? "step" : "task";
  persist();
  show("task");
});
document.getElementById("stepContinue").addEventListener("click", () => {
  const value = normalizeText(stepInput.value);
  if (!isNonEmpty(value)) {
    showError(stepError, stepInput);
    return;
  }
  hideError(stepError);
  clearInvalid(stepInput);
  plan.step = value;
  plan.stage = "ready";
  persist();
  show("ready");
});
stepInput.addEventListener("input", () => {
  hideError(stepError);
  clearInvalid(stepInput);
  plan.step = normalizeText(stepInput.value);
  persist();
});

// --- Screen 3: edit links + done ----------------------------------------------
document.getElementById("editTask").addEventListener("click", () => {
  plan.stage = "task";
  persist();
  show("task"); // prefilled; existing step is preserved for revision next
});
document.getElementById("editStep").addEventListener("click", () => {
  plan.stage = "step";
  persist();
  stepInput.value = plan.step; // prefilled
  show("step");
});
document.getElementById("doneBtn").addEventListener("click", () => {
  plan.lastCompleted = plan.step;
  plan.stage = "done";
  persist();
  show("done");
});

// --- Screen 4: choose the next step ---------------------------------------------
document.getElementById("nextStepBtn").addEventListener("click", () => {
  plan.step = "";
  plan.stage = "step";
  persist();
  stepInput.value = ""; // blank field, same task stays visible as context
  show("step");
});

// Enter key advances from either field.
for (const [input, btnId] of [[taskInput, "taskContinue"], [stepInput, "stepContinue"]]) {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById(btnId).click();
    }
  });
}

// Resume the saved plan for returning visitors.
show(resolveScreen(plan));
if (current === "step") stepInput.value = plan.step;
if (current === "task") taskInput.value = plan.task ?? "";

export { plan };
