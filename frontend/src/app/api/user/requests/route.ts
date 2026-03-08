import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Create admin client for operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// GET - Fetch user's requests
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required', requests: [] }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('data_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user requests:', error);
      return NextResponse.json({ error: error.message, requests: [] }, { status: 500 });
    }

    return NextResponse.json({ requests: data || [] });
  } catch (err: any) {
    console.error('User requests error:', err);
    return NextResponse.json({ error: 'Failed to fetch requests', requests: [] }, { status: 500 });
  }
}

// POST - Create new request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, requester_name, requester_email, institution, purpose, intended_use, data_description, export_format } = body;

    if (!user_id || !requester_name || !requester_email || !institution || !purpose || !intended_use) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('data_requests')
      .insert({
        user_id,
        requester_name,
        requester_email,
        institution,
        purpose,
        intended_use,
        data_description: data_description || null,
        export_format: export_format || 'csv',
        status: 'pending',
        download_count: 0,
        max_downloads: 5,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (err: any) {
    console.error('Create request error:', err);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
