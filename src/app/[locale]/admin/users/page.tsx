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
    label: 'Player',
    style: 'bg-white/5 text-white/40 border-white/10',
    icon: <UserIcon size={10} />,
  },
};

export default function AdminUsersPage() {
  const supabase = createClient();
  const { toast, confirm } = useAlert();

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
    const label = newRole === 'admin' ? 'Admin' : 'Player';
    const ok = await confirm(
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
    const ok = await confirm(
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

      {/* Table */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-black/20">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">User</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Team</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Role</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Joined</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6">
                      <div className="h-10 bg-white/5 rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3 text-white/10">
                      <Users size={48} />
                      <p className="text-sm font-black uppercase italic">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filtered.map(user => {
                    const role = user.role ?? 'user';
                    const badge = roleBadge[role] ?? roleBadge.user;
                    const isLoading = actionLoading === user.id;

                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        {/* User identity */}
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-black border border-white/5 overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:border-[#ffaa00]/20 transition-all">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-black text-white/20">
                                  {(user.username ?? 'U').slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-black text-sm uppercase tracking-tight">
                                {user.username ?? <span className="text-white/20 italic">No username</span>}
                              </p>
                              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                                {user.id.slice(0, 8)}…
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Team */}
                        <td className="px-8 py-5">
                          <span className="text-sm text-white/40 font-bold">
                            {user.team_name ?? <span className="italic text-white/15">—</span>}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="px-8 py-5">
                          <div className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wider',
                            badge.style
                          )}>
                            {badge.icon}
                            {badge.label}
                          </div>
                        </td>

                        {/* Joined */}
                        <td className="px-8 py-5">
                          <span className="text-[11px] font-black text-white/30 whitespace-nowrap">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isLoading ? (
                              <Loader2 size={18} className="animate-spin text-white/30" />
                            ) : (
                              <>
                                {/* Toggle role */}
                                <button
                                  onClick={() => toggleRole(user)}
                                  title={role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                  className={cn(
                                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                                    role === 'admin'
                                      ? 'bg-[#ffaa00]/10 text-[#ffaa00] hover:bg-[#ffaa00]/20'
                                      : 'bg-white/5 text-white/30 hover:bg-[#ffaa00]/10 hover:text-[#ffaa00]'
                                  )}
                                >
                                  <Crown size={14} />
                                </button>

                                {/* Delete user */}
                                <button
                                  onClick={() => deleteUser(user)}
                                  title="Delete user"
                                  className="w-9 h-9 rounded-xl bg-white/5 text-white/20 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info note */}
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/15 text-center">
        * Deleting a user removes their profile. Their auth account remains until manually removed from Supabase Auth.
      </p>
    </div>
  );
}
