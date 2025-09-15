import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename);
    
    // Path to the analytics directory
    const analyticsPath = path.join(process.cwd(), '..', '..', 'analytics', filename);
    
    console.log('Looking for analytics file at:', analyticsPath);
    
    // Check if file exists
    try {
      await fs.access(analyticsPath);
      console.log('Analytics file found:', analyticsPath);
    } catch (error) {
      console.error('Analytics file not found:', analyticsPath);
      return NextResponse.json(
        { error: 'Analytics file not found', path: analyticsPath },
        { status: 404 }
      );
    }

    // Read the analytics file
    const analyticsData = await fs.readFile(analyticsPath, 'utf-8');
    
    // Parse JSON to validate it
    const parsedData = JSON.parse(analyticsData);
    
    console.log('Serving analytics:', {
      filename,
      size: analyticsData.length,
      path: analyticsPath
    });
    
    // Return the analytics data
    return new NextResponse(JSON.stringify(parsedData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error serving analytics:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        }
      }
    );
  }
}
