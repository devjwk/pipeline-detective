export const STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];

// EN: Keep cycle rules in one place. Puzzle text must never decide correctness.
// KO: 정답은 설명 문구가 아니라 이 모델의 클록 규칙에서 계산합니다.
export function stageCycle(start, stage) {
  const offset = STAGES.indexOf(stage);
  if (!Number.isInteger(start) || start < 1 || offset < 0) throw new RangeError('Invalid cycle or stage');
  return start + offset;
}

export function requiredDelay(kind, forwarding, gap = 0) {
  if (kind !== 'alu' && kind !== 'load') throw new RangeError('Unknown producer kind');
  if (!Number.isInteger(gap) || gap < 0) throw new RangeError('Invalid independent instruction count');
  if (!forwarding) {
    // EN: A register read in ID can use a write in WB on the same cycle.
    // KO: WB와 ID가 같은 클록이면 쓰기를 먼저 보고 읽는다고 가정합니다.
    return Math.max(0, stageCycle(1, 'WB') - stageCycle(2 + gap, 'ID'));
  }
  // EN: An ALU result is ready after EX; a load result is ready after MEM.
  // KO: ALU 결과는 EX 뒤, 메모리 읽기 결과는 MEM 뒤에 전달할 수 있습니다.
  const ready = stageCycle(1, kind === 'load' ? 'MEM' : 'EX');
  return Math.max(0, ready + 1 - stageCycle(2 + gap, 'EX'));
}

export function flushedInstructions(resolveStage = 'EX') {
  const resolved = stageCycle(1, resolveStage);
  // EN: At resolution, younger sequential instructions already occupy IF/ID.
  // KO: 분기 결과가 나오는 순간 IF/ID에 들어온 뒤따르는 명령을 지웁니다.
  return Math.max(0, resolved - 1);
}

export function answerFor(puzzle) {
  return puzzle.kind === 'branch'
    ? flushedInstructions(puzzle.resolveStage)
    : requiredDelay(puzzle.producerKind, puzzle.forwarding, puzzle.gapInstructions?.length || 0);
}

export function buildRows(puzzle, proposed) {
  const answer = answerFor(puzzle);
  const rows = [];
  const add = (label, start, status = 'normal', cells) => rows.push({ label, start, status,
    cells: cells || Object.fromEntries(STAGES.map((stage, i) => [start + i, stage])) });
  add(puzzle.instructions[0], 1);
  if (puzzle.kind === 'branch') {
    const resolved = stageCycle(1, puzzle.resolveStage);
    // EN: Only instructions fetched by the resolution cycle can require a flush.
    // KO: 분기 결정 클록까지 가져온 명령만 flush 대상이 됩니다.
    const firstFlushed = proposed >= 1;
    const secondFlushed = proposed >= 2;
    add(puzzle.instructions[1], 2, firstFlushed ? 'flushed' : 'wrong-path', firstFlushed ? Object.fromEntries(Array.from({ length: resolved - 1 }, (_, i) => [2 + i, STAGES[i]])) : undefined);
    if (resolved >= 3) add(puzzle.instructions[2], 3, secondFlushed ? 'flushed' : 'wrong-path', secondFlushed ? { 3: 'IF' } : undefined);
    else add(puzzle.instructions[2], 3, 'not-fetched', {});
    add(puzzle.instructions[3], resolved + 1, 'target');
  } else {
    const gap = puzzle.gapInstructions || [];
    gap.forEach((line, i) => add(line, 2 + i, 'independent'));
    const consumerStart = 2 + gap.length;
    if (puzzle.producerKind === 'load' && puzzle.forwarding && proposed > 0) {
    // EN: A load-use stall holds the consumer in ID and injects an EX bubble.
    // KO: load-use stall에서는 소비자가 ID에 머물고 EX에 bubble이 들어갑니다.
    for (let i = 0; i < proposed; i++) add('bubble / stall', consumerStart + 2 + i, 'bubble', { [consumerStart + 2 + i]: 'EX' });
    const consumer = { [consumerStart]: 'IF', [consumerStart + 1]: 'ID' };
    for (let cycle = consumerStart + 2; cycle <= consumerStart + 1 + proposed; cycle++) consumer[cycle] = 'ID';
    ['EX', 'MEM', 'WB'].forEach((stage, i) => { consumer[consumerStart + 2 + proposed + i] = stage; });
    add(puzzle.instructions.at(-1), consumerStart, proposed >= answer ? 'safe' : 'hazard',
      consumer);
    } else {
      for (let i = 0; i < proposed; i++) add('NOP', consumerStart + i, 'bubble');
      add(puzzle.instructions.at(-1), consumerStart + proposed, proposed >= answer ? 'safe' : 'hazard');
    }
  }
  return rows;
}

export function inspectAttempt(puzzle, proposed) {
  if (!Number.isInteger(proposed) || proposed < 0 || proposed > 2) throw new RangeError('Choose 0, 1, or 2');
  const answer = answerFor(puzzle);
  return { answer, correct: proposed === answer, rows: buildRows(puzzle, proposed) };
}
