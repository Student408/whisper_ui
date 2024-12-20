'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void
}

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' })
        const audioFile = new File([audioBlob], 'recorded_audio.wav', { type: 'audio/wav' })
        onRecordingComplete(audioFile)
        chunksRef.current = []
      }
      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  if (!isClient) {
    return null // Return null on server-side to prevent hydration mismatch
  }

  return (
    <div>
      {isRecording ? (
        <Button onClick={stopRecording} variant="destructive">
          Stop Recording
        </Button>
      ) : (
        <Button onClick={startRecording}>Start Recording</Button>
      )}
    </div>
  )
}