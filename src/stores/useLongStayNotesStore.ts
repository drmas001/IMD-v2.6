import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useUserStore } from './useUserStore';
import type { LongStayNote } from '../types/longStayNote';

interface LongStayNotesStore {
  notes: Record<number, LongStayNote[]>;
  loading: boolean;
  error: string | null;
  fetchNotes: (patientId: number) => Promise<void>;
  addNote: (patientId: number, content: string) => Promise<void>;
}

export const useLongStayNotesStore = create<LongStayNotesStore>((set, get) => ({
  notes: {},
  loading: false,
  error: null,

  fetchNotes: async (patientId: number) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('long_stay_notes')
        .select(`
          id,
          patient_id,
          content,
          created_at,
          updated_at,
          users!long_stay_notes_created_by_fkey (name)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotes = data.map(note => ({
        ...note,
        created_by: {
          name: note.users.name
        }
      }));

      set(state => ({
        notes: {
          ...state.notes,
          [patientId]: formattedNotes
        },
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addNote: async (patientId: number, content: string) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useUserStore.getState().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('long_stay_notes')
        .insert([{
          patient_id: patientId,
          content,
          created_by: currentUser.id
        }])
        .select(`
          id,
          patient_id,
          content,
          created_at,
          updated_at,
          users!long_stay_notes_created_by_fkey (name)
        `)
        .single();

      if (error) throw error;

      const formattedNote = {
        ...data,
        created_by: {
          name: data.users.name
        }
      };

      set(state => ({
        notes: {
          ...state.notes,
          [patientId]: [formattedNote, ...(state.notes[patientId] || [])]
        },
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  }
}));