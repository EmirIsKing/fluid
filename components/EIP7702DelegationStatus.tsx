import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { SUPPORTED_CHAINS } from "@shared/chains";

interface DelegationChain {
  id: number;
  name: string;
  isDelegated: boolean;
  isLoading?: boolean;
}

interface EIP7702DelegationStatusProps {
  chains?: DelegationChain[];
  onDelegate?: (chainId: number) => Promise<void>;
}

const DEFAULT_CHAINS: DelegationChain[] = SUPPORTED_CHAINS.map(c => ({
  id: c.chainId,
  name: c.label,
  isDelegated: false,
}));

export function EIP7702DelegationStatus({
  chains = DEFAULT_CHAINS,
  onDelegate,
}: EIP7702DelegationStatusProps) {
  const [delegationStates, setDelegationStates] = useState<Record<number, boolean>>(
    chains.reduce((acc, chain) => ({ ...acc, [chain.id]: chain.isDelegated }), {})
  );
  const [loadingChains, setLoadingChains] = useState<Set<number>>(new Set());

  const handleDelegate = async (chainId: number) => {
    if (loadingChains.has(chainId)) return;

    setLoadingChains((prev) => new Set(prev).add(chainId));
    try {
      if (onDelegate) {
        await onDelegate(chainId);
      }
      setDelegationStates((prev) => ({ ...prev, [chainId]: true }));
    } catch (err) {
      console.error("Delegation failed:", err);
    } finally {
      setLoadingChains((prev) => {
        const next = new Set(prev);
        next.delete(chainId);
        return next;
      });
    }
  };

  const delegatedCount = Object.values(delegationStates).filter(Boolean).length;
  const totalChains = Object.keys(delegationStates).length;

  return (
    <Card className="bg-card/50 border-border/50 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold">EIP-7702 Delegation</h3>
              <p className="text-xs text-muted-foreground">
                Enable Universal Account routing on each supported chain
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-cyan-400/50 text-cyan-400">
            {delegatedCount}/{totalChains}
          </Badge>
        </div>

        <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-lg p-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">EIP-7702 Delegation:</span> Authorizes your EOA to act as a Universal Account
            on each chain, enabling gas sponsorship and cross-chain settlement from any Primary Asset you hold.
          </p>
        </div>

        <div className="space-y-3">
          {chains.map((chain) => {
            const isDelegated = delegationStates[chain.id];
            const isLoading = loadingChains.has(chain.id);

            return (
              <div
                key={chain.id}
                className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold">
                    {chain.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{chain.name}</p>
                    <p className="text-xs text-muted-foreground">Chain ID: {chain.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isDelegated ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-semibold">Delegated</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-semibold">Not Delegated</span>
                    </div>
                  )}

                  {!isDelegated && (
                    <Button
                      size="sm"
                      onClick={() => handleDelegate(chain.id)}
                      disabled={isLoading}
                      className="neon-button text-xs h-8"
                    >
                      {isLoading ? (
                        <>
                          <Clock className="w-3 h-3 mr-1 animate-spin" />
                          Delegating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3 mr-1" />
                          Delegate
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-background/50 rounded-lg p-4 border border-border/50">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Benefits of Delegation</p>
          <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
            <li>Cross-chain payments from any Primary Asset</li>
            <li>Gas sponsored from your unified balance</li>
            <li>Single-signature settlement on destination chains</li>
            <li>No manual network switching required</li>
          </ul>
        </div>

        {delegatedCount === totalChains && (
          <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
            <p className="text-sm text-green-300">
              ✓ All supported chains delegated. You can send to any destination from whatever you hold.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
