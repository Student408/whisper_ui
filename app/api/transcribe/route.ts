import { NextRequest, NextResponse } from 'next/server'
import { slidingWindowTranscription } from '@/lib/slidingWindowTranscription'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const url = formData.get('url') as string | null

    if (!file && !url) {
      return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 })
    }

    let audioBuffer: ArrayBuffer

    if (file) {
      audioBuffer = await file.arrayBuffer()
    } else if (url && typeof url === 'string') {
      const response = await fetch(url)
      audioBuffer = await response.arrayBuffer()
    } else {
      throw new Error('No audio input')
    }

    const transcription = await slidingWindowTranscription(audioBuffer)

    return NextResponse.json({
      segments: transcription,
      fullText: transcription.map(s => s.text).join(' ')
    })
  } catch (error: unknown) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Transcription failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

