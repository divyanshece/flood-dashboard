import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { requestId, userId, format } = await request.json();

    if (!requestId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Get the request and verify it belongs to user and is approved
    const { data: dataRequest, error: fetchError } = await supabaseAdmin
      .from('data_requests')
      .select('*')
      .eq('id', requestId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !dataRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // 2. Check if approved
    if (dataRequest.status !== 'approved') {
      return NextResponse.json({
        error: 'Access not approved',
        status: dataRequest.status
      }, { status: 403 });
    }

    // 3. Check if approval is still valid
    if (dataRequest.approval_valid_until) {
      const validUntil = new Date(dataRequest.approval_valid_until);
      if (validUntil < new Date()) {
        await supabaseAdmin
          .from('data_requests')
          .update({
            status: 'rejected',
            admin_comments: (dataRequest.admin_comments || '') + '\n[Auto-expired: Approval validity period ended]'
          })
          .eq('id', requestId);

        return NextResponse.json({
          error: 'Access expired',
          message: 'Your approval period has ended. Please submit a new request.'
        }, { status: 403 });
      }
    }

    // 4. Check download count
    if (dataRequest.download_count >= dataRequest.max_downloads) {
      await supabaseAdmin
        .from('data_requests')
        .update({
          status: 'rejected',
          admin_comments: (dataRequest.admin_comments || '') + '\n[Auto-revoked: Maximum download limit exceeded]'
        })
        .eq('id', requestId);

      return NextResponse.json({
        error: 'Download limit exceeded',
        message: `You have reached the maximum of ${dataRequest.max_downloads} downloads. Please submit a new request.`
      }, { status: 403 });
    }

    // 5. Fetch the actual flood data from Backend
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/flood-data`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!backendResponse.ok) {
        throw new Error('Failed to fetch flood data from backend');
      }

      const { events } = await backendResponse.json();

      // 6. Increment download count
      await supabaseAdmin
        .from('data_requests')
        .update({
          download_count: dataRequest.download_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      // 7. Log the download
      await supabaseAdmin
        .from('data_request_downloads')
        .insert({
          request_id: requestId,
          user_id: userId,
          download_format: format || 'csv',
          downloaded_at: new Date().toISOString()
        });

      const filename = `floodlens_data_${new Date().toISOString().split('T')[0]}`;

      // 8. Return data based on format (CSV or Excel only)
      if (format === 'excel') {
        // Generate Excel file
        const worksheet = XLSX.utils.json_to_sheet(events);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Flood Events');

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(excelBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
          },
        });
      } else {
        // Generate CSV (default)
        if (!events || events.length === 0) {
          return NextResponse.json({ error: 'No data available' }, { status: 404 });
        }

        const firstEvent = events[0] as Record<string, unknown>;
        const headers = Object.keys(firstEvent);
        const csvRows = [headers.join(',')];

        for (const event of events) {
          const eventObj = event as Record<string, unknown>;
          const values = headers.map(header => {
            const val = eventObj[header];
            if (val === null || val === undefined) return '';
            if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          });
          csvRows.push(values.join(','));
        }

        return new NextResponse(csvRows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}.csv"`,
          },
        });
      }

    } catch (backendError: unknown) {
      console.error('Backend error:', backendError);
      return NextResponse.json({ error: 'Failed to fetch flood data' }, { status: 500 });
    }

  } catch (err: unknown) {
    console.error('Download error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Download failed: ' + message }, { status: 500 });
  }
}

// GET - Check download status for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get the latest approved request for this user
    const { data, error } = await supabaseAdmin
      .from('data_requests')
      .select('id, status, download_count, max_downloads, approval_valid_until, admin_comments')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({
        hasAccess: false,
        message: 'No approved request found'
      });
    }

    const isExpired = data.approval_valid_until && new Date(data.approval_valid_until) < new Date();
    const isLimitReached = data.download_count >= data.max_downloads;

    return NextResponse.json({
      hasAccess: !isExpired && !isLimitReached,
      requestId: data.id,
      downloadCount: data.download_count,
      maxDownloads: data.max_downloads,
      remaining: Math.max(0, data.max_downloads - data.download_count),
      validUntil: data.approval_valid_until,
      isExpired,
      isLimitReached
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
