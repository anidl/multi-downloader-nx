export interface MessageHandler {
  auth: (data: AuthData) => Promise<AuthResponse>;
}

export type AuthData = { username: string, password: string };
export type AuthResponse = ResponseBase<undefined>;

export type ResponseBase<T> = ({
  isOk: true,
  value: T
} | {
  isOk: false,
  reason: Error
});

export type PossibleMessanges = keyof ServiceHandler;