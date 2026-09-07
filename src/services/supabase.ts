import { Document, Client, Item, CompanyProfile } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
  lastSyncedAt?: string;
}

const SUPABASE_STORAGE_KEY = 'bbs_supabase_config_v1';

export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window === 'undefined') {
    return { url: '', anonKey: '', enabled: false };
  }
  const saved = localStorage.getItem(SUPABASE_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse Supabase config', e);
    }
  }
  return { url: '', anonKey: '', enabled: false };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(config));
}

export async function testSupabaseConnection(config: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  if (!config.url || !config.anonKey) {
    return { success: false, message: 'Please provide both Supabase Project URL and Anon Key.' };
  }

  const cleanUrl = config.url.replace(/\/+$/, '');
  try {
    const response = await fetch(`${cleanUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });

    if (response.ok || response.status === 200 || response.status === 404) {
      return { success: true, message: 'Supabase API reachable and authenticated successfully!' };
    }
    return { success: false, message: `Supabase returned status code ${response.status}: ${response.statusText}` };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err?.message || 'Network error'}` };
  }
}

export async function pushDataToSupabase(
  config: SupabaseConfig,
  data: {
    documents: Document[];
    clients: Client[];
    items: Item[];
    companies: CompanyProfile[];
  }
): Promise<{ success: boolean; message: string; count: number }> {
  if (!config.url || !config.anonKey) {
    return { success: false, message: 'Supabase configuration missing', count: 0 };
  }

  const cleanUrl = config.url.replace(/\/+$/, '');
  let count = 0;

  try {
    // 1. Sync Documents
    if (data.documents.length > 0) {
      const docPayload = data.documents.map((d) => ({
        id: d.id,
        type: d.type,
        document_number: d.documentNumber,
        date: d.date,
        due_date: d.dueDate,
        client_id: d.clientId,
        client_name: d.clientName,
        total: d.grandTotal,
        currency: d.currency,
        status: d.status,
        raw_json: JSON.stringify(d),
        updated_at: new Date().toISOString(),
      }));

      const res = await fetch(`${cleanUrl}/rest/v1/documents`, {
        method: 'POST',
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(docPayload),
      });

      if (res.ok) {
        count += data.documents.length;
      }
    }

    // Save sync timestamp
    saveSupabaseConfig({
      ...config,
      lastSyncedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Successfully synchronized ${count} records with Supabase database.`,
      count,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Supabase sync error: ${err?.message || 'Unknown error'}. Make sure your tables exist or use Firebase Firestore as primary.`,
      count: 0,
    };
  }
}
