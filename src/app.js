import { puzzles } from './puzzles.js';
import { inspectAttempt, buildRows } from './engine.js';
import { diagnoseAttempt } from './explanation.js';
import { traceValues } from './valueTrace.js';
import { makeVariant } from './variants.js';

const copy = {
  ko: {
    caseFile: '사건 목록', localSimulation: '로컬 시뮬레이션', sidebarNote: '교육용 5단계 파이프라인 모델입니다. 원본 RTL과의 연결은 각 사건에서 확인하세요.',
    topLabel: 'CPU 디버깅 퍼즐', fiveStages: '5단계 · IF / ID / EX / MEM / WB', inspectCode: '코드 조사', sourceLabel: '관련 원본 RTL', makeCall: '원인 판단', runPipeline: '파이프라인 실행', cycleTrace: '클록별 추적', traceIntro: '답을 고르고 실행하세요. 화살표를 눌러 각 클록의 명령 위치를 확인합니다.', legendActive: '실행 중', legendBubble: '대기 / NOP', legendHazard: '위험 / 제거', evidence: '근거 / 왜?', modelRules: '이 모델의 규칙', ruleAHead: '같은 클록의 WB → ID', ruleABody: '레지스터 쓰기가 먼저 보인다고 가정합니다.', ruleBHead: 'forwarding 시점', ruleBBody: 'ALU 값은 EX 뒤, load 값은 MEM 뒤에 전달할 수 있습니다.', ruleCHead: '분기 결정 시점', ruleCBody: '이 교육용 모델에서는 분기를 EX에서 결정합니다.', footer: 'Iowa State CprE 381 프로젝트의 공개 코드에서 착안한 비영리 학습용 퍼즐입니다. 원본 코드와 과제 자료의 권리는 각 권리자에게 있습니다.',
    dataHazard: '데이터 의존성', controlHazard: '분기 제어', noForward: 'forwarding 없음', forward: 'forwarding 사용', branchMode: '분기 결정 · EX', cycle: '클록', correct: '정확합니다.', incorrect: '다시 살펴보세요.', answer: '필요한 값', choose: '0, 1, 2 중 하나를 고르세요.', beforeRun: '여기에 실행 결과와 클록 근거가 표시됩니다.', afterRun: '클록을 이동하며 강조된 단계와 설명을 함께 보세요.', wrongDetail: '선택한 값으로 파이프라인을 그렸습니다. 위험 표시와 클록 시점을 비교해보세요.', extraDetail: '결과는 안전하지만 불필요하게 기다렸습니다. 가장 적은 지연으로 해결할 수 있는 값을 찾으세요.', goodDetail: '선택한 값으로 위험을 해결했습니다. 아래 근거를 확인하세요.', complete: '완료', locked: '미완료', bubble: '대기', target: '목표', flushed: '제거', hazard: '위험', safe: '안전', nextCase: '다음 사건으로 →', showAnswer: '정답과 해설 보기', reset: '다시 풀기'
  },
  en: {
    caseFile: 'CASE FILES', localSimulation: 'LOCAL SIMULATION', sidebarNote: 'A teaching model of a five-stage pipeline. Each case links to the related original RTL.',
    topLabel: 'CPU DEBUGGING PUZZLES', fiveStages: '5 STAGES · IF / ID / EX / MEM / WB', inspectCode: 'INSPECT THE CODE', sourceLabel: 'RELATED ORIGINAL RTL', makeCall: 'MAKE YOUR CALL', runPipeline: 'RUN PIPELINE', cycleTrace: 'CYCLE TRACE', traceIntro: 'Choose an answer and run. Use the arrows to inspect each instruction by cycle.', legendActive: 'ACTIVE', legendBubble: 'BUBBLE / NOP', legendHazard: 'HAZARD / FLUSH', evidence: 'EVIDENCE / WHY', modelRules: 'MODEL RULES', ruleAHead: 'WB → ID in one cycle', ruleABody: 'We assume a register write is visible before the read.', ruleBHead: 'Forwarding availability', ruleBBody: 'An ALU value can forward after EX; a load value after MEM.', ruleCHead: 'Branch resolution', ruleCBody: 'This teaching model resolves the branch in EX.', footer: 'A noncommercial learning puzzle inspired by public Iowa State CprE 381 project code. Original code and course material remain with their respective owners.',
    dataHazard: 'DATA DEPENDENCY', controlHazard: 'BRANCH CONTROL', noForward: 'NO FORWARDING', forward: 'FORWARDING ENABLED', branchMode: 'BRANCH RESOLVES · EX', cycle: 'CYCLE', correct: 'Correct.', incorrect: 'Look again.', answer: 'Required', choose: 'Choose 0, 1, or 2.', beforeRun: 'Your result and cycle evidence will appear here.', afterRun: 'Move through the cycles and inspect the highlighted stages.', wrongDetail: 'This is your proposed schedule. Compare the hazard markers with the required timing.', extraDetail: 'The result is safe, but you waited longer than necessary. Find the smallest delay that works.', goodDetail: 'Your choice resolves the hazard. Check the timing evidence below.', complete: 'SOLVED', locked: 'UNSOLVED', bubble: 'BUBBLE', target: 'TARGET', flushed: 'FLUSHED', hazard: 'HAZARD', safe: 'SAFE', nextCase: 'NEXT CASE →', showAnswer: 'SHOW ANSWER & REASON', reset: 'TRY AGAIN'
  }
};

Object.assign(copy.ko, {
  valueTrace: '클록별 값 추적', valueTraceNote: '레지스터는 이 클록의 WB가 끝난 뒤 값입니다. EX/MEM의 임시 값은 아래에서 따로 보여줍니다.', valueTraceEmpty: '답을 선택하고 실행하면 이 클록의 값을 볼 수 있습니다.', memoryLabel: '메모리', noEvent: '이 클록에는 추적할 값 변화가 없습니다.', initialValues: '초기값: 표시된 레지스터는 0입니다. 메모리 값은 위에 표시됩니다.', solutionOutcome: '정답 흐름의 최종 결과', newVariant: '새 코드 받기 ↗', exampleNumber: number => `예시 ${String(number).padStart(2, '0')}`,
  yourChoice: '내 선택', requiredChoice: '정답', whyCorrect: '왜 맞는지 보기',
  compareHeading: '내 배치와 정답 배치 비교', correctHeading: '이 선택이 맞는 이유',
  attemptedTrace: '내 선택의 흐름', solutionTrace: '정답 흐름',
  wrongIntro: '내 선택의 클록을 먼저 확인하세요. 해설을 열면 정답 흐름과 비교할 수 있습니다.',
  correctIntro: '정답입니다. 해설을 열어 값이 준비되고 사용되는 클록을 확인하세요.',
  outcome: '최종 결과', keyMoments: '핵심 클록', retry: '다시 선택하기',
  branchProblem: ({ resolveCycle, selected, unflushed }) => `${resolveCycle}번째 클록에 분기가 결정됩니다. ${selected}개만 제거하면 잘못된 경로의 명령 ${unflushed}개가 남습니다.`,
  earlyProblem: ({ readStage, consumerCycle, producerStage, producerCycle, firstSafeCycle }) => `소비 명령은 ${consumerCycle}번째 클록 ${readStage}에서 값을 사용합니다. 생산 명령의 ${producerStage}는 ${producerCycle}번째 클록이고, 안전한 사용 시점은 ${firstSafeCycle}번째 클록입니다.`,
  extraProblem: ({ consumerCycle, firstSafeCycle, excessCycles }) => `${consumerCycle}번째 클록에 값을 사용해 계산은 안전합니다. 하지만 ${firstSafeCycle}번째 클록부터 사용할 수 있어 ${excessCycles}클록을 더 기다렸습니다.`,
  correctTiming: ({ consumerCycle, readStage, firstSafeCycle }) => `${consumerCycle}번째 클록 ${readStage}에서 값을 사용합니다. 이 모델의 첫 안전 시점인 ${firstSafeCycle}번째 클록과 일치합니다.`,
  correctBranch: ({ resolveCycle, answer }) => `${resolveCycle}번째 클록에 분기가 결정되어 잘못된 경로의 명령 ${answer}개를 모두 제거합니다.`,
  branchExtra: ({ resolveCycle, answer }) => `${resolveCycle}번째 클록에 분기가 결정됩니다. 그때 잘못된 경로의 명령은 ${answer}개뿐이므로 더 제거할 필요가 없습니다.`
});
Object.assign(copy.en, {
  valueTrace: 'VALUE TRACE BY CYCLE', valueTraceNote: 'Registers show values after WB in this cycle. Temporary EX/MEM values appear separately below.', valueTraceEmpty: 'Choose an answer and run to inspect values at this cycle.', memoryLabel: 'MEMORY', noEvent: 'No tracked value changes in this cycle.', initialValues: 'Initial values: shown registers are 0; memory value appears above.', solutionOutcome: 'FINAL RESULT OF CORRECT TRACE', newVariant: 'GET NEW CODE ↗', exampleNumber: number => `EXAMPLE ${String(number).padStart(2, '0')}`,
  yourChoice: 'YOUR CHOICE', requiredChoice: 'CORRECT ANSWER', whyCorrect: 'WHY THIS WORKS',
  compareHeading: 'Compare your schedule with the solution', correctHeading: 'Why this answer works',
  attemptedTrace: 'YOUR SCHEDULE', solutionTrace: 'CORRECT SCHEDULE',
  wrongIntro: 'Inspect your cycle trace first. Open the explanation to compare it with the correct schedule.',
  correctIntro: 'Correct. Open the explanation to see when the value becomes ready and gets used.',
  outcome: 'FINAL RESULT', keyMoments: 'KEY CYCLES', retry: 'TRY ANOTHER ANSWER',
  branchProblem: ({ resolveCycle, selected, unflushed }) => `The branch resolves in cycle ${resolveCycle}. Flushing only ${selected} leaves ${unflushed} wrong-path instruction${unflushed === 1 ? '' : 's'} in flight.`,
  earlyProblem: ({ readStage, consumerCycle, producerStage, producerCycle, firstSafeCycle }) => `The consumer uses the value in ${readStage} at cycle ${consumerCycle}. The producer reaches ${producerStage} in cycle ${producerCycle}; the first safe use is cycle ${firstSafeCycle}.`,
  extraProblem: ({ consumerCycle, firstSafeCycle, excessCycles }) => `Using the value in cycle ${consumerCycle} is safe, but it was ready by cycle ${firstSafeCycle}. That adds ${excessCycles} unnecessary cycle${excessCycles === 1 ? '' : 's'}.`,
  correctTiming: ({ consumerCycle, readStage, firstSafeCycle }) => `The consumer uses the value in ${readStage} at cycle ${consumerCycle}, matching the first safe cycle ${firstSafeCycle}.`,
  correctBranch: ({ resolveCycle, answer }) => `The branch resolves in cycle ${resolveCycle}, so ${answer} younger wrong-path instruction${answer === 1 ? '' : 's'} must be flushed.`,
  branchExtra: ({ resolveCycle, answer }) => `The branch resolves in cycle ${resolveCycle}. Only ${answer} wrong-path instruction${answer === 1 ? '' : 's'} exist then; no extra flush is needed.`
});

const $ = (selector) => document.querySelector(selector);
let savedVariants = [];
try { savedVariants = JSON.parse(localStorage.getItem('pipeline-detective-variants') || '[]'); } catch { /* EN/KO: Ignore damaged local progress / 손상된 로컬 진행 기록은 무시합니다. */ }
const state = { lang: localStorage.getItem('pipeline-detective-lang') === 'en' ? 'en' : 'ko', index: 0, selection: null, attempt: null, cycle: 1, explanationOpen: false, traceMode: 'attempt', solved: new Set(JSON.parse(localStorage.getItem('pipeline-detective-solved') || '[]')), variants: puzzles.map((_, i) => Number.isSafeInteger(savedVariants[i]) && savedVariants[i] >= 0 ? savedVariants[i] : 0) };
const t = key => copy[state.lang][key];
const currentPuzzle = () => makeVariant(puzzles[state.index], state.variants[state.index]);

// EN: Screens are rebuilt from state, so changing language never changes an answer.
// KO: 언어를 바꿔도 선택·정답 상태는 유지되도록 화면만 다시 그립니다.
function render() {
  const puzzle = currentPuzzle();
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  if (puzzle.kind === 'branch' && puzzle.resolveStage !== 'EX') $('[data-i18n="ruleCBody"]').textContent = state.lang === 'ko' ? `이 예시에서는 분기를 ${puzzle.resolveStage}에서 결정합니다.` : `This example resolves the branch in ${puzzle.resolveStage}.`;
  document.querySelectorAll('[data-lang]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.lang === state.lang)));
  $('#progress-count').textContent = `${String(state.solved.size).padStart(2, '0')} / ${String(puzzles.length).padStart(2, '0')}`;
  $('#puzzle-nav').innerHTML = puzzles.map((item, i) => `<button class="nav-case ${i === state.index ? 'active' : ''}" type="button" data-case="${i}" ${i === state.index ? 'aria-current="step"' : ''}><span class="nav-num">${item.number}</span><span class="nav-text">${item.title[state.lang]}</span><span class="nav-state" aria-label="${state.solved.has(item.id) ? t('complete') : t('locked')}">${state.solved.has(item.id) ? '✓' : '—'}</span></button>`).join('');
  $('#case-number').textContent = puzzle.number;
  $('#case-type').textContent = t(puzzle.kind === 'branch' ? 'controlHazard' : 'dataHazard');
  $('#case-title').textContent = puzzle.title[state.lang];
  $('#case-premise').textContent = puzzle.premise[state.lang];
  $('#mode-label').textContent = puzzle.kind === 'branch' ? `${t('branchMode').replace('EX', puzzle.resolveStage)}` : t(puzzle.forwarding ? 'forward' : 'noForward');
  $('#case-question').textContent = puzzle.question[state.lang];
  $('#source-link').href = puzzle.source;
  $('#source-link').textContent = puzzle.code + ' ↗';
  $('#code-lines').innerHTML = puzzle.instructions.map((line, i) => `<div class="code-line"><span class="line-no">${String(i + 1).padStart(2, '0')}</span><code>${line}</code></div>`).join('');
  $('#variant-number').textContent = t('exampleNumber')(state.variants[state.index] + 1);
  $('#options').innerHTML = [0, 1, 2].map(value => `<button type="button" class="answer-option ${state.selection === value ? 'selected' : ''}" data-value="${value}" role="radio" aria-checked="${state.selection === value}"><strong>${value}</strong><span>${puzzle.unit[state.lang]}</span></button>`).join('');
  renderFeedback();
  renderTimeline();
}

function renderFeedback() {
  const el = $('#feedback');
  if (!state.attempt) { el.className = 'feedback'; el.textContent = t('beforeRun'); return; }
  const result = state.attempt;
  const diagnosis = diagnoseAttempt(currentPuzzle(), state.selection);
  el.className = `feedback shown ${result.correct ? 'success' : 'failure'}`;
  const summary = result.correct ? t('correctIntro') : diagnosticText(diagnosis);
  el.innerHTML = `<div class="feedback-head"><strong>${result.correct ? '✓ ' + t('correct') : '↘ ' + t('incorrect')}</strong><span>${t('yourChoice')}: ${state.selection}</span></div><p>${summary}</p><div class="feedback-actions"><button type="button" id="reveal-button" aria-expanded="${state.explanationOpen}" aria-controls="evidence-content">${result.correct ? t('whyCorrect') : t('showAnswer')}</button>${!result.correct ? `<button type="button" id="retry-button">${t('retry')}</button>` : ''}${result.correct && state.index < puzzles.length - 1 ? `<button type="button" id="next-case-button">${t('nextCase')}</button>` : ''}</div>`;
  $('#reveal-button').addEventListener('click', () => {
    state.explanationOpen = true;
    state.traceMode = result.correct ? 'attempt' : 'solution';
    state.cycle = currentPuzzle().explanation.steps[0].cycle;
    renderFeedback();
    renderTimeline();
    $('#evidence-content').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $('#retry-button')?.addEventListener('click', () => { state.selection = null; state.attempt = null; state.explanationOpen = false; state.traceMode = 'attempt'; state.cycle = 1; render(); });
  $('#next-case-button')?.addEventListener('click', () => selectCase(state.index + 1));
}

function diagnosticText(diagnosis) {
  if (diagnosis.result === 'correct') return diagnosis.resolveCycle ? t('correctBranch')(diagnosis) : t('correctTiming')(diagnosis);
  if (diagnosis.resolveCycle) return t(diagnosis.result === 'tooMany' ? 'branchExtra' : 'branchProblem')(diagnosis);
  return t(diagnosis.result === 'tooMany' ? 'extraProblem' : 'earlyProblem')(diagnosis);
}

function renderTimeline() {
  const puzzle = currentPuzzle();
  const rows = state.attempt
    ? state.traceMode === 'solution' ? inspectAttempt(puzzle, state.attempt.answer).rows : state.attempt.rows
    : buildRows(puzzle, 0);
  const maxCycle = Math.max(8, ...rows.flatMap(row => Object.keys(row.cells).map(Number)));
  state.cycle = Math.min(state.cycle, maxCycle);
  $('#cycle-label').textContent = `CLK ${String(state.cycle).padStart(2, '0')}`;
  $('#prev-cycle').disabled = state.cycle <= 1;
  $('#next-cycle').disabled = state.cycle >= maxCycle;
  const headers = Array.from({ length: maxCycle }, (_, i) => `<th scope="col" class="${state.cycle === i + 1 ? 'current-cycle' : ''}">${String(i + 1).padStart(2, '0')}</th>`).join('');
  const body = rows.map(row => `<tr class="row-${row.status}"><th scope="row" title="${row.label}">${row.label}</th>${Array.from({ length: maxCycle }, (_, i) => { const cycle = i + 1; const stage = row.cells[cycle]; const visible = state.attempt && cycle <= state.cycle; return `<td class="${stage && visible ? 'filled ' + (cycle === state.cycle ? 'current-stage' : '') : ''} ${row.status}">${visible ? stage || '' : ''}</td>`; }).join('')}</tr>`).join('');
  $('#timeline').innerHTML = `<table><thead><tr><th scope="col" class="instruction-col">ASM / CLK</th>${headers}</tr></thead><tbody>${body}</tbody></table>`;
  renderTraceMode();
  renderValueTrace(rows);
  renderEvidence();
  const lines = document.querySelectorAll('.code-line');
  lines.forEach((line, i) => line.classList.toggle('active-line', Boolean(state.attempt && rows.find(row => row.label === puzzle.instructions[i])?.cells[state.cycle])));
}

function renderValueTrace(rows) {
  $('#value-trace-cycle').textContent = `CLK ${String(state.cycle).padStart(2, '0')}`;
  const el = $('#value-trace-content');
  if (!state.attempt) { el.innerHTML = `<p class="value-empty">${t('valueTraceEmpty')}</p>`; return; }
  const snapshot = traceValues(currentPuzzle(), rows, state.cycle);
  const registers = Object.entries(snapshot.registers).map(([name, value]) => `<div class="value-register"><span>${name}</span><strong>${value}</strong></div>`).join('');
  const memory = snapshot.memory ? `<div class="value-memory"><span>${t('memoryLabel')}[${snapshot.memory.address}]</span><strong>${snapshot.memory.value}</strong></div>` : '';
  const events = snapshot.events.length
    ? snapshot.events.map(event => `<li class="value-event ${event.kind === 'staleRead' || event.kind === 'staleResult' || event.kind === 'wrongCommit' ? 'value-warning' : ''}"><span class="value-stage">${event.stage}</span><span>${valueEventText(event)}</span></li>`).join('')
    : `<li class="value-event value-quiet">${t('noEvent')}</li>`;
  el.innerHTML = `<div class="value-registers">${registers}${memory}</div><ul class="value-events">${events}</ul><p class="value-assumption">${t('initialValues')}</p>`;
}

function valueEventText(event) {
  const { kind, register, value } = event;
  const ko = {
    branchTaken: '분기가 선택되었습니다. 뒤따르는 순차 명령은 잘못된 경로입니다.',
    flushed: `${register}에 쓸 예정이던 명령을 flush했습니다.`,
    wrongCommit: `${register} = ${value} 기록 — 제거하지 못한 잘못된 경로/의존성의 결과입니다.`,
    commit: `${register} = ${value} 레지스터에 기록했습니다.`,
    computed: `${register}의 결과 ${value} 계산 완료. 아직 레지스터에 기록되지는 않았습니다.`,
    loaded: `Memory[0]에서 ${value}를 읽었습니다. 아직 ${register}에 기록되지는 않았습니다.`,
    forwarded: `${register}의 임시 값 ${value}를 EX 입력으로 전달했습니다.`,
    read: `레지스터 ${register}에서 ${value}를 읽었습니다.`,
    staleRead: `새 값이 아직 없어 ${register}의 이전 값 ${value}을(를) 사용했습니다.`,
    staleResult: `이전 값으로 ${register} = ${value}을(를) 계산했습니다.`
  };
  const en = {
    branchTaken: 'Branch taken. Younger sequential instructions are on the wrong path.',
    flushed: `Flushed the instruction that would write ${register}.`,
    wrongCommit: `Committed ${register} = ${value} from an unflushed wrong path or stale dependency.`,
    commit: `Committed ${register} = ${value} to the register file.`,
    computed: `Computed ${register} result ${value}; it is not committed yet.`,
    loaded: `Read ${value} from Memory[0]; ${register} is not committed yet.`,
    forwarded: `Forwarded temporary ${register} value ${value} into EX.`,
    read: `Read ${value} from register ${register}.`,
    staleRead: `Used old ${register} value ${value}; the new value was not ready.`,
    staleResult: `Computed ${register} = ${value} from the old value.`
  };
  return (state.lang === 'ko' ? ko : en)[kind];
}

function renderTraceMode() {
  const el = $('#trace-mode');
  const show = Boolean(state.explanationOpen && state.attempt && !state.attempt.correct);
  el.hidden = !show;
  if (!show) { el.innerHTML = ''; return; }
  el.innerHTML = `<span>${t('compareHeading')}</span><div><button type="button" data-trace="attempt" aria-pressed="${state.traceMode === 'attempt'}">${t('attemptedTrace')}</button><button type="button" data-trace="solution" aria-pressed="${state.traceMode === 'solution'}">${t('solutionTrace')}</button></div>`;
}

// EN: A wrong answer has two views: the learner's proposal and the safe schedule.
// KO: 오답 해설은 내 배치와 안전한 정답 배치를 같은 클록 축에서 비교합니다.
function renderEvidence() {
  const puzzle = currentPuzzle();
  const content = $('#evidence-content');
  if (!state.explanationOpen) {
    content.innerHTML = `<p class="evidence-placeholder">${!state.attempt ? t('beforeRun') : state.attempt.correct ? t('correctIntro') : t('wrongIntro')}</p>`;
    return;
  }
  const diagnosis = diagnoseAttempt(puzzle, state.selection);
  const comparison = state.attempt.correct ? '' : `<div class="answer-comparison"><div><span>${t('yourChoice')}</span><strong>${state.selection}</strong><small>${puzzle.unit[state.lang]}</small></div><div><span>${t('requiredChoice')}</span><strong>${diagnosis.answer}</strong><small>${puzzle.unit[state.lang]}</small></div></div>`;
  const steps = puzzle.explanation.steps.map(step => `<button type="button" class="reason-step ${state.cycle === step.cycle ? 'active' : ''}" data-step-cycle="${step.cycle}"><span>CLK ${String(step.cycle).padStart(2, '0')}</span><strong>${step.label[state.lang]}</strong><small>${step.detail[state.lang]}</small></button>`).join('');
  content.innerHTML = `<h3>${t(state.attempt.correct ? 'correctHeading' : 'compareHeading')}</h3>${comparison}<p class="timing-diagnosis">${diagnosticText(diagnosis)}</p><div class="step-heading">${t('keyMoments')}</div><div class="reason-steps">${steps}</div><div class="outcome"><span>${t(state.attempt.correct ? 'outcome' : 'solutionOutcome')}</span><strong>${puzzle.explanation.outcome[state.lang]}</strong></div>`;
}

function selectCase(index) { state.index = index; state.selection = null; state.attempt = null; state.cycle = 1; state.explanationOpen = false; state.traceMode = 'attempt'; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

$('#puzzle-nav').addEventListener('click', event => { const button = event.target.closest('[data-case]'); if (button) selectCase(Number(button.dataset.case)); });
$('#new-variant').addEventListener('click', () => { state.variants[state.index]++; localStorage.setItem('pipeline-detective-variants', JSON.stringify(state.variants)); state.selection = null; state.attempt = null; state.cycle = 1; state.explanationOpen = false; state.traceMode = 'attempt'; render(); });
$('#options').addEventListener('click', event => { const button = event.target.closest('[data-value]'); if (!button) return; state.selection = Number(button.dataset.value); state.attempt = null; state.explanationOpen = false; state.traceMode = 'attempt'; render(); });
$('#run-button').addEventListener('click', () => {
  if (state.selection === null) { $('#feedback').textContent = t('choose'); $('#feedback').className = 'feedback warning'; return; }
  const puzzle = currentPuzzle();
  state.attempt = inspectAttempt(puzzle, state.selection);
  state.cycle = 1;
  state.explanationOpen = false;
  state.traceMode = 'attempt';
  if (state.attempt.correct) { state.solved.add(puzzle.id); localStorage.setItem('pipeline-detective-solved', JSON.stringify([...state.solved])); }
  render();
});
$('#prev-cycle').addEventListener('click', () => { state.cycle--; renderTimeline(); });
$('#next-cycle').addEventListener('click', () => { state.cycle++; renderTimeline(); });
$('#trace-mode').addEventListener('click', event => { const button = event.target.closest('[data-trace]'); if (!button) return; state.traceMode = button.dataset.trace; renderTimeline(); });
$('#evidence-content').addEventListener('click', event => { const button = event.target.closest('[data-step-cycle]'); if (!button) return; state.traceMode = 'solution'; state.cycle = Number(button.dataset.stepCycle); renderTimeline(); });
document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => { state.lang = button.dataset.lang; localStorage.setItem('pipeline-detective-lang', state.lang); render(); }));
document.addEventListener('keydown', event => { if (event.key === 'ArrowRight') { state.cycle++; renderTimeline(); } else if (event.key === 'ArrowLeft') { state.cycle = Math.max(1, state.cycle - 1); renderTimeline(); } });
render();
