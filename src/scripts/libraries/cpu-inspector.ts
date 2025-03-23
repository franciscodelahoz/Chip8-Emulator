import { toHexString } from './datatypes';
import { loggerStyles } from '../constants/logger.constants';
import type { CPUStatus } from '../types/emulator';

function formatSP(SP: number, stackSize: number): string {
  if (SP < 0) {
    return `Underflow (SP: ${SP})`;
  }

  if (SP > stackSize) {
    return `Overflow (SP: ${SP}, Stack Size: ${stackSize})`;
  }

  return toHexString(SP, 2);
}

function logCoreRegisters(cpuStatus: CPUStatus): void {
  const PC = toHexString(cpuStatus.PC - 2, 2);
  const DT = toHexString(cpuStatus.DT, 2);
  const ST = toHexString(cpuStatus.ST, 2);

  const { SP, I } = cpuStatus;

  const SPHex = formatSP(SP, cpuStatus.stack.length);
  const cycleCounter = cpuStatus.cycleCounter.toLocaleString();

  console.group('%cCore Registers', loggerStyles.title);
  console.log(`%cPC: ${PC} | SP: ${SPHex} | I: ${I}`, loggerStyles.debug);
  console.log(`%cDT: ${DT} (${cpuStatus.DT}) | ST: ${ST} (${cpuStatus.ST})`, loggerStyles.debug);
  console.log(`%cCycles: ${cycleCounter} | Memory Size: ${cpuStatus.memorySize}`, loggerStyles.debug);
  console.groupEnd();
}

function logRegisters(registers: Uint8Array): void {
  console.group('%cRegisters', loggerStyles.title);

  for (let rowIndex = 0; rowIndex < 4; rowIndex += 1) {
    const registerRowEntries = [];

    for (let colIndex = 0; colIndex < 4; colIndex += 1) {
      const registerIndex = rowIndex * 4 + colIndex;
      const registerValue = registers[registerIndex];

      const registerIndexHex = registerIndex.toString(16).toUpperCase();
      const registerValueHex = toHexString(registerValue, 2);

      registerRowEntries.push(`V${registerIndexHex}: ${registerValueHex} (${registerValue})`);
    }

    console.log(`%c${registerRowEntries.join(' | ')}`, loggerStyles.debug);
  }

  console.groupEnd();
}

function logStack(stack: number[]): void {
  console.group('%cStack', loggerStyles.title);

  if (stack.length === 0) {
    console.log('%c(Empty stack)', loggerStyles.warn);
  } else {
    const formattedStackRows = [];

    for (let stackOffset = 0; stackOffset < stack.length; stackOffset += 4) {
      const stackSegment = stack.slice(stackOffset, stackOffset + 4);

      const formattedStackEntries = stackSegment.map((stackValue, segmentIndex) =>
        `[${(stackOffset + segmentIndex).toString().padStart(2, '0')}]: ${toHexString(stackValue, 4)}`);

      formattedStackRows.push(formattedStackEntries.join(' | '));
    }

    formattedStackRows.forEach((formattedRow) => {
      console.log(`%c${formattedRow}`, loggerStyles.debug);
    });
  }

  console.groupEnd();
}

function logQuirksConfiguration(quirksConfigurations: Record<string, boolean>): void {
  console.group('%cQuirks Configuration', loggerStyles.title);

  const quirksEntries = Object.entries(quirksConfigurations);

  if (quirksEntries.length === 0) {
    console.log('%c(No quirks configured)', loggerStyles.warn);
  } else {
    const enabledQuirkNames = quirksEntries
      .filter(([ _, isEnabled ]) => isEnabled)
      .map(([ quirkName ]) => quirkName);

    const disabledQuirkNames = quirksEntries
      .filter(([ _, isEnabled ]) => !isEnabled)
      .map(([ quirkName ]) => quirkName);

    if (enabledQuirkNames.length > 0) {
      console.log('%cEnabled:', `${loggerStyles.debug}; font-weight: bold;`);
      console.log(`%c${enabledQuirkNames.join(', ')}`, loggerStyles.info);
    }

    if (disabledQuirkNames.length > 0) {
      console.log('%cDisabled:', `${loggerStyles.debug}; font-weight: bold;`);
      console.log(`%c${disabledQuirkNames.join(', ')}`, loggerStyles.warn);
    }
  }

  console.groupEnd();
}

export function dumpStatus(cpuStatus: CPUStatus): void {
  const timestamp = new Date().toISOString();

  console.group('%cCPU Status Report', `${loggerStyles.title}; color: #4a90e2;`);
  console.log(`%cTimestamp: ${timestamp}`, loggerStyles.info);

  logCoreRegisters(cpuStatus);
  logRegisters(cpuStatus.registers);
  logStack(cpuStatus.stack);
  logQuirksConfiguration(cpuStatus.quirksConfigurations);

  console.groupEnd();
}

export function logError(message: string, pc: number, opcode: number): void {
  const PC = toHexString(pc - 2, 4);
  const opcodeHex = toHexString(opcode, 4);

  console.error(`%cCPU Error: ${message} @ Address ${PC} : Opcode: ${opcodeHex}`, loggerStyles.error);
}
