export async function transcribeAudio(input: File | string): Promise<{ segments: Array<{ text: string, start: number, end: number }>, fullText: string }> {
  const formData = new FormData()
  if (input instanceof File) {
    formData.append('file', input)
  } else {
    formData.append('url', input)
  }

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Transcription failed')
  }

  return response.json()
}

