import { answerFor, stageCycle } from './engine.js';

// EN: Diagnose the player's exact timing, not only whether the answer matches.
// KO: 단순 정오 판정 대신 사용자가 고른 배치에서 어긋나는 클록을 계산합니다.
export function diagnoseAttempt(puzzle, selected) {
  const answer = answerFor(puzzle);
  if (puzzle.kind === 'branch') {
    return { answer, selected, result: selected === answer ? 'correct' : selected < answer ? 'tooFew' : 'tooMany',
      resolveCycle: stageCycle(1, puzzle.resolveStage), unflushed: Math.max(0, answer - selected), excessCycles: Math.max(0, selected - answer) };
  }

  const readStage = puzzle.forwarding ? 'EX' : 'ID';
  const consumerCycle = stageCycle(2 + (puzzle.gapInstructions?.length || 0) + selected, readStage);
  const producerStage = !puzzle.forwarding ? 'WB' : puzzle.producerKind === 'load' ? 'MEM' : 'EX';
  const producerCycle = stageCycle(1, producerStage);
  const firstSafeCycle = producerCycle + (puzzle.forwarding ? 1 : 0);
  const result = selected === answer ? 'correct' : selected < answer ? 'tooFew' : 'tooMany';
  return { answer, selected, result, readStage, consumerCycle, producerStage, producerCycle,
    firstSafeCycle, excessCycles: Math.max(0, selected - answer) };
}
