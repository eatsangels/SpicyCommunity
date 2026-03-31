'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/routing';
import { createTournamentAction } from '@/app/actions/tournament';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Upload, Trophy, Trash2, Check, Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database.types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAlert } from '@/components/ui/UnoAlertSystem';

type Team = Tables<'teams'>;

interface ParticipantSlot {
  slotId: string;
  teamId: string | null;
  name: string;
  logoUrl: string | null;
  logoFile: File | null;
  previewUrl: string | null;
  isNew: boolean;
}

function newSlot(overrides?: Partial<ParticipantSlot>): ParticipantSlot {
  return {
    slotId: Math.random().toString(36).slice(2),
    teamId: null,
    name: '',
    logoUrl: null,
    logoFile: null,
    previewUrl: null,
    isNew: true,
    ...overrides,
  };
}

export default function CreateTournamentForm() {
  const t = useTranslations('Tournament');
  const { toast } = useAlert();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'single_elimination' as 'single_elimination' | 'double_elimination',
  });

  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamSearch, setTeamSearch] = useState('');
  const [slots, setSlots] = useState<ParticipantSlot[]>([]);

  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    const { data } = await supabase.from('teams').select('*').order('name');
    setAllTeams(data || []);
    setTeamsLoading(false);
  }, [supabase]);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  const selectedTeamIds = new Set(slots.map(s => s.teamId).filter(Boolean));

  const toggleExistingTeam = (team: Team) => {
    if (selectedTeamIds.has(team.id)) {
      setSlots(prev => prev.filter(s => s.teamId !== team.id));
    } else {
      setSlots(prev => [...prev, {
        slotId: Math.random().toString(36).slice(2),
        teamId: team.id,
        name: team.name,
        logoUrl: team.logo_url,
        logoFile: null,
        previewUrl: null,
        isNew: false,
      }]);
    }
  };

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamFile, setNewTeamFile] = useState<File | null>(null);
  const [newTeamPreview, setNewTeamPreview] = useState<string | null>(null);

  const handleNewTeamFileChange = (file: File | null) => {
    setNewTeamFile(file);
    setNewTeamPreview(file ? URL.createObjectURL(file) : null);
  };

  const [addingTeam, setAddingTeam] = useState(false);

  const addNewTeam = async () => {
    if (!newTeamName.trim()) return;
    setAddingTeam(true);
    try {
      let logoUrl: string | null = null;
      if (newTeamFile) {
        const ext = newTeamFile.name.split('.').pop();
        const path = `logos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('participant-logos')
          .upload(path, newTeamFile, { contentType: newTeamFile.type, upsert: true });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('participant-logos').getPublicUrl(path);
        logoUrl = publicUrl;
      }

      const { data: savedTeam, error: dbErr } = await supabase
        .from('teams')
        .insert({ name: newTeamName.trim(), logo_url: logoUrl })
        .select().single();
      if (dbErr) throw dbErr;

      setSlots(prev => [...prev, {
        slotId: Math.random().toString(36).slice(2),
        teamId: savedTeam.id,
        name: savedTeam.name,
        logoUrl: savedTeam.logo_url,
        logoFile: null,
        previewUrl: newTeamPreview,
        isNew: false,
      }]);
      await loadTeams();
      setNewTeamName(''); setNewTeamFile(null); setNewTeamPreview(null);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setAddingTeam(false);
    }
  };

  const removeSlot = (slotId: string) => {
    if (slots.length <= 2) return;
    setSlots(prev => prev.filter(s => s.slotId !== slotId));
  };

  const handleSlotLogoChange = (slotId: string, file: File | null) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setSlots(prev => prev.map(s => s.slotId === slotId ? { ...s, logoFile: file, previewUrl } : s));
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `logos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('participant-logos').upload(path, file);
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('participant-logos').getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slots.length < 2) { toast(t('alerts.add_teams_min') || 'Add at least 2 teams.', 'warning'); return; }
    setLoading(true);
    try {
      const participantsPayload: any[] = [];
      for (const slot of slots) {
        let logoUrl = slot.logoUrl;
        if (slot.logoFile) logoUrl = await uploadLogo(slot.logoFile);
        let teamId = slot.teamId;
        if (slot.isNew) {
          const { data: savedTeam } = await supabase.from('teams').insert({ name: slot.name, logo_url: logoUrl }).select().single();
          teamId = savedTeam?.id ?? null;
        }
        participantsPayload.push({ name: slot.name, logo_url: logoUrl, team_id: teamId });
      }
      const result = await createTournamentAction({ ...formData, participants: JSON.stringify(participantsPayload) });
      if (result.success) router.push(`/tournaments/${result.tournamentId}`);
      else throw new Error(result.error);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = allTeams.filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start py-20 px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#ffaa00]/5 blur-[150px] rounded-full -z-10" />
      <div className="w-full max-w-4xl space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="w-16 h-16 bg-[#ffaa00]/20 rounded-3xl flex items-center justify-center text-[#ffaa00] mx-auto border border-[#ffaa00]/20">
            <Trophy size={32} />
          </motion.div>
          <h1 className="text-6xl font-black uppercase italic tracking-tighter gradient-text">Create Arena</h1>
          <p className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30">Set the stage for Glory</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#ffaa00] px-4">Tournament Name</label>
              <input required placeholder="Grand Final 2026" className="w-full h-16 bg-black/40 border-2 border-white/5 rounded-2xl px-6 text-xl font-bold uppercase outline-none focus:border-[#ffaa00]/40 transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-4">Tournament Type</label>
              <select className="w-full h-16 bg-black/40 border-2 border-white/5 rounded-2xl px-6 font-bold uppercase text-xs outline-none focus:border-[#ffaa00]/40 transition-all appearance-none text-[#ffaa00]" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                <option value="single_elimination">Single Elimination</option>
                <option value="double_elimination">Double Elimination</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black uppercase italic tracking-tight">Registered Teams</h2>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-full">{allTeams.length}</span>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="text" placeholder="Search team..." className="w-full h-10 bg-zinc-900 border border-white/5 rounded-xl pl-10 pr-4 text-sm outline-none focus:border-[#ffaa00]/30 transition-all" value={teamSearch} onChange={e => setTeamSearch(e.target.value)} />
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-y-auto max-h-72 divide-y divide-white/5">
                {teamsLoading ? <div className="p-8 text-center text-[10px] uppercase tracking-widest text-white/20 animate-pulse">Loading...</div> : filteredTeams.length === 0 ? <div className="p-8 text-center text-[10px] uppercase tracking-widest text-white/20">No teams yet</div> : filteredTeams.map(team => {
                  const isSelected = selectedTeamIds.has(team.id);
                  return (
                    <button key={team.id} type="button" onClick={() => toggleExistingTeam(team)} className={cn('w-full flex items-center gap-4 px-5 py-3 transition-all text-left group', isSelected ? 'bg-[#ffaa00]/10' : 'hover:bg-white/5')}>
                      <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {team.logo_url ? <Image src={team.logo_url} alt={team.name} width={40} height={40} className="object-cover w-full h-full" /> : <span className="text-[10px] font-black text-white/20">{team.name.slice(0, 2).toUpperCase()}</span>}
                      </div>
                      <span className="flex-1 font-black text-sm uppercase">{team.name}</span>
                      <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', isSelected ? 'border-[#ffaa00] bg-[#ffaa00]' : 'border-white/20')}>{isSelected && <Check size={10} className="text-black" strokeWidth={3} />}</div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-zinc-900 border border-white/5 rounded-3xl p-5 space-y-4">
                <p className="text-[9px] uppercase font-black tracking-widest text-[#ffaa00]">+ New Team</p>
                <div className="flex items-center gap-4">
                  <label className="relative w-14 h-14 rounded-xl bg-black border border-white/10 flex items-center justify-center cursor-pointer overflow-hidden hover:border-[#ffaa00]/40 transition-all flex-shrink-0 group/logo">
                    {newTeamPreview ? <img src={newTeamPreview} alt="" className="w-full h-full object-cover" /> : <Upload size={16} className="text-white/20 group-hover/logo:text-[#ffaa00] transition-colors" />}
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleNewTeamFileChange(e.target.files?.[0] || null)} />
                  </label>
                  <input type="text" placeholder="Team name..." className="flex-1 h-10 bg-black/40 border border-white/5 rounded-xl px-4 text-sm font-bold uppercase outline-none focus:border-[#ffaa00]/40 transition-all" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewTeam(); } }} />
                  <button type="button" onClick={addNewTeam} disabled={!newTeamName.trim() || addingTeam} className="w-10 h-10 rounded-xl bg-[#ffaa00] text-black flex items-center justify-center hover:bg-[#ffaa00]/80 transition-all disabled:opacity-30 flex-shrink-0">{addingTeam ? <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" /> : <Plus size={18} strokeWidth={3} />}</button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black uppercase italic tracking-tight">In Bracket</h2>
                <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full", slots.length < 2 ? "bg-red-500/20 text-red-400" : "bg-[#ffaa00]/10 text-[#ffaa00]")}>{slots.length} teams</span>
              </div>
              {slots.length === 0 ? <div className="bg-zinc-900 border border-white/5 rounded-3xl p-12 text-center text-[10px] uppercase tracking-widest text-white/20">Select teams from the left →</div> : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {slots.map((slot, idx) => (
                      <motion.div key={slot.slotId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="group bg-zinc-900 border border-white/5 rounded-2xl flex items-center gap-4 px-4 py-3">
                        <span className="text-[9px] font-black text-white/20 w-5 text-center">{idx + 1}</span>
                        <label className="relative w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center cursor-pointer overflow-hidden hover:border-[#ffaa00]/40 transition-all flex-shrink-0">
                          {slot.previewUrl || slot.logoUrl ? <img src={slot.previewUrl || slot.logoUrl!} alt="" className="w-full h-full object-cover" /> : <span className="text-[8px] font-black text-white/20">{slot.name.slice(0, 2).toUpperCase() || '?'}</span>}
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleSlotLogoChange(slot.slotId, e.target.files?.[0] || null)} />
                        </label>
                        <span className="flex-1 font-black text-sm uppercase truncate">{slot.name}</span>
                        {slot.isNew && <span className="text-[7px] font-black uppercase text-[#ffaa00]/60 bg-[#ffaa00]/10 px-2 py-0.5 rounded-full">NEW</span>}
                        <button type="button" onClick={() => removeSlot(slot.slotId)} className="p-1 text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><X size={14} /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={loading || slots.length < 2} className="w-full h-20 bg-[#ffaa00] hover:bg-[#ffaa00]/90 text-black text-2xl font-black uppercase italic tracking-tighter rounded-[3rem] shadow-[0_30px_60px_rgba(255,170,0,0.2)] transition-all active:scale-95 disabled:opacity-40">{loading ? 'Igniting...' : `Launch Tournament (${slots.length} teams)`}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
