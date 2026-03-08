import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error_description = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/dashboard';

  // Handle OAuth error from provider
  if (error_description) {
    console.error('OAuth error:', error_description);
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(error_description)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('Session exchange error:', error.message);
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(error.message)}`
    );
  }

  // Return the user to home page with error
  return NextResponse.redirect(`${origin}/?auth_error=Could not authenticate user`);
}
