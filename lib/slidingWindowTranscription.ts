import { HfInference } from '@huggingface/inference'

// Ensure the API token is available
const HUGGING_FACE_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN
if (!HUGGING_FACE_API_TOKEN) {
  throw new Error('HUGGING_FACE_API_TOKEN is not defined')
}

const hf = new HfInference(HUGGING_FACE_API_TOKEN)

interface TranscriptionSegment {
  text: string
  start: number
  end: number
}

export async function slidingWindowTranscription(
  audioBuffer: ArrayBuffer,
  chunkLengthMs: number = 30000,
  strideLengthMs: number = 15000
): Promise<TranscriptionSegment[]> {
  const sampleRate = 16000 // Whisper model expects 16kHz audio
  const bytesPerSample = 2 // Assuming 16-bit audio
  const chunkLength = Math.floor((chunkLengthMs / 1000) * sampleRate) * bytesPerSample
  const strideLength = Math.floor((strideLengthMs / 1000) * sampleRate) * bytesPerSample

  const audioData = new Int16Array(audioBuffer)
  const transcription: TranscriptionSegment[] = []

  for (let start = 0; start < audioData.length * bytesPerSample; start += strideLength) {
    const end = Math.min(start + chunkLength, audioData.length * bytesPerSample)
    const chunk = audioData.slice(start / bytesPerSample, end / bytesPerSample)

    const chunkBuffer = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength)

    try {
      const modelId = process.env.HUGGING_FACE_MODEL_ID
      if (!modelId) {
        throw new Error('HUGGING_FACE_MODEL_ID is not defined')
      }

      const result = await hf.automaticSpeechRecognition({
        model: modelId,
        data: new Blob([chunkBuffer], { type: 'audio/wav' }),
      })

      transcription.push({
        text: result.text,
        start: start / (sampleRate * bytesPerSample),
        end: end / (sampleRate * bytesPerSample),
      })
    } catch (error) {
      console.error('Error processing chunk:', error)
    }
  }

  return transcription
}

