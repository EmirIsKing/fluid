'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParticle } from '@/components/ParticleProvider';
import { Search, Star } from 'lucide-react';

export default function ContactsPage() {
  const { contacts } = useParticle();
  const [search, setSearch] = useState('');

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in-up">
      <h1 className="text-3xl font-black mb-6">Contacts</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} style={{ color: 'var(--text-muted)', position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search contacts..."
          className="input-dark pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Favorites */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Star size={14} style={{ color: 'var(--accent)' }} />
          <h2 style={{ color: 'var(--text-muted)' }} className="text-sm font-semibold uppercase tracking-wider">Favorites</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {contacts.slice(0, 3).map(c => (
            <Link key={c.id} href={`/dashboard/send?to=@${c.username}`}
              className="flex flex-col items-center gap-2 min-w-[72px]">
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent)' }}
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold hover:scale-105 transition-transform">
                {c.avatar}
              </div>
              <span className="text-xs text-center">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* All contacts */}
      <div>
        <h2 style={{ color: 'var(--text-muted)' }} className="text-sm font-semibold uppercase tracking-wider mb-4">All Contacts</h2>
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="card flex items-center gap-4" style={{ padding: '14px 20px' }}>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                {c.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{c.name}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">@{c.username} · prefers {c.preferred.asset} on {c.preferred.chain}</p>
              </div>
              <Link href={`/dashboard/send?to=@${c.username}`} className="btn-accent px-4 py-2 text-sm">
                Send
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
