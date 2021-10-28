declare module 'sei-helper' {
  export async function question(qStr: string): string;
  export function cleanupFilename(str: string): string;
  export function exec(str: string, str1: string, str2: string);
}