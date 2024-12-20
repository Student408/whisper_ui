'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AudioRecorder from '@/components/AudioRecorder'

interface TranscriptionSegment {
  text: string
  start: number
  end: number
}

export default function WhisperTranscription() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [transcription, setTranscription] = useState<TranscriptionSegment[]>([])
  const [fullText, setFullText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAudioFile(file)
    }
  }

  const handleTranscribe = async () => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      if (audioFile) {
        formData.append('file', audioFile)
      } else if (audioUrl) {
        formData.append('url', audioUrl)
      }

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const result = await response.json()
      setTranscription(result.segments)
      setFullText(result.fullText)
    } catch (error) {
      console.error('Transcription error:', error)
      setTranscription([])
      setFullText('Error occurred during transcription')
    }
    setIsLoading(false)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Whisper Transcription</h1>
      <Card>
        <CardHeader>
          <CardTitle>Audio Input</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload">
            <TabsList>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="record">Record</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <Input type="file" accept="audio/*" onChange={handleFileUpload} />
            </TabsContent>
            <TabsContent value="record">
              <AudioRecorder onRecordingComplete={setAudioFile} />
            </TabsContent>
            <TabsContent value="url">
              <Input
                type="url"
                placeholder="Enter audio URL"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              />
            </TabsContent>
          </Tabs>
          <Button onClick={handleTranscribe} disabled={isLoading} className="mt-4">
            {isLoading ? 'Transcribing...' : 'Transcribe'}
          </Button>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Transcription Output</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Segmented Transcription:</h3>
          <div className="space-y-2 mb-4">
            {transcription.map((segment, index) => (
              <div key={index} className="border p-2 rounded">
                <span className="font-medium">{formatTime(segment.start)} - {formatTime(segment.end)}:</span> {segment.text}
              </div>
            ))}
          </div>
          <h3 className="text-lg font-semibold mb-2">Full Transcription:</h3>
          <Textarea
            value={fullText}
            readOnly
            placeholder="Full transcription will appear here..."
            rows={10}
          />
        </CardContent>
      </Card>
    </div>
  )
}

