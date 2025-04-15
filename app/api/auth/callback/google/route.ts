import { NextResponse } from 'next/server';

// Intercept all Google callback attempts and redirect to home page
export async function GET() {
  return NextResponse.redirect('/');
}

export async function POST() {
  return NextResponse.redirect('/');
} 