import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename);
    
    // Path to the processed videos directory
    const videoPath = path.join(process.cwd(), '..', '..', 'gymnasticsapp', 'output_videos', filename);
    
    console.log('Looking for processed video at:', videoPath);
    
    // Check if file exists
    try {
      await fs.access(videoPath);
      console.log('Processed video file found:', videoPath);
    } catch (error) {
      console.error('Processed video file not found:', videoPath);
      return NextResponse.json(
        { error: 'Processed video file not found', path: videoPath },
        { status: 404 }
      );
    }

    // Read the video file
    const videoBuffer = await fs.readFile(videoPath);
    
    // Get file stats for content length
    const stats = await fs.stat(videoPath);
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'video/mp4'; // default
    if (ext === '.webm') contentType = 'video/webm';
    if (ext === '.ogg') contentType = 'video/ogg';
    if (ext === '.avi') contentType = 'video/x-msvideo';
    
    console.log('Serving processed video:', {
      filename,
      contentType,
      size: stats.size,
      path: videoPath
    });
    
    // Create response with proper headers
    const response = new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD',
        'Access-Control-Allow-Headers': 'Range',
      },
    });

    return response;
  } catch (error) {
    console.error('Error serving processed video:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle HEAD requests for video metadata
export async function HEAD(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename);
    const videoPath = path.join(process.cwd(), '..', '..', 'gymnasticsapp', 'output_videos', filename);
    
    console.log('HEAD request for processed video at:', videoPath);
    
    // Check if file exists
    try {
      await fs.access(videoPath);
    } catch (error) {
      console.error('Processed video file not found for HEAD request:', videoPath);
      return NextResponse.json(
        { error: 'Processed video file not found', path: videoPath },
        { status: 404 }
      );
    }

    const stats = await fs.stat(videoPath);
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'video/mp4';
    if (ext === '.webm') contentType = 'video/webm';
    if (ext === '.ogg') contentType = 'video/ogg';
    if (ext === '.avi') contentType = 'video/x-msvideo';
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD',
        'Access-Control-Allow-Headers': 'Range',
      },
    });
  } catch (error) {
    console.error('Error serving processed video HEAD:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}












