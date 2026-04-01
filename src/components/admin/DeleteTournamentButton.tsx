'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { deleteTournamentAction } from '@/app/actions/tournament';
import { useRouter } from '@/i18n/routing';
import { useAlert } from '@/components/ui/UnoAlertSystem';

export default function DeleteTournamentButton({ id }: { id: string }) {
  const [deleting, setDeleting] = useState(false);
  const t = useTranslations('Tournament');
  const router = useRouter();
  const { toast } = useAlert();

  const handleDelete = async () => {
    if (!confirm(t('delete_confirm_msg'))) return;

    setDeleting(true);
    try {
      const result = await deleteTournamentAction(id);
      if (result.success) {
        toast('Tournament deleted successfully', 'success');
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
      title={t('delete')}
    >
      <Trash2 size={16} className={deleting ? 'animate-pulse' : ''} />
    </button>
  );
}
