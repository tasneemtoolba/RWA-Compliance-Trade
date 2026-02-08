"use client";

import { useEnsName, useEnsAvatar } from "wagmi";
import Image from "next/image";
import { formatAddress } from "@/lib/helper";

interface EnsIdentityProps {
  address: `0x${string}`;
  showAddress?: boolean;
  size?: "sm" | "md" | "lg";
}

export function EnsIdentity({ address, showAddress = true, size = "md" }: EnsIdentityProps) {
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName || undefined });
  
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-lg",
  };
  
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center gap-2">
      {ensAvatar ? (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border border-slate-200`}>
          <Image
            src={ensAvatar}
            alt={ensName || address}
            width={size === "sm" ? 24 : size === "md" ? 40 : 64}
            height={size === "sm" ? 24 : size === "md" ? 40 : 64}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-primary-brand flex items-center justify-center text-white font-semibold`}>
          {ensName ? ensName[0].toUpperCase() : address[2]?.toUpperCase() || "?"}
        </div>
      )}
      <div className="flex flex-col">
        {ensName ? (
          <span className={`font-medium ${textSizeClasses[size]}`}>{ensName}</span>
        ) : null}
        {showAddress && (
          <span className={`text-slate-500 font-mono ${textSizeClasses[size === "sm" ? "sm" : "sm"]}`}>
            {formatAddress(address)}
          </span>
        )}
      </div>
    </div>
  );
}
