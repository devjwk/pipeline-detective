// EN: New examples change the data, while the timing question stays the same.
// KO: 값과 레지스터를 바꾸되 각 사건의 타이밍 규칙은 그대로 유지합니다.
export function makeVariant(base, serial) {
  if (!Number.isInteger(serial) || serial < 0) throw new RangeError('Invalid variant number');
  if (serial === 0) return base;
  const first = [8, 10, 12, 14, 16, 18, 20, 22][(serial - 1) % 8];
  const second = first + 1;
  const value = 2 + ((serial * 37 + 11) % 97);
  const target = 1 + ((serial * 19 + 3) % 98);
  const name = `x${first}`;
  const output = `x${second}`;

  if (base.kind === 'branch') {
    const resolveStage = serial % 2 ? 'ID' : 'EX';
    const resolveCycle = resolveStage === 'ID' ? 2 : 3;
    const flushCount = resolveCycle - 1;
    const wrongA = `x${first}`;
    const wrongB = `x${second}`;
    const targetReg = `x${first + 2}`;
    const aValue = value;
    const bValue = target;
    const goal = 1 + ((serial * 23 + 5) % 98);
    return {
      ...base,
      resolveStage,
      instructions: [`beq x1, x1, target`, `addi ${wrongA}, x0, ${aValue}`, `addi ${wrongB}, x0, ${bValue}`, `target: addi ${targetReg}, x0, ${goal}`],
      trace: { wrong: [{ register: wrongA, value: aValue }, { register: wrongB, value: bValue }], target: { register: targetReg, value: goal } },
      premise: { ko: `분기가 실행되며 ${resolveStage}에서 결정됩니다. 그때 잘못된 경로에 들어온 명령을 몇 개 제거해야 할까요?`, en: `The branch is taken and resolves in ${resolveStage}. How many wrong-path instructions are already in flight?` },
      note: { ko: `${resolveCycle}번째 클록 ${resolveStage}에서 분기가 결정됩니다. 잘못된 경로 ${flushCount}개를 flush하고 목표 명령이 ${targetReg}=${goal}을 기록합니다.`, en: `The branch resolves in ${resolveStage} at cycle ${resolveCycle}. Flush ${flushCount} wrong-path instruction(s); the target commits ${targetReg}=${goal}.` },
      explanation: {
        outcome: { ko: `${wrongA}·${wrongB} 유지 → ${targetReg} = ${goal}`, en: `${wrongA} and ${wrongB} unchanged → ${targetReg} = ${goal}` },
        steps: [
          { cycle: resolveCycle, label: { ko: '분기 결정', en: 'Branch resolves' }, detail: { ko: `${resolveStage}의 beq가 참입니다. ${flushCount}개 순차 명령이 잘못된 경로에 있습니다.`, en: `The beq is true in ${resolveStage}. ${flushCount} sequential instruction(s) are on the wrong path.` } },
          { cycle: resolveCycle + 1, label: { ko: '잘못된 경로 제거', en: 'Flush wrong path' }, detail: { ko: `${flushCount}개 명령을 flush하고 target의 ${targetReg} 명령을 가져옵니다.`, en: `Flush ${flushCount} instruction(s) and fetch the target writing ${targetReg}.` } },
          { cycle: resolveCycle + 5, label: { ko: '목표 값 기록', en: 'Target commits' }, detail: { ko: `${targetReg}=${goal}이 WB에 기록됩니다. ${wrongA}와 ${wrongB}는 0을 유지합니다.`, en: `${targetReg}=${goal} commits in WB. ${wrongA} and ${wrongB} remain 0.` } }
        ]
      }
    };
  }

  const load = base.producerKind === 'load';
  const source = load ? `lw ${name}, 0(x0)` : `addi ${name}, x0, ${value}`;
  const input = load ? target : value;
  const result = input * 2;
  const gapCount = base.forwarding && load ? serial % 2 : serial % 3;
  const independent = Array.from({ length: gapCount }, (_, i) => ({ register: `x${27 + i}`, value: 1 + ((serial * 13 + i * 17) % 98) }));
  const gapInstructions = independent.map(item => `addi ${item.register}, x0, ${item.value}`);
  const producerReady = load ? 4 : 3;
  const consumerUse = base.forwarding ? (load ? 5 : 4 + gapCount) : 5;
  const resultCycle = base.forwarding ? (load ? 7 : 6 + gapCount) : 6;
  const steps = [
    { cycle: producerReady, label: { ko: load ? '메모리 값 준비' : 'ALU 값 계산', en: load ? 'Memory value ready' : 'ALU value computed' }, detail: { ko: load ? `Memory[0]에서 ${input}을 읽습니다. ${name}에는 아직 기록되지 않았습니다.` : `EX에서 ${name}의 값 ${input}을 계산하지만 아직 레지스터에 기록되지 않았습니다.`, en: load ? `Read ${input} from Memory[0]; ${name} is not committed yet.` : `EX computes ${input} for ${name}, but the register is not committed yet.` } },
    { cycle: consumerUse, label: { ko: base.forwarding ? '값 전달' : '쓰기와 읽기 일치', en: base.forwarding ? 'Value forwarded' : 'Write meets read' }, detail: { ko: base.forwarding ? `${output}을 계산할 add가 EX에서 ${input}을 받아 사용합니다.` : `${name}이 WB에서 ${input}으로 기록되고 add가 같은 클록 ID에서 읽습니다.`, en: base.forwarding ? `The add receives ${input} in EX to compute ${output}.` : `${name} commits ${input} in WB and the add reads it in ID in the same cycle.` } },
    { cycle: resultCycle, label: { ko: base.forwarding ? '결과 기록' : '덧셈 결과', en: base.forwarding ? 'Result committed' : 'Addition result' }, detail: { ko: base.forwarding ? `${output}=${result}이 WB에 기록됩니다.` : `add가 EX에서 ${input}+${input}=${result}을 계산합니다.`, en: base.forwarding ? `${output}=${result} commits in WB.` : `The add computes ${input}+${input}=${result} in EX.` } }
  ];
  return {
    ...base,
    instructions: [source, ...gapInstructions, `add ${output}, ${name}, ${name}`],
    gapInstructions,
    trace: { input: { register: name, value: input }, output: { register: output, value: result }, independent, ...(load ? { memory: { address: 0, value: input } } : {}) },
    premise: load
      ? { ko: `Memory[0]에는 ${input}이 있습니다. forwarding이 있어도 load 값은 MEM이 끝난 뒤에야 사용할 수 있습니다.`, en: `Memory[0] contains ${input}. Even with forwarding, a load value is available only after MEM.` }
      : { ko: base.forwarding ? `${name}의 EX 결과를 다음 add의 EX 입력으로 forwarding할 수 있습니다.` : `forwarding이 없습니다. add는 ID에서 ${name}을 읽고 addi는 WB에서 씁니다.`, en: base.forwarding ? `The EX result for ${name} can be forwarded to the next add in EX.` : `There is no forwarding. The add reads ${name} in ID; addi writes it in WB.` },
    note: { ko: `${name}=${input}을 준비하고 add가 ${output}=${result}을 만듭니다. 중간의 독립 명령 ${gapCount}개가 대기 시간을 채우는지도 확인하세요.`, en: `The add produces ${output}=${result} after ${name}=${input}. Check whether the ${gapCount} independent instruction(s) fill the needed delay.` },
    question: { ko: load ? '이 코드에서 추가 stall이 몇 클록 필요한가요?' : base.forwarding ? '이 코드에서 추가 stall이 몇 클록 필요한가요?' : '이 코드에서 NOP를 몇 개 더 넣어야 하나요?', en: load || base.forwarding ? 'How many extra stall cycles does this code need?' : 'How many more NOPs does this code need?' },
    explanation: { outcome: { ko: `${name} = ${input} → ${output} = ${result}`, en: `${name} = ${input} → ${output} = ${result}` }, steps }
  };
}
