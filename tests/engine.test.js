import test from 'node:test';
import assert from 'node:assert/strict';
import { answerFor, inspectAttempt, stageCycle, flushedInstructions } from '../src/engine.js';
import { puzzles } from '../src/puzzles.js';
import { diagnoseAttempt } from '../src/explanation.js';
import { traceValues } from '../src/valueTrace.js';
import { makeVariant } from '../src/variants.js';

test('four puzzle answers follow stage timing', () => {
  assert.deepEqual(puzzles.map(answerFor), [2, 0, 1, 2]);
  assert.equal(stageCycle(1, 'WB'), 5);
  assert.equal(flushedInstructions('EX'), 2);
});

test('value trace separates ready, forwarded, and committed values', () => {
  const rows = inspectAttempt(puzzles[1], 0).rows;
  assert.equal(traceValues(puzzles[1], rows, 3).registers.x5, 0);
  assert.ok(traceValues(puzzles[1], rows, 3).events.some(event => event.kind === 'computed' && event.value === 7));
  assert.ok(traceValues(puzzles[1], rows, 4).events.some(event => event.kind === 'forwarded' && event.value === 7));
  assert.deepEqual(traceValues(puzzles[1], rows, 6).registers, { x5: 7, x6: 14 });
});

test('value trace exposes unsafe old reads and load-use recovery', () => {
  const unsafe = inspectAttempt(puzzles[0], 0).rows;
  assert.ok(traceValues(puzzles[0], unsafe, 3).events.some(event => event.kind === 'staleRead'));
  assert.equal(traceValues(puzzles[0], unsafe, 6).registers.x6, 0);
  const load = inspectAttempt(puzzles[2], 1).rows;
  assert.equal(traceValues(puzzles[2], load, 4).memory.value, 9);
  assert.ok(traceValues(puzzles[2], load, 4).events.some(event => event.kind === 'loaded'));
  assert.ok(traceValues(puzzles[2], load, 5).events.some(event => event.kind === 'forwarded'));
  assert.equal(traceValues(puzzles[2], load, 7).registers.x6, 18);
});

test('branch trace commits only instructions not flushed in the proposed schedule', () => {
  const safe = inspectAttempt(puzzles[3], 2).rows;
  assert.deepEqual(traceValues(puzzles[3], safe, 8).registers, { x1: 0, x2: 0, x3: 0, x4: 4 });
  const unsafe = inspectAttempt(puzzles[3], 0).rows;
  assert.deepEqual(traceValues(puzzles[3], unsafe, 8).registers, { x1: 0, x2: 1, x3: 1, x4: 4 });
});

test('new examples keep answers, explanations, and traced values aligned', () => {
  assert.deepEqual([1, 2, 3].map(serial => answerFor(makeVariant(puzzles[0], serial))), [1, 0, 2]);
  assert.deepEqual([1, 2].map(serial => answerFor(makeVariant(puzzles[2], serial))), [0, 1]);
  assert.deepEqual([1, 2].map(serial => answerFor(makeVariant(puzzles[3], serial))), [1, 2]);
  for (const base of puzzles) {
    for (let serial = 1; serial <= 40; serial++) {
      const variant = makeVariant(base, serial);
      assert.ok(answerFor(variant) >= 0 && answerFor(variant) <= 2);
      assert.notDeepEqual(variant.instructions, base.instructions);
      const rows = inspectAttempt(variant, answerFor(variant)).rows;
      for (const step of variant.explanation.steps) {
        assert.ok(rows.some(row => row.cells[step.cycle]), `${base.id} example ${serial} cycle ${step.cycle}`);
        assert.ok(step.detail.ko && step.detail.en);
      }
      const end = traceValues(variant, rows, 9);
      if (variant.kind === 'branch') {
        assert.equal(end.registers[variant.trace.target.register], variant.trace.target.value);
        variant.trace.wrong.forEach(item => assert.equal(end.registers[item.register], 0));
      } else {
        assert.equal(end.registers[variant.trace.input.register], variant.trace.input.value);
        assert.equal(end.registers[variant.trace.output.register], variant.trace.output.value);
        variant.trace.independent.forEach(item => assert.equal(end.registers[item.register], item.value));
      }
    }
  }
});

test('unsafe attempts retain visible hazards', () => {
  const attempt = inspectAttempt(puzzles[2], 0);
  assert.equal(attempt.correct, false);
  assert.equal(attempt.rows.at(-1).status, 'hazard');
  assert.equal(attempt.rows.at(-1).cells[4], 'EX');
});

test('resolved load-use moves consumer EX to next cycle', () => {
  const attempt = inspectAttempt(puzzles[2], 1);
  assert.equal(attempt.correct, true);
  assert.equal(attempt.rows.at(-1).cells[5], 'EX');
});

test('two stalls hold ID twice, while branch flush stops wrong path', () => {
  const delayed = inspectAttempt(puzzles[2], 2);
  assert.equal(delayed.rows.at(-1).cells[5], 'ID');
  assert.equal(delayed.rows.at(-1).cells[6], 'EX');
  const branch = inspectAttempt(puzzles[3], 2);
  assert.equal(branch.correct, true);
  assert.deepEqual(branch.rows[1].cells, { 2: 'IF', 3: 'ID' });
  assert.deepEqual(branch.rows[2].cells, { 3: 'IF' });
});

test('diagnosis distinguishes early reads, extra waiting, and unflushed work', () => {
  assert.deepEqual(
    { ...diagnoseAttempt(puzzles[0], 1) },
    { answer: 2, selected: 1, result: 'tooFew', readStage: 'ID', consumerCycle: 4,
      producerStage: 'WB', producerCycle: 5, firstSafeCycle: 5, excessCycles: 0 }
  );
  assert.equal(diagnoseAttempt(puzzles[1], 2).excessCycles, 2);
  assert.equal(diagnoseAttempt(puzzles[2], 0).firstSafeCycle, 5);
  assert.equal(diagnoseAttempt(puzzles[3], 1).unflushed, 1);
  const earlyBranch = makeVariant(puzzles[3], 1);
  assert.equal(answerFor(earlyBranch), 1);
  assert.equal(diagnoseAttempt(earlyBranch, 2).result, 'tooMany');
});

test('every bilingual explanation step points to an occupied solution cycle', () => {
  for (const puzzle of puzzles) {
    const solution = inspectAttempt(puzzle, answerFor(puzzle));
    const cycles = puzzle.explanation.steps.map(step => step.cycle);
    assert.deepEqual(cycles, [...cycles].sort((a, b) => a - b));
    for (const step of puzzle.explanation.steps) {
      assert.ok(solution.rows.some(row => row.cells[step.cycle]), `${puzzle.id}: cycle ${step.cycle}`);
      assert.ok(step.label.ko && step.label.en && step.detail.ko && step.detail.en);
    }
    assert.ok(puzzle.explanation.outcome.ko && puzzle.explanation.outcome.en);
  }
});
