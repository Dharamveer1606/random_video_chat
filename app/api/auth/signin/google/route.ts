import { NextResponse } from 'next/server';

// Redirect any Google sign-in attempts back to home page
export function GET() {
  return NextResponse.redirect('/');
}

export function POST() {
  return NextResponse.redirect('/');
} 