export type Eip1193Request = {
  method: string;
  params?: readonly unknown[] | Record<string, unknown>;
};

export type Eip1193Provider = {
  isMetaMask?: boolean;
  request<T = unknown>(request: Eip1193Request): Promise<T>;
  on?(event: "accountsChanged", listener: (accounts: string[]) => void): void;
  on?(event: "chainChanged", listener: (chainId: string) => void): void;
  removeListener?(
    event: "accountsChanged",
    listener: (accounts: string[]) => void,
  ): void;
  removeListener?(event: "chainChanged", listener: (chainId: string) => void): void;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}
