import { NextRequest, NextResponse } from 'next/server'
import { slidingWindowTranscription } from '@/lib/slidingWindowTranscription'

// Add route segment config
export const dynamic = 'force-dynamic'
export const runtime = 'edge'
export const preferredRegion = 'auto'

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData()
    const file = data.get('file') as File
    
    const buffer = await file.arrayBuffer()

    // Create a TransformStream for streaming the response
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Start transcription with callback
    slidingWindowTranscription(
      buffer,
      30000, // 30 second window
      15000, // 15 second stride
      async (segment) => {
        // Stream each segment as it's processed
        const segmentString = JSON.stringify(segment)
        await writer.write(new TextEncoder().encode(segmentString))
      }
    ).finally(() => {
      writer.close()
    })

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}

