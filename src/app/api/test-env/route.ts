import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004';
    
    return NextResponse.json({
      success: true,
      NEXT_PUBLIC_API_URL: apiBaseUrl,
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to get environment variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




