import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  
  const token = request.cookies.get('token')?.value; 

  const isLoginPage = request.nextUrl.pathname === '/user/login';


  if (!token && !isLoginPage) {

    const loginUrl = new URL('/user/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    
    return NextResponse.redirect(loginUrl);
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/user/login',
    '/user/account',
    '/user/account/saved-articles',
    '/user/chatroom',
    // '/user/personal'
  ],
};
