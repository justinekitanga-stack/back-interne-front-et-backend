// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Vérifier le token dans localStorage n'est pas possible côté serveur
  // On vérifie plutôt si un cookie existe (à ajouter plus tard)
  // Pour l'instant, on laisse passer tout le monde
  // La protection se fait côté client dans le layout dashboard
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};