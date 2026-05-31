import { createServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  const supabase = await createServerClient();
  const { data: notes } = await supabase.from('notes').select();

  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <h2 className="card-title">Notes</h2>
        <p className="text-sm text-slate-400 mt-1">From Supabase</p>
      </div>
      <pre className="bg-slate-900 rounded-lg p-4 text-sm text-slate-300 overflow-auto">
        {JSON.stringify(notes, null, 2)}
      </pre>
    </div>
  );
}
