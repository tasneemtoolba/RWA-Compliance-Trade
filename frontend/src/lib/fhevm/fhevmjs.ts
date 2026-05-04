// This file is deprecated - use useFhevm hook from hooks/fhevm/useFhevm.tsx instead
// Keeping for backward compatibility but redirecting to new implementation

export type FhevmStatus = "uninitialized" | "creating" | "ready" | "error";

// Deprecated - use useFhevm hook instead
export const createFhevmInstance = async () => {
  throw new Error("createFhevmInstance is deprecated. Please use the useFhevm hook from hooks/fhevm/useFhevm.tsx");
};

export const getFhevmStatus = (): FhevmStatus => {
  return "uninitialized";
};
