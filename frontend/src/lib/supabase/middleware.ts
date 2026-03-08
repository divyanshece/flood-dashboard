import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '@/types/database';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define admin routes only - other protected routes handled client-side with modal
  const adminPaths = ['/admin'];

  const isAdminPath = adminPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Check admin access - redirect to home if not admin
  if (isAdminPath) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Fetch user role
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if ((profile as any)?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}
