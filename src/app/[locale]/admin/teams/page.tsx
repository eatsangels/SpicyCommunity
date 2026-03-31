'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database.types';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Upload, Pencil, Trash2, Plus, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlert } from '@/components/ui/UnoAlertSystem';

type Team = Tables<'teams'>;

interface EditingState {
  id: string;
  name: string;
  logoFile: File | null;
  previewUrl: string | null;
}

export default function AdminTeamsPage() {
  const supabase = createClient();
  const { toast, confirm } = useAlert();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // New team form
  const [newName, setNewName] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('teams').select('*').order('name');
    setTeams(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  // ── Upload logo ──────────────────────────────────────────────────────────────
  const uploadLogo = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `logos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('participant-logos')
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) { console.error('Upload error:', error); throw new Error(error.message); }
    const { data: { publicUrl } } = supabase.storage.from('participant-logos').getPublicUrl(path);
    return publicUrl;
  };

  // ── Add new team ─────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      let logoUrl: string | null = null;
      if (newFile) logoUrl = await uploadLogo(newFile);

      const { error } = await supabase
        .from('teams')
        .insert({ name: newName.trim(), logo_url: logoUrl });
      if (error) throw error;

      setNewName('');
      setNewFile(null);
      setNewPreview(null);
      await loadTeams();
      toast('Team added to registry!', 'success');
    } catch (err: any) {
      toast('Error: ' + err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  // ── Save edit ────────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      let logoUrl: string | undefined = undefined;
      if (editing.logoFile) {
        logoUrl = (await uploadLogo(editing.logoFile)) ?? undefined;
      }

      const update: Partial<Team> = { name: editing.name };
      if (logoUrl !== undefined) update.logo_url = logoUrl;

      const { error } = await supabase
        .from('teams')
        .update(update)
        .eq('id', editing.id);
      if (error) throw error;

      setEditing(null);
      await loadTeams();
      toast('Team updated successfully!', 'success');
    } catch (err: any) {
      toast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete team ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const ok = await confirm('¿Eliminar este equipo del registro global? Esta acción no se puede deshacer.');
    if (!ok) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
      await loadTeams();
      toast('Team deleted from registry.', 'warning');
    } catch (err: any) {
      toast('Error: ' + err.message, 'error');
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (team: Team) => {
    setEditing({ id: team.id, name: team.name, logoFile: null, previewUrl: null });
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-3xl bg-[#ffaa00]/10 border border-[#ffaa00]/20 flex items-center justify-center text-[#ffaa00]">
          <Shield size={28} />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Team Registry</h1>
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30">
            Manage global team profiles & logos
          </p>
        </div>
        <span className="ml-auto text-[9px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full text-white/40">
          {teams.length} teams
        </span>
      </div>

      {/* Add New Team */}
      <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 space-y-4">
        <p className="text-[10px] uppercase font-black tracking-widest text-[#ffaa00]">+ Add New Team</p>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Logo upload */}
          <label className="relative w-16 h-16 rounded-2xl bg-black border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-[#ffaa00]/50 transition-all group/logo flex-shrink-0">
            {newPreview ? (
              <img src={newPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <>
                <Upload size={20} className="text-white/20 group-hover/logo:text-[#ffaa00] transition-colors" />
                <span className="text-[7px] font-black uppercase text-white/20 mt-1">Logo</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0] || null;
                setNewFile(f);
                setNewPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
          </label>

          <input
            type="text"
            placeholder="Team name..."
            className="flex-1 min-w-[200px] h-12 bg-black/40 border border-white/5 rounded-2xl px-5 font-bold uppercase text-sm outline-none focus:border-[#ffaa00]/40 transition-all"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          />

          <button
            onClick={handleAdd}
            disabled={!newName.trim() || adding}
            className="h-12 px-6 rounded-2xl bg-[#ffaa00] text-black font-black uppercase text-xs tracking-widest hover:bg-[#ffaa00]/80 transition-all disabled:opacity-30 flex items-center gap-2 flex-shrink-0"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {adding ? 'Saving...' : 'Add Team'}
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#ffaa00]" />
        </div>
      ) : teams.length === 0 ? (
        <div className="py-20 text-center text-[10px] uppercase font-black tracking-widest text-white/20">
          No teams registered yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {teams.map(team => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col gap-4 group hover:border-white/10 transition-all"
              >
                {editing?.id === team.id ? (
                  /* ── EDIT MODE ── */
                  <div className="space-y-4">
                    {/* Logo upload in edit mode */}
                    <label className="relative w-full h-36 rounded-2xl bg-black border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-[#ffaa00]/50 transition-all group/logo">
                      {editing.previewUrl || team.logo_url ? (
                        <img
                          src={editing.previewUrl || team.logo_url!}
                          alt={team.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <Upload size={28} className="text-white/20 group-hover/logo:text-[#ffaa00] transition-colors" />
                          <span className="text-[8px] font-black uppercase text-white/20 mt-2">Click to upload logo</span>
                        </>
                      )}
                      {/* Change logo overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/logo:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Upload size={24} className="text-[#ffaa00]" />
                        <span className="text-[8px] font-black uppercase text-[#ffaa00]">Change Logo</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0] || null;
                          setEditing(prev => prev ? { ...prev, logoFile: f, previewUrl: f ? URL.createObjectURL(f) : null } : null);
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 font-bold uppercase text-sm outline-none focus:border-[#ffaa00]/40 transition-all"
                      value={editing.name}
                      onChange={e => setEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
                      autoFocus
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="flex-1 h-10 rounded-xl bg-[#ffaa00] text-black font-black uppercase text-[9px] tracking-widest hover:bg-[#ffaa00]/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── VIEW MODE ── */
                  <>
                    {/* Logo */}
                    <div className="relative w-full h-36 rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center">
                      {team.logo_url ? (
                        <Image
                          src={team.logo_url}
                          alt={team.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-black text-white/10 uppercase">
                          {team.name.slice(0, 2)}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <p className="font-black text-sm uppercase tracking-tight truncate">{team.name}</p>

                    {/* Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(team)}
                        className="flex-1 h-9 rounded-xl bg-white/5 hover:bg-[#ffaa00]/20 hover:text-[#ffaa00] text-white/40 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(team.id)}
                        disabled={deleting === team.id}
                        className={cn(
                          "w-9 h-9 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/20 transition-all flex items-center justify-center",
                          deleting === team.id && "opacity-50"
                        )}
                      >
                        {deleting === team.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Trash2 size={12} />}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
