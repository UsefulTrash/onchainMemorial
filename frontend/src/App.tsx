import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "./wagmi";

const ADDR = (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";
const ABI = [
  { name: "createMemorial", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "dedicatedTo", type: "string" }, { name: "message", type: "string" }, { name: "relationship", type: "string" }], outputs: [] },
  { name: "getRecentMemorials", type: "function", stateMutability: "view",
    inputs: [{ name: "count", type: "uint256" }],
    outputs: [{ name: "", type: "tuple[]", components: [
      { name: "creator", type: "address" }, { name: "dedicatedTo", type: "string" },
      { name: "message", type: "string" }, { name: "relationship", type: "string" }, { name: "timestamp", type: "uint256" }
    ]}] },
  { name: "totalMemorials", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;

function timeAgo(ts: bigint) {
  const s = Math.floor(Date.now() / 1000 - Number(ts));
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`;
}

export default function App() {
  const { isConnected } = useAccount();
  const [form, setForm] = useState({ dedicatedTo: "", message: "", relationship: "" });
  const [sent, setSent] = useState(false);
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { data: memorials, refetch } = useReadContract({ address: ADDR, abi: ABI, functionName: "getRecentMemorials", args: [BigInt(20)], query: { refetchInterval: 15000 } });
  const { data: total } = useReadContract({ address: ADDR, abi: ABI, functionName: "totalMemorials" });

  if (isSuccess && !sent) { setSent(true); refetch(); setTimeout(() => setSent(false), 3000); }
  const isLoading = isPending || isConfirming;
  const list = (memorials as any[] | undefined)?.slice().reverse() ?? [];

  return (
    <div className="min-h-screen bg-[#080b14]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#a855f7]/6 blur-[120px]" />
      </div>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-50 bg-[#080b14]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🕯️</span>
          <span className="font-bold text-white text-lg">onchain<span className="text-[#a855f7]">Memorial</span></span>
          <span className="hidden sm:block text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">Arc Testnet</span>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </header>
      <main className="relative z-10 max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🕯️</div>
          <h1 className="text-4xl font-black text-white mb-3">Eternal <span className="text-[#a855f7]">Memorial</span></h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">Honor someone forever on the Arc blockchain — permanent and immutable.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[{ label: "Memorials", value: total?.toString() ?? "—", icon: "🕯️" }, { label: "Network", value: "Arc Testnet", icon: "⛓️" }].map(s => (
            <div key={s.label} className="bg-slate-900/60 border border-white/8 rounded-xl px-4 py-3 text-center">
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className="text-white font-bold text-lg">{s.value}</div>
              <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/50 border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4">Create a Memorial 🕯️</h2>
          <div className="space-y-3 mb-4">
            <input value={form.dedicatedTo} onChange={e => setForm(f => ({...f, dedicatedTo: e.target.value}))} placeholder="Dedicated to... (e.g. John Smith)" className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-[#a855f7]/60 transition-all" />
            <input value={form.relationship} onChange={e => setForm(f => ({...f, relationship: e.target.value}))} placeholder="Relationship (e.g. Father, Friend, Hero)" className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-[#a855f7]/60 transition-all" />
            <textarea value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} placeholder="Your tribute message..." rows={3} className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-[#a855f7]/60 transition-all resize-none" />
          </div>
          {!isConnected ? <p className="text-slate-500 text-sm text-center py-2">Connect wallet to create a memorial</p>
          : sent ? <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#a855f7]/15 border border-[#a855f7]/40 text-[#a855f7] font-semibold">✅ Memorial created forever</div>
          : <button onClick={() => writeContract({ address: ADDR, abi: ABI, functionName: "createMemorial", args: [form.dedicatedTo, form.message, form.relationship] })}
              disabled={isLoading || !form.dedicatedTo || !form.message}
              className="w-full py-3 rounded-xl font-bold text-sm bg-[#a855f7] text-white hover:bg-[#c084fc] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
              {isLoading ? <><svg className="spinner w-4 h-4 border-2 border-current border-t-transparent rounded-full" viewBox="0 0 24 24" />{isPending ? "Confirm in wallet…" : "Writing on-chain…"}</> : <><span>🕯️</span>Create Memorial</>}
            </button>}
          {error && <p className="mt-2 text-red-400 text-xs text-center">{error.message?.includes("User rejected") ? "Cancelled" : error.message?.slice(0, 80)}</p>}
        </div>
        <h2 className="text-lg font-bold text-white mb-4">Recent Memorials</h2>
        <div className="space-y-3">
          {list.length === 0 && <div className="text-center py-12 text-slate-500"><p className="text-4xl mb-3">🕯️</p><p>No memorials yet</p></div>}
          {list.map((m: any, i: number) => (
            <div key={i} className="bg-slate-900/70 border border-white/8 rounded-xl p-5 hover:border-[#a855f7]/30 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🕯️</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#a855f7] font-bold">{m.dedicatedTo}</span>
                    <span className="text-slate-600 text-xs">·</span>
                    <span className="text-slate-500 text-xs">{m.relationship}</span>
                    <span className="text-slate-600 text-xs ml-auto">{timeAgo(m.timestamp)}</span>
                  </div>
                  <p className="text-slate-300 text-sm italic">"{m.message}"</p>
                  <p className="text-slate-600 text-xs mt-1 font-mono">{m.creator.slice(0,6)}…{m.creator.slice(-4)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <footer className="mt-12 text-center text-xs text-slate-600">
          <p>Built on <a href="https://arc.network" className="hover:text-slate-400">Arc Network</a> · Chain ID {arcTestnet.id}</p>
        </footer>
      </main>
    </div>
  );
}
