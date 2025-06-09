import { JinoProject } from '@/types/project';
import { transpileToArduinoIno, TranspilationOptions } from './arduino_ino_transpiler';

export type SupportedLanguage = '.ino' | 'python'; // Add more as they are implemented

export function transpileProject(
  project: JinoProject,
  language: SupportedLanguage,
  options: TranspilationOptions
): string {
  switch (language) {
    case '.ino':
      return transpileToArduinoIno(project, options);
    // case 'python':
    //   return transpileToPython(project, options); // Example for future language
    default:
      console.error(`Transpiler for language ${language} not found.`);
      throw new Error(`Transpiler for language ${language} not found.`);
  }
}
