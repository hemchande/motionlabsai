import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Construct the backend URL
    const backendUrl = `http://localhost:5004/getVideo?video_filename=${encodeURIComponent(filename)}`
    
    console.log(`🎬 Proxying video request: ${filename}`)
    console.log(`🔗 Backend URL: ${backendUrl}`)

    // Fetch the video from the backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Range': request.headers.get('Range') || '',
        'Accept': 'video/mp4,*/*',
      },
    })

    if (!response.ok) {
      console.error(`❌ Backend video request failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: 'Video not found', details: response.statusText },
        { status: response.status }
      )
    }

    // Get the video data
    const videoData = await response.arrayBuffer()
    
    // Create response with proper headers
    const videoResponse = new NextResponse(videoData, {
      status: response.status,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': response.headers.get('Content-Length') || videoData.byteLength.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        ...(response.headers.get('Content-Range') && {
          'Content-Range': response.headers.get('Content-Range')!
        }),
      },
    })

    console.log(`✅ Video proxied successfully: ${filename} (${videoData.byteLength} bytes)`)
    return videoResponse

  } catch (error) {
    console.error(`❌ Error proxying video ${params.filename}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Construct the backend URL
    const backendUrl = `http://localhost:5004/getVideo?video_filename=${encodeURIComponent(filename)}`
    
    // Fetch headers from the backend
    const response = await fetch(backendUrl, {
      method: 'HEAD',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: response.status }
      )
    }

    // Return headers
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': response.headers.get('Content-Length') || '0',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
      },
    })

  } catch (error) {
    console.error(`❌ Error getting video headers for ${params.filename}:`, error)
    return NextResponse.json(
      { error: 'Failed to get video headers' },
      { status: 500 }
    )
  }
}




