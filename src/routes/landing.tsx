'use client';

import React from 'react';
import NextLink from 'next/link';
import {
  ArrowRight,
  Zap,
  Coins,
  Shield,
  ArrowUpRight,
  Sparkles,
  Globe,
  Wallet,
  Ban,
} from 'lucide-react';
import { useParticle } from '@/components/ParticleProvider';
import { SUPPORTED_CHAINS } from '@shared/chains';

const networks = SUPPORTED_CHAINS.map(c => ({ name: c.label, color: c.dotColor }));

const features = [
  {
    icon: Coins,
    title: 'Pay with any asset',
    desc: 'Spend ETH, USDC, USDT, or whatever you hold in your unified balance. No need to convert before you send.',
  },
  {
    icon: Globe,
    title: 'Deliver on any chain',
    desc: "Pick the recipient's network — Base, Ethereum, Arbitrum, BNB Chain, or X Layer. They receive on the chain they use.",
  },
  {
    icon: Ban,
    title: 'No swaps. No bridges.',
    desc: 'You never open a DEX or bridge UI. Fluid routes the payment cross-chain in one signature, invisibly.',
  },
  {
    icon: Shield,
    title: 'Gasless execution',
    desc: 'One tap to send. No gas tokens to hold, no network switching, no extra approvals.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Connect your wallet',
    desc: 'Link your existing EOA. Fluid upgrades it to a Universal Account — same address, cross-chain superpowers.',
  },
  {
    step: '02',
    title: 'Pick recipient & chain',
    desc: 'Enter an address or @username and choose where they should receive funds. Any asset, any network.',
  },
  {
    step: '03',
    title: 'Send what you have',
    desc: 'Pay from your balance as-is. Fluid settles cross-chain behind the scenes — no swapping or bridging on your end.',
  },
];

const stats = [
  { label: 'Assets you can spend', value: 'Any' },
  { label: 'Destination chains', value: '5' },
  { label: 'Bridges to use', value: '0' },
];

export default function Landing() {
  const { isConnected, connect } = useParticle();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap gap-2.5">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent)]/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles size={12} />
                  Cross-chain payments
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--card)] border border-[var(--border)] rounded-full text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
                  No swaps · No bridges
                </span>
              </div>

              <div className="space-y-4">
                <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-mono font-semibold">
                  Send from any asset. Land on any chain.
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[var(--foreground)] tracking-tight leading-[1.08]">
                  Pay anyone on{' '}
                  <span className="italic text-[var(--muted)]">any chain.</span>
                </h1>
                <p className="text-lg text-[var(--muted-foreground)] leading-relaxed max-w-lg">
                  Pay a friend on Base with USDC from your Arbitrum balance. Send ETH to someone on Ethereum
                  while holding only stablecoins — one balance, one signature, no swap or bridge UI.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <NextLink
                  href="/send"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-sm font-semibold shadow-soft hover:opacity-90 transition-all shadow-glow-hover group"
                >
                  Send Payment
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </NextLink>
                {!isConnected && (
                  <button
                    onClick={() => connect('metamask')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-[var(--radius)] text-sm font-semibold hover:border-[var(--border-hover)] transition-all"
                  >
                    <Wallet size={16} />
                    Connect Wallet
                  </button>
                )}
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[var(--muted-foreground)] rounded-[var(--radius)] text-sm font-semibold hover:text-[var(--foreground)] transition-colors"
                >
                  See how it works
                </a>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
                {stats.map(stat => (
                  <div key={stat.label} className="space-y-1">
                    <div className="font-serif text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                      {stat.value}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo card — send flow */}
            <div className="relative">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft relative overflow-hidden">
                <div className="absolute inset-0 grid-paper pointer-events-none z-0" />
                <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[var(--accent)] opacity-[0.04] blur-3xl pointer-events-none z-0" />

                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted)]">
                      Cross-chain send
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse-dot" />
                      One signature
                    </span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] p-4 text-left">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1">You send</div>
                      <div className="font-serif text-xl font-bold text-[var(--foreground)]">0.025 ETH</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Auto-selected · Arbitrum</div>
                    </div>
                    <div className="text-[var(--accent)] text-xl font-bold">→</div>
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] p-4 text-right">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1">Bob gets</div>
                      <div className="font-serif text-xl font-bold text-[var(--foreground)]">50 USDC</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">On his chain · Base</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {networks.slice(0, 4).map(net => (
                      <span
                        key={net.name}
                        className="px-2.5 py-1 rounded-full text-[10px] font-medium border border-[var(--border)] bg-[var(--background)] flex items-center gap-1.5 text-[var(--muted-foreground)]"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${net.color}`} />
                        {net.name}
                      </span>
                    ))}
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-medium border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]">
                      {networks.length} chains
                    </span>
                  </div>

                  <div className="bg-[var(--background)]/60 border border-[var(--border)]/50 rounded-lg p-3 text-center space-y-1">
                    <p className="text-xs font-semibold text-[var(--accent)]">
                      ✦ Fluid routes cross-chain — you never swap or bridge
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      No DEX · No bridge UI · No network switching · 1 signature
                    </p>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-[var(--background)]/60 rounded-lg border border-[var(--border)]/50">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <ArrowUpRight size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">Sent to @bob · 50 USDC on Base</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">Paid with USDC on Arbitrum · Settled in 4s</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full shrink-0">
                      Settled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-mono font-semibold">
              Why Fluid
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[var(--foreground)] tracking-tight">
              Cross-chain payments.{' '}
              <span className="italic text-[var(--muted)]">Zero friction.</span>
            </h2>
            <p className="text-[var(--muted-foreground)]">
              The whole point: send to any chain from whatever asset you already have — without touching a swap or bridge.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {features.map(feature => (
              <div
                key={feature.title}
                className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft hover:border-[var(--border-hover)] transition-all group"
              >
                <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--accent-dim)] border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] mb-4 group-hover:shadow-glow transition-shadow">
                  <feature.icon size={18} />
                </div>
                <h3 className="text-lg font-semibold tracking-tight mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div className="space-y-4 lg:sticky lg:top-24">
              <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-mono font-semibold">
                How it works
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[var(--foreground)] tracking-tight">
                Three steps.{' '}
                <span className="italic text-[var(--muted)]">No bridges.</span>
              </h2>
              <p className="text-[var(--muted-foreground)] leading-relaxed">
                You pick who to pay and which chain they receive on. Fluid handles cross-chain settlement
                underneath — you stay in one app, one balance, one signature.
              </p>
              <NextLink
                href="/send"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:opacity-80 transition-opacity mt-2"
              >
                Try sending now
                <ArrowRight size={14} />
              </NextLink>
            </div>

            <div className="space-y-4">
              {steps.map((item, i) => (
                <div
                  key={item.step}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft flex gap-5"
                >
                  <div className="shrink-0">
                    <span className="font-mono text-xs font-bold text-[var(--accent)] bg-[var(--accent-dim)] px-2.5 py-1 rounded-md">
                      {item.step}
                    </span>
                    {i < steps.length - 1 && (
                      <div className="w-px h-8 bg-[var(--border)] mx-auto mt-3 hidden sm:block" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-1.5">{item.title}</h3>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Networks */}
      <section id="networks" className="border-t border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-24 text-center">
          <div className="space-y-3 mb-10">
            <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-mono font-semibold">
              Destination networks
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[var(--foreground)] tracking-tight">
              They receive on their chain.{' '}
              <span className="italic text-[var(--muted)]">You pay with yours.</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
            {networks.map(net => (
              <span
                key={net.name}
                className="px-4 py-2 rounded-full text-sm font-medium border border-[var(--border)] bg-[var(--card)] flex items-center gap-2 shadow-soft hover:border-[var(--border-hover)] transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${net.color}`} />
                {net.name}
              </span>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-full text-xs text-[var(--muted-foreground)]">
            <Zap size={14} className="text-[var(--accent)]" />
            Powered by Particle Universal Accounts — routing happens invisibly
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-24">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-10 lg:p-14 text-center relative overflow-hidden shadow-soft">
            <div className="absolute inset-0 grid-paper pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[var(--accent)] opacity-[0.03] blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6 max-w-xl mx-auto">
              <div className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted)]">
                  No swaps · No bridges · Just send
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif text-[var(--foreground)] tracking-tight">
                Pay from any asset.{' '}
                <span className="italic text-[var(--muted)]">Deliver anywhere.</span>
              </h2>
              <p className="text-[var(--muted-foreground)]">
                Connect your wallet and send cross-chain in one tap — without ever opening a swap or bridge.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <NextLink
                  href="/send"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-sm font-semibold shadow-soft hover:opacity-90 transition-all shadow-glow-hover w-full sm:w-auto"
                >
                  Send Payment
                  <ArrowRight size={16} />
                </NextLink>
                {!isConnected && (
                  <button
                    onClick={() => connect('metamask')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] text-sm font-semibold hover:border-[var(--border-hover)] transition-all w-full sm:w-auto"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
