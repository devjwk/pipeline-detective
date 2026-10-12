// EN: Trace the authored exercise families, including newly generated examples.
// KO: 새 예시를 포함한 사건 유형별 상태를 추적합니다.
export function traceValues(puzzle, rows, cycle) {
  if (!Number.isInteger(cycle) || cycle < 1) throw new RangeError('Invalid cycle');
  const config = puzzle.trace || (puzzle.kind === 'branch'
    ? { wrong: [{ register: 'x2', value: 1 }, { register: 'x3', value: 1 }], target: { register: 'x4', value: 4 } }
    : { input: { register: 'x5', value: puzzle.producerKind === 'load' ? 9 : 7 }, output: { register: 'x6', value: puzzle.producerKind === 'load' ? 18 : 14 }, ...(puzzle.producerKind === 'load' ? { memory: { address: 0, value: 9 } } : {}) });
  const registers = puzzle.kind === 'branch'
    ? Object.fromEntries(['x1', ...config.wrong.map(item => item.register), config.target.register].map(name => [name, 0]))
    : { [config.input.register]: 0, ...(config.independent || []).reduce((all, item) => ({ ...all, [item.register]: 0 }), {}), [config.output.register]: 0 };
  const memory = config.memory || null;
  const events = [];
  const addEvent = (at, stage, kind, value, register) => {
    if (at === cycle) events.push({ stage, kind, value, register });
  };
  const stageAt = (row, stage) => Number(Object.entries(row.cells).find(([, name]) => name === stage)?.[0] || 0);

  if (puzzle.kind === 'branch') {
    const resolved = stageAt(rows[0], puzzle.resolveStage);
    addEvent(resolved, puzzle.resolveStage, 'branchTaken');
    rows.slice(1, 3).forEach((row, index) => {
      const { register, value } = config.wrong[index];
      if (row.status === 'flushed') {
        addEvent(resolved, resolved === 2 ? 'IF' : index === 0 ? 'ID' : 'IF', 'flushed', null, register);
      } else {
        const wb = stageAt(row, 'WB');
        if (wb && wb <= cycle) registers[register] = value;
        addEvent(wb, 'WB', 'wrongCommit', value, register);
      }
    });
    const targetWb = stageAt(rows[3], 'WB');
    if (targetWb <= cycle) registers[config.target.register] = config.target.value;
    addEvent(targetWb, 'WB', 'commit', config.target.value, config.target.register);
    return { registers, memory, events };
  }

  const producer = rows[0];
  const consumer = rows.at(-1);
  (config.independent || []).forEach(item => {
    const row = rows.find(candidate => candidate.label === `addi ${item.register}, x0, ${item.value}`);
    const wb = row ? stageAt(row, 'WB') : 0;
    if (wb && wb <= cycle) registers[item.register] = item.value;
    addEvent(wb, 'WB', 'commit', item.value, item.register);
  });
  const readyStage = puzzle.producerKind === 'load' ? 'MEM' : 'EX';
  const readyCycle = stageAt(producer, readyStage);
  const producerWb = stageAt(producer, 'WB');
  const readStage = puzzle.forwarding ? 'EX' : 'ID';
  const readCycle = stageAt(consumer, readStage);
  const safe = puzzle.forwarding ? readCycle > readyCycle : readCycle >= producerWb;
  const input = config.input.value;
  const result = safe ? input * 2 : 0;
  const consumerEx = stageAt(consumer, 'EX');
  const consumerWb = stageAt(consumer, 'WB');

  addEvent(readyCycle, readyStage, puzzle.producerKind === 'load' ? 'loaded' : 'computed', input, config.input.register);
  addEvent(readCycle, readStage, safe ? (puzzle.forwarding ? 'forwarded' : 'read') : 'staleRead', safe ? input : 0, config.input.register);
  addEvent(consumerEx, 'EX', safe ? 'computed' : 'staleResult', result, config.output.register);
  if (producerWb <= cycle) registers[config.input.register] = input;
  addEvent(producerWb, 'WB', 'commit', input, config.input.register);
  if (consumerWb <= cycle) registers[config.output.register] = result;
  addEvent(consumerWb, 'WB', safe ? 'commit' : 'wrongCommit', result, config.output.register);
  return { registers, memory, events };
}
