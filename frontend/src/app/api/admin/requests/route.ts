import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Simple admin validation (in production, use proper auth)
const ADMIN_EMAIL = 'divyanshece242@gmail.com';

export async function GET(request: Request) {
  try {
    // Get all requests using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('data_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return NextResponse.json({ error: error.message, requests: [] }, { status: 500 });
    }

    return NextResponse.json({ requests: data || [] });
  } catch (err: any) {
    console.error('Admin requests error:', err);
    return NextResponse.json({ error: 'Failed to fetch requests', requests: [] }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, admin_comments, max_downloads, approval_valid_until, reviewed_at } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: any = {
      status,
      reviewed_at: reviewed_at || new Date().toISOString(),
    };

    if (admin_comments !== undefined) updateData.admin_comments = admin_comments;
    if (max_downloads !== undefined) updateData.max_downloads = max_downloads;
    if (approval_valid_until !== undefined) updateData.approval_valid_until = approval_valid_until;

    const { data, error } = await supabaseAdmin
      .from('data_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (err: any) {
    console.error('Admin update error:', err);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
