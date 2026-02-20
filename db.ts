import { createClient } from '@supabase/supabase-js';
import { Review, Waiter, Tenant } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentTenantId: string | null = null;

export const DB = {
  setTenantId: (id: string | null) => {
    currentTenantId = id;
  },

  getTenants: async (): Promise<Tenant[]> => {
    try {
      const { data, error } = await supabase.from('tenants').select('*');
      if (error) {
        console.error('Erro ao buscar tenants:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error('Exceção ao buscar tenants:', e);
      return [];
    }
  },

  saveTenant: async (tenant: Tenant): Promise<Tenant[]> => {
    const { error } = await supabase.from('tenants').upsert(tenant);
    if (error) throw error;
    return DB.getTenants();
  },

  getWaiters: async (): Promise<Waiter[]> => {
    if (!currentTenantId) return [];
    try {
      const { data, error } = await supabase
        .from('waiters')
        .select('*')
        .eq('tenantId', currentTenantId);
      if (error) {
        console.error('Erro ao buscar waiters:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error('Exceção ao buscar waiters:', e);
      return [];
    }
  },

  saveWaiter: async (waiter: Waiter): Promise<Waiter[]> => {
    const { error } = await supabase.from('waiters').upsert(waiter);
    if (error) throw error;
    return DB.getWaiters();
  },

  deleteWaiter: async (id: string): Promise<Waiter[]> => {
    const { error } = await supabase.from('waiters').delete().eq('id', id);
    if (error) throw error;
    return DB.getWaiters();
  },

  getReviews: async (): Promise<Review[]> => {
    if (!currentTenantId) return [];
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('tenantId', currentTenantId)
        .order('timestamp', { ascending: false });
      if (error) {
        console.error('Erro ao buscar reviews:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error('Exceção ao buscar reviews:', e);
      return [];
    }
  },

  addReview: async (review: Review): Promise<void> => {
    const { error } = await supabase.from('reviews').insert(review);
    if (error) throw error;
  },

  updateReviewStatus: async (id: string, status: string): Promise<Review[]> => {
    const { error } = await supabase
      .from('reviews')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
    return DB.getReviews();
  }
};
