import { NextRequest, NextResponse } from 'next/server';
import { gymnasticsAPI } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Testing gymnasticsAPI.getSessions()...');
    
    const response = await gymnasticsAPI.getSessions();
    console.log('🔍 Debug: Response received:', {
      success: response.success,
      hasSessions: !!response.sessions,
      sessionCount: response.sessions?.length || 0
    });
    
    return NextResponse.json({
      success: true,
      message: 'Debug successful',
      backendResponse: {
        success: response.success,
        sessionCount: response.sessions?.length || 0,
        firstSession: response.sessions?.[0] ? {
          id: response.sessions[0]._id,
          filename: response.sessions[0].original_filename,
          status: response.sessions[0].status
        } : null
      }
    });
  } catch (error) {
    console.error('🔍 Debug: Error occurred:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}









