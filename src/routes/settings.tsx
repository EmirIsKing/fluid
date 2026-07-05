'use client';

import React, { useState, useEffect } from 'react';
import { User, Settings as SettingsIcon, Bell, Paintbrush, Key, Eye, EyeOff, Copy, Check, CheckCircle2, Trash2 } from 'lucide-react';
import { useParticle } from '@/components/ParticleProvider';

export const head = () => ({
  title: 'Fluid — Settings',
  meta: [
    { name: 'description', content: 'Configure profile options, notifications, and workspaces.' },
    { property: 'og:title', content: 'Fluid — Console Settings' },
    { property: 'og:description', content: 'Manage dark mode, API keys, and workspace routing rules.' },
  ],
});

type ApiKey = { id: string; name: string; key: string; created: string; show: boolean };

/** Generate a plausible API key. */
function genKey(prefix: 'live' | 'test') {
  const rand = () => Math.random().toString(36).substring(2, 10).toUpperCase();
  return `fl_${prefix}_${rand()}${rand()}`;
}

export default function Settings() {
  const { isConnected, address, mode, setMode, disconnect, particleConfigured } = useParticle();

  /* ── Profile ── */
  const [email, setEmail] = useState('');

  /* ── Workspace ── */
  const [autoRoute,     setAutoRoute]     = useState(true);
  const [gaslessInbound, setGaslessInbound] = useState(true);

  /* ── Notifications ── */
  const [notifyInbound,  setNotifyInbound]  = useState(true);
  const [notifyOutbound, setNotifyOutbound] = useState(false);

  /* ── Appearance ── */
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  /* ── API Keys ── */
  const [apiKeys, setApiKeys]       = useState<ApiKey[]>([]);
  const [copiedId, setCopiedId]     = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  /* Init theme from DOM */
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setThemeMode(isDark ? 'dark' : 'light');
    // Restore email from localStorage if present
    const storedEmail = localStorage.getItem('fluid_email') ?? '';
    setEmail(storedEmail);
    // Restore API keys
    const storedKeys = localStorage.getItem('fluid_api_keys');
    if (storedKeys) {
      try { setApiKeys(JSON.parse(storedKeys)); } catch { /* ignore */ }
    }
  }, []);

  const handleThemeChange = (m: 'light' | 'dark') => {
    setThemeMode(m);
    if (m === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fluid_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fluid_theme', 'light');
    }
  };

  const toggleKeyVisibility = (id: string) =>
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, show: !k.show } : k));

  const handleCopyKey = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const persistApiKeys = (keys: ApiKey[]) => {
    setApiKeys(keys);
    localStorage.setItem('fluid_api_keys', JSON.stringify(keys));
  };

  const addApiKey = () => {
    const newKey: ApiKey = {
      id:      `key-${Date.now()}`,
      name:    'New Integration Key',
      key:     genKey('live'),
      created: new Date().toISOString().split('T')[0],
      show:    false,
    };
    persistApiKeys([...apiKeys, newKey]);
  };

  const removeApiKey = (id: string) => persistApiKeys(apiKeys.filter(k => k.id !== id));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('fluid_email', email);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-mono font-semibold">Control Panel</span>
        <h1 className="text-3xl sm:text-4xl font-serif text-[var(--foreground)] mt-1 tracking-tight">
          System Preferences. <span className="text-[var(--muted)] italic">Keys, profile, and theme.</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sidebar nav shortcuts */}
        <div className="lg:col-span-3 space-y-2">
          <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-soft space-y-1 sticky top-20">
            {[
              { href: '#profile',       icon: User,          label: 'Profile'       },
              { href: '#workspace',     icon: SettingsIcon,  label: 'Workspace'     },
              { href: '#notifications', icon: Bell,          label: 'Notifications' },
              { href: '#appearance',    icon: Paintbrush,    label: 'Appearance'    },
              { href: '#api',           icon: Key,           label: 'API Keys'      },
            ].map(({ href, icon: Icon, label }) => (
              <a key={href} href={href}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] rounded-md transition-all">
                <Icon size={14} />
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Settings body */}
        <div className="lg:col-span-9 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">

            {/* 1. Profile */}
            <div id="profile" className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-[var(--muted)] font-bold flex items-center gap-2">
                <User size={16} />
                Profile
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs text-[var(--muted-foreground)] font-semibold">Connected Wallet Address</label>
                {isConnected && address ? (
                  <div className="font-mono text-xs p-3 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] break-all select-all">
                    {address}
                  </div>
                ) : (
                  <div className="text-xs text-[var(--muted-foreground)] italic p-3 bg-[var(--background)] border border-[var(--border)] rounded-md">
                    No wallet connected
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[var(--muted-foreground)] font-semibold">Wallet Mode</label>
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                  {(['demo', 'live'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      disabled={m === 'live' && !particleConfigured}
                      onClick={() => setMode(m)}
                      className={`p-4 rounded-md border text-left transition-all disabled:opacity-40 ${
                        mode === m
                          ? 'border-[var(--primary)] bg-[var(--background)] shadow-soft text-[var(--foreground)]'
                          : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      <div className="font-serif text-lg font-bold mb-1 capitalize">{m}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">
                        {m === 'demo'
                          ? 'Try the send flow with sample Primary Assets'
                          : particleConfigured
                            ? 'Real MetaMask + Particle Universal Account'
                            : 'Add Particle credentials to .env.local'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[var(--muted-foreground)] font-semibold">Notification Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] text-sm transition-colors placeholder-[var(--muted)]"
                />
              </div>

              {isConnected && (
                <button type="button" onClick={disconnect}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold border border-rose-500/20 hover:border-rose-500/40 px-3 py-1.5 rounded-md transition-colors">
                  Disconnect Wallet
                </button>
              )}
            </div>

            {/* 2. Workspace */}
            <div id="workspace" className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-[var(--muted)] font-bold flex items-center gap-2">
                <SettingsIcon size={16} />
                Workspace Config
              </h2>

              <div className="space-y-4 text-xs">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={autoRoute} onChange={e => setAutoRoute(e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] w-4 h-4 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[var(--foreground)]">Enable Auto-routing</span>
                    <p className="text-[10px] text-[var(--muted-foreground)]">Automatically sweep inbound balances across networks to your designated hub.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={gaslessInbound} onChange={e => setGaslessInbound(e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] w-4 h-4 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[var(--foreground)]">Gasless Inbound Processing</span>
                    <p className="text-[10px] text-[var(--muted-foreground)]">Process inbound rolls without upfront gas funding — fees absorbed by the protocol sweep.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 3. Notifications */}
            <div id="notifications" className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-[var(--muted)] font-bold flex items-center gap-2">
                <Bell size={16} />
                Notifications
              </h2>
              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifyInbound} onChange={e => setNotifyInbound(e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] w-4 h-4" />
                  <span className="font-semibold text-[var(--foreground)]">Email on inbound sweep settlement</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifyOutbound} onChange={e => setNotifyOutbound(e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] w-4 h-4" />
                  <span className="font-semibold text-[var(--foreground)]">Notify on outbound routing confirmation</span>
                </label>
              </div>
            </div>

            {/* 4. Appearance */}
            <div id="appearance" className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-[var(--muted)] font-bold flex items-center gap-2">
                <Paintbrush size={16} />
                Appearance
              </h2>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                {(['light', 'dark'] as const).map(m => (
                  <button key={m} type="button" onClick={() => handleThemeChange(m)}
                    className={`p-4 rounded-md border text-center transition-all ${
                      themeMode === m
                        ? 'border-[var(--primary)] bg-[var(--background)] shadow-soft text-[var(--foreground)]'
                        : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}>
                    <div className="font-serif text-lg font-bold mb-1">{m === 'light' ? 'Light Paper' : 'Dark Navy'}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">{m === 'light' ? 'Warm off-white surface' : 'Low-light velvet mode'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center justify-between">
              {savedToast && (
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5 animate-pulse">
                  <CheckCircle2 size={14} />
                  Saved successfully.
                </span>
              )}
              <button type="submit"
                className="ml-auto px-5 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-xs font-semibold hover:opacity-90 shadow-soft transition-all active:scale-[0.98]">
                Save Preferences
              </button>
            </div>
          </form>

          {/* 5. API Keys */}
          <div id="api" className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft space-y-4">
            <h2 className="text-sm uppercase tracking-widest text-[var(--muted)] font-bold flex items-center gap-2">
              <Key size={16} />
              Developer API Keys
            </h2>

            {apiKeys.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)] italic">No API keys generated yet.</p>
            ) : (
              <div className="divide-y divide-[var(--border)] text-xs">
                {apiKeys.map(k => (
                  <div key={k.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="space-y-1 min-w-0">
                      <div className="font-semibold text-[var(--foreground)]">{k.name}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">Created {k.created}</div>
                      <div className="font-mono text-xs p-2 bg-[var(--background)] border border-[var(--border)] rounded flex items-center gap-2 mt-2 max-w-sm overflow-x-auto">
                        <span className="shrink-0 select-all">{k.show ? k.key : '•'.repeat(40)}</span>
                        <button onClick={() => toggleKeyVisibility(k.id)}
                          className="p-1 hover:bg-[var(--border)] rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors ml-auto shrink-0">
                          {k.show ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button onClick={() => handleCopyKey(k.id, k.key)}
                          className={`p-1 rounded transition-colors shrink-0 ${
                            copiedId === k.id ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'hover:bg-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                          }`}>
                          {copiedId === k.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <button onClick={() => removeApiKey(k.id)}
                      className="p-2 border border-rose-500/10 text-rose-500 hover:bg-rose-500/5 hover:border-rose-500/20 rounded transition-colors self-start sm:self-center" title="Revoke">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={addApiKey}
              className="w-full py-2 bg-[var(--background)] border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] rounded-md font-semibold text-xs tracking-wider transition-colors">
              + GENERATE NEW KEY
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
