/// <reference types="vite/client" />

interface Window {
  ethereum: import("ethers").Eip1193Provider & {
    on: (event: string, cb: (param: unknown) => void) => void;
  };
  relayerSDK?: {
    initSDK: (options?: any) => Promise<boolean>;
    createInstance: (config: any) => Promise<any>;
    SepoliaConfig: any;
    __initialized__?: boolean;
  };
}
