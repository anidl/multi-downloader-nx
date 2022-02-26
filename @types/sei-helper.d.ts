declare module 'sei-helper' {
  export async function question(qStr: string): Promise<string>;
  export function cleanupFilename(str: string): string;
  export const cookie: {
    parse: (data: Record<string, string>) => Record<string, {
      value: string;
      expires: Date;
      path: string;
      domain: string;
      secure: boolean;
    }>
  };
  export function formatTime(time: number): string
}