import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated } from './app/api/auth/services/requireAuth';


export const config = {
    matcher: [
      '/api/:path*',
    ],
  };

function isExcluded(pathname: string): boolean {
    const excludedRoutes = [
      '/api/auth/login',
      '/api/auth/refreshToken',
      '/api/auth/forgotPassword',
      '/api/auth/resetPassword',
      '/api/auth/logout',
    ];
    
    // Checks if current path exactly matches or starts with any excluded route
    return excludedRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );
  }


export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
  
    // Use the helper to skip proxying if the route is excluded
    if (isExcluded(pathname)) {
      return NextResponse.next(); 
    }
  
   const valid = await isAuthenticated(request);
   if (!valid) {
    return NextResponse.json({ error: 'Unauthorized or missing token' }, { status: 401 });
   }
   return NextResponse.next();
  }