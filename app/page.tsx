'use client'

import { useState, useEffect } from 'react'
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
  const [displayedTranscription, setDisplayedTranscription] = useState<TranscriptionSegment[]>([]) // Existing state
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0) // New state
  const [currentCharIndex, setCurrentCharIndex] = useState(0) // New state

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAudioFile(file)
    }
  }

  const handleTranscribe = async () => {
    setIsLoading(true)
    setDisplayedTranscription([]) // Reset displayed transcription
    setCurrentSegmentIndex(0) // Reset segment index
    setCurrentCharIndex(0) // Reset character index
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

      // Start typing simulation per letter
      simulateTyping(result.segments)
    } catch (error) {
      console.error('Transcription error:', error)
      setTranscription([])
      setFullText('Error occurred during transcription')
    }
    setIsLoading(false)
  }

  const simulateTyping = async (segments: TranscriptionSegment[]) => {
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      let currentText = ''
      for (let j = 0; j < segment.text.length; j++) {
        currentText += segment.text[j]
        setDisplayedTranscription(prev => {
          const newTranscription = [...prev]
          if (newTranscription[i]) {
            newTranscription[i].text = currentText
          } else {
            newTranscription[i] = { ...segment, text: currentText }
          }
          return newTranscription
        })
        await new Promise(resolve => setTimeout(resolve, 50)) // 50ms per character
      }
    }
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
            {displayedTranscription.map((segment, index) => (
              <div key={index} className="border p-2 rounded">
                <span className="font-medium">{formatTime(segment.start)} - {formatTime(segment.end)}:</span> {segment.text}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

