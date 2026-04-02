'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Shield, User as UserIcon,
  Trash2, Crown, UserX, Loader2, RefreshCw,
} from 'lucide-react';
import { useAlert } from '@/components/ui/UnoAlertSystem';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  username: string | null;
  team_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role: string | null;
}

const roleBadge: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
  admin: {
    label: 'Admin',
    style: 'bg-[#ffaa00]/20 text-[#ffaa00] border-[#ffaa00]/30',
    icon: <Crown size={10} />,
  },
  user: {
    label: 'User',
    style: 'bg-white/5 text-white/40 border-white/10',
    icon: <UserIcon size={10} />,
  },
};

export default function AdminUsersPage() {
  const supabase = createClient();
  const { toast, confirm: spicyConfirm } = useAlert();

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setUsers(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Change role ────────────────────────────────────────────────────────────
  const toggleRole = async (user: Profile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const label = newRole === 'admin' ? 'Admin' : 'User';
    const ok = await spicyConfirm(
      `¿Cambiar el rol de "${user.username || 'este usuario'}" a ${label}?`
    );
    if (!ok) return;

    setActionLoading(user.id);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id);

    if (error) {
      toast('Error al cambiar rol: ' + error.message, 'error');
    } else {
      toast(`Rol actualizado a ${label} ✓`, 'success');
      await loadUsers();
    }
    setActionLoading(null);
  };

  // ── Delete user ────────────────────────────────────────────────────────────
  const deleteUser = async (user: Profile) => {
    const ok = await spicyConfirm(
      `¿Eliminar permanentemente a "${user.username || 'este usuario'}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    setActionLoading(user.id);
    // Only delete from profiles (auth user remains — we can't delete auth users from client)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (error) {
      toast('Error al eliminar: ' + error.message, 'error');
    } else {
      toast('Usuario eliminado del sistema.', 'warning');
      await loadUsers();
    }
    setActionLoading(null);
  };

  const filtered = users.filter(u =>
    (u.username ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.team_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-3xl bg-[#ffaa00]/10 border border-[#ffaa00]/20 flex items-center justify-center text-[#ffaa00]">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Users</h1>
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30">
              Community Oversight & Management
            </p>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full text-white/40">
            {users.length} registered
          </span>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="Search users..."
              className="h-11 bg-zinc-900 border border-white/5 rounded-2xl pl-10 pr-4 text-sm outline-none focus:border-[#ffaa00]/30 transition-all w-56"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={loadUsers}
            className="w-11 h-11 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center text-white/30 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
        
        {/* Table Header (Hidden on Mobile) */}
        <div className="hidden md:grid grid-cols-5 gap-4 px-8 py-5 border-b border-white/5 bg-black/20">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/30">User</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Team</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Role</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Joined</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Actions</div>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse p-8">
                <div className="h-10 bg-white/5 rounded-xl w-full" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center gap-3 text-white/10">
              <Users size={48} />
              <p className="text-sm font-black uppercase italic">No users found</p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map(user => {
                const role = user.role ?? 'user';
                const badge = roleBadge[role] ?? roleBadge.user;
                const isLoading = actionLoading === user.id;

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-white/[0.02] transition-colors flex flex-col md:grid md:grid-cols-5 gap-4 items-start md:items-center p-6 md:px-8 md:py-5 relative"
                  >
                    {/* User identity */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-11 h-11 rounded-2xl bg-black border border-white/5 overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:border-[#ffaa00]/20 transition-all">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-white/20">
                            {(user.username ?? 'U').slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm uppercase tracking-tight">
                          {user.username ?? <span className="text-white/20 italic">No username</span>}
                        </p>
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                          {user.id.slice(0, 8)}…
                        </p>
                      </div>
                      
                      {/* Mobile-only Role Badge */}
                      <div className="md:hidden flex-shrink-0">
                        <div className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wider',
                          badge.style
                        )}>
                          {badge.icon}
                          {badge.label}
                        </div>
                      </div>
                    </div>

                    {/* Team */}
                    <div className="w-full md:w-auto flex md:block items-center justify-between text-sm md:text-base">
                      <span className="md:hidden text-[10px] font-black uppercase tracking-widest text-white/30">Team:</span>
                      <span className="text-white/40 font-bold">
                        {user.team_name ?? <span className="italic text-white/15">—</span>}
                      </span>
                    </div>

                    {/* Desktop-only Role Badge */}
                    <div className="hidden md:block">
                      <div className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wider',
                        badge.style
                      )}>
                        {badge.icon}
                        {badge.label}
                      </div>
                    </div>

                    {/* Joined */}
                    <div className="w-full md:w-auto flex md:block items-center justify-between">
                      <span className="md:hidden text-[10px] font-black uppercase tracking-widest text-white/30">Joined:</span>
                      <span className="text-[11px] font-black text-white/30 whitespace-nowrap">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="w-full md:w-auto flex items-center justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity mt-4 md:mt-0 pt-4 border-t border-white/5 md:border-t-0 md:pt-0">
                      {isLoading ? (
                        <Loader2 size={18} className="animate-spin text-[#ffaa00]" />
                      ) : (
                        <>
                          <button
                            onClick={() => toggleRole(user)}
                            title={role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            className={cn(
                              'w-full md:w-9 h-11 md:h-9 rounded-xl flex items-center justify-center gap-2 transition-all font-black uppercase text-[10px] tracking-widest',
                              role === 'admin'
                                ? 'bg-[#ffaa00] text-black md:bg-[#ffaa00]/10 md:text-[#ffaa00] hover:bg-[#ffaa00]/20'
                                : 'bg-white/5 text-white/50 hover:bg-[#ffaa00]/10 hover:text-[#ffaa00]'
                            )}
                          >
                            <Crown size={14} className={role === 'admin' ? 'md:text-[#ffaa00]' : ''} />
                            <span className="md:hidden">{role === 'admin' ? 'Revoke Admin' : 'Make Admin'}</span>
                          </button>

                          <button
                            onClick={() => deleteUser(user)}
                            title="Delete user"
                            className="w-11 md:w-9 h-11 md:h-9 rounded-xl bg-white/5 text-white/20 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Info note */}
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/15 text-center">
        * Deleting a user removes their profile. Their auth account remains until manually removed from Supabase Auth.
      </p>
    </div>
  );
}
