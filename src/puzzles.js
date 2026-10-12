// EN: Each case starts with the symptom, then lets the player test a timing fix.
// KO: 먼저 증상을 보여주고, 사용자가 타이밍 해결책을 고르게 구성했습니다.
export const puzzles = [
  {
    id: 'manual-nop', number: '01', kind: 'dependency', producerKind: 'alu', forwarding: false,
    instructions: ['addi x5, x0, 7', 'add x6, x5, x5'],
    source: 'https://github.com/devjwk/Project-Part-2/blob/main/proj/src/TopLevel/RISCV_Processor.vhd',
    title: { en: 'The missing NOPs', ko: '빠진 NOP 찾기' },
    premise: { en: 'The pipeline has no forwarding. The add instruction reads x5 in ID; addi writes it in WB.', ko: 'forwarding이 없는 파이프라인입니다. add는 ID에서 x5를 읽고 addi는 WB에서 x5를 씁니다.' },
    question: { en: 'How many NOPs must go between these instructions?', ko: '두 명령 사이에 NOP를 몇 개 넣어야 할까요?' },
    unit: { en: 'NOPs', ko: '개 NOP' },
    note: { en: 'addi reaches WB in cycle 5. With two NOPs, add reaches ID in cycle 5 and reads the new x5 = 7; x6 becomes 14.', ko: 'addi는 5번째 클록에 WB에 도착합니다. NOP 두 개를 넣으면 add의 ID도 5번째 클록이 되어 새 x5=7을 읽고 x6=14가 됩니다.' },
    explanation: {
      outcome: { en: 'x5 = 7 → x6 = 14', ko: 'x5 = 7 → x6 = 14' },
      steps: [
        { cycle: 3, label: { en: 'Value produced', ko: '값 계산' }, detail: { en: 'addi computes 7 in EX, but the following add cannot read it from the register file yet.', ko: 'addi가 EX에서 7을 계산하지만 다음 add는 아직 레지스터 파일에서 이 값을 읽을 수 없습니다.' } },
        { cycle: 5, label: { en: 'Write meets read', ko: '쓰기와 읽기 일치' }, detail: { en: 'addi writes x5 in WB. After two NOPs, add reaches ID in this same cycle and reads the new value.', ko: 'addi가 WB에서 x5를 씁니다. NOP 두 개 뒤의 add는 같은 클록에 ID에 도착해 새 값을 읽습니다.' } },
        { cycle: 6, label: { en: 'Correct addition', ko: '올바른 덧셈' }, detail: { en: 'add executes 7 + 7 in EX; its result is 14.', ko: 'add가 EX에서 7 + 7을 계산해 14를 만듭니다.' } }
      ]
    },
    code: 'proj/src/TopLevel/RISCV_Processor.vhd · software-scheduled pipeline'
  },
  {
    id: 'forwarding', number: '02', kind: 'dependency', producerKind: 'alu', forwarding: true,
    instructions: ['addi x5, x0, 7', 'add x6, x5, x5'],
    source: 'https://github.com/devjwk/Project-Part-1/blob/main/proj/src/TopLevel/forwarding_unit_all.vhd',
    title: { en: 'A shorter route', ko: '우회 경로 활용하기' },
    premise: { en: 'Forwarding is enabled. The addi result can travel from the preceding EX result to the next EX input.', ko: 'forwarding이 켜져 있습니다. addi의 EX 결과를 다음 add의 EX 입력으로 바로 전달할 수 있습니다.' },
    question: { en: 'How many stall cycles are needed?', ko: 'stall이 몇 클록 필요할까요?' },
    unit: { en: 'stall cycles', ko: '클록 stall' },
    note: { en: 'addi computes x5 = 7 in EX at cycle 3. The next add uses it in EX at cycle 4 through forwarding, then writes x6 = 14.', ko: 'addi가 3번째 클록의 EX에서 x5=7을 계산합니다. 다음 add는 4번째 클록의 EX에서 그 값을 forwarding으로 받아 x6=14를 만듭니다.' },
    explanation: {
      outcome: { en: '0 stalls → x6 = 14', ko: 'stall 0회 → x6 = 14' },
      steps: [
        { cycle: 3, label: { en: 'ALU result ready', ko: 'ALU 결과 준비' }, detail: { en: 'addi calculates x5 = 7 at the end of EX.', ko: 'addi가 EX가 끝날 때 x5=7을 계산합니다.' } },
        { cycle: 4, label: { en: 'Forward into EX', ko: 'EX로 바로 전달' }, detail: { en: 'The next add receives 7 through the forwarding path and computes 7 + 7.', ko: '다음 add가 forwarding 경로로 7을 받아 7 + 7을 계산합니다.' } },
        { cycle: 6, label: { en: 'Result committed', ko: '결과 기록' }, detail: { en: 'add writes x6 = 14 in WB. An extra stall would work but waste a cycle.', ko: 'add가 WB에서 x6=14를 기록합니다. stall을 더 넣어도 계산은 되지만 클록을 낭비합니다.' } }
      ]
    },
    code: 'proj/src/TopLevel/forwarding_unit_all.vhd'
  },
  {
    id: 'load-use', number: '03', kind: 'dependency', producerKind: 'load', forwarding: true,
    instructions: ['lw x5, 0(x0)', 'add x6, x5, x5'],
    source: 'https://github.com/devjwk/Project-Part-1/blob/main/proj/src/TopLevel/hazard_detection_unit.vhd',
    title: { en: 'The load-use trap', ko: 'load-use 함정' },
    premise: { en: 'Memory[0] contains 9. Forwarding is available, but the load value appears only after MEM.', ko: '메모리[0]에는 9가 있습니다. forwarding은 가능하지만 load 값은 MEM 이후에야 나옵니다.' },
    question: { en: 'How many stall cycles does the add need?', ko: 'add는 몇 클록 기다려야 할까요?' },
    unit: { en: 'stall cycles', ko: '클록 stall' },
    note: { en: 'lw gets 9 in MEM at cycle 4. Without a stall, add would need it in EX during that same cycle. One stall moves add EX to cycle 5; x6 becomes 18.', ko: 'lw는 4번째 클록 MEM에서 9를 얻습니다. stall이 없으면 add도 같은 클록 EX에서 9가 필요합니다. 한 클록 기다리면 add EX가 5번째 클록으로 이동해 x6=18이 됩니다.' },
    explanation: {
      outcome: { en: 'Memory[0] = 9 → x6 = 18', ko: '메모리[0] = 9 → x6 = 18' },
      steps: [
        { cycle: 4, label: { en: 'Load completes MEM', ko: 'load의 MEM 완료' }, detail: { en: 'lw receives 9 from memory. The dependent add is held in ID; an EX bubble is inserted.', ko: 'lw가 메모리에서 9를 받습니다. add는 ID에서 기다리고 EX에는 bubble이 들어갑니다.' } },
        { cycle: 5, label: { en: 'Forward after the stall', ko: '기다린 뒤 전달' }, detail: { en: 'The add now enters EX and receives 9 through forwarding, computing 9 + 9.', ko: 'add가 EX로 이동해 forwarding으로 9를 받아 9 + 9를 계산합니다.' } },
        { cycle: 7, label: { en: 'Result committed', ko: '결과 기록' }, detail: { en: 'add writes x6 = 18 in WB.', ko: 'add가 WB에서 x6=18을 기록합니다.' } }
      ]
    },
    code: 'proj/src/TopLevel/hazard_detection_unit.vhd'
  },
  {
    id: 'branch', number: '04', kind: 'branch', resolveStage: 'EX', forwarding: true,
    instructions: ['beq x1, x1, target', 'addi x2, x0, 1', 'addi x3, x0, 1', 'target: addi x4, x0, 4'],
    source: 'https://github.com/devjwk/Project-Part-1/blob/main/proj/src/TopLevel/contro_hazard_unit.vhd',
    title: { en: 'The wrong path', ko: '잘못 가져온 명령 지우기' },
    premise: { en: 'The branch is taken and resolves in EX. Two younger sequential instructions are already in the pipe.', ko: '분기는 실행되며 EX에서 결과가 결정됩니다. 그 사이 순차 경로의 명령 두 개가 파이프라인에 들어왔습니다.' },
    question: { en: 'How many younger instructions must be flushed?', ko: '뒤따르는 명령 몇 개를 flush해야 할까요?' },
    unit: { en: 'instructions flushed', ko: '개 명령 flush' },
    note: { en: 'The branch resolves in EX at cycle 3. The sequential instructions in ID and IF are wrong-path work, so both are flushed. The target starts fetching in cycle 4.', ko: '분기는 3번째 클록 EX에서 결정됩니다. 그때 ID와 IF에 있는 두 순차 명령은 잘못된 경로이므로 모두 지웁니다. target은 4번째 클록에 fetch됩니다.' },
    explanation: {
      outcome: { en: 'x2 and x3 untouched → x4 = 4', ko: 'x2·x3는 실행되지 않음 → x4 = 4' },
      steps: [
        { cycle: 3, label: { en: 'Branch resolves', ko: '분기 결정' }, detail: { en: 'beq is taken in EX. The sequential instructions already in ID and IF both belong to the wrong path.', ko: 'beq가 EX에서 분기합니다. 이미 ID와 IF에 있는 순차 명령 두 개는 모두 잘못된 경로입니다.' } },
        { cycle: 4, label: { en: 'Target fetch begins', ko: '목표 명령 가져오기' }, detail: { en: 'Both wrong-path instructions are flushed. The target instruction enters IF.', ko: '잘못된 경로의 두 명령을 제거하고 target 명령을 IF로 가져옵니다.' } },
        { cycle: 8, label: { en: 'Only target commits', ko: '목표 명령만 기록' }, detail: { en: 'The target writes x4 = 4 in WB. The flushed instructions never write x2 or x3.', ko: 'target이 WB에서 x4=4를 기록합니다. 제거된 명령은 x2나 x3에 값을 쓰지 않습니다.' } }
      ]
    },
    code: 'proj/src/TopLevel/contro_hazard_unit.vhd'
  }
];
