'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [segmentQueue, setSegmentQueue] = useState<TranscriptionSegment[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const transcriptionContainerRef = useRef<HTMLDivElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAudioFile(file)
    }
  }

  const scrollToBottom = () => {
    if (transcriptionContainerRef.current) {
      transcriptionContainerRef.current.scrollTo({
        top: transcriptionContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  const animateTyping = async (segment: TranscriptionSegment) => {
    let currentText = ''
    for (let i = 0; i < segment.text.length; i++) {
      currentText += segment.text[i]
      setDisplayedTranscription(prev => {
        const newTranscription = [...prev]
        // Remove the previous incomplete version of this segment if it exists
        const filtered = newTranscription.filter(s => s.start !== segment.start)
        // Add the current version of the segment
        return [...filtered, { ...segment, text: currentText }]
      })
      scrollToBottom() // Scroll after each update
      await new Promise(resolve => setTimeout(resolve, 30))
    }
  }

  // Process queue when new segments arrive or previous animation finishes
  useEffect(() => {
    const processQueue = async () => {
      if (segmentQueue.length > 0 && !isTyping) {
        setIsTyping(true)
        const segment = segmentQueue[0]
        await animateTyping(segment)
        setSegmentQueue(prev => prev.slice(1))
        setIsTyping(false)
      }
    }

    processQueue()
  }, [segmentQueue, isTyping])

  const handleNewSegment = (segment: TranscriptionSegment) => {
    setSegmentQueue(prev => [...prev, segment])
  }

  const handleTranscribe = async () => {
    setIsLoading(true)
    setDisplayedTranscription([]) // Reset displayed transcription
    setCurrentSegmentIndex(0) // Reset segment index
    setCurrentCharIndex(0) // Reset character index
    setSegmentQueue([])
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

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Parse the chunk data
        const chunk = new TextDecoder().decode(value)
        const segment = JSON.parse(chunk)
        
        // Handle the new segment
        handleNewSegment(segment)
      }

    } catch (error) {
      console.error('Transcription error:', error)
      setDisplayedTranscription([])
    }
    setIsLoading(false)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Whisper Transcription
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload, record, or provide a URL to transcribe audio
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Audio Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="record">Record</TabsTrigger>
                <TabsTrigger value="url">URL</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="mt-4">
                <Input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleFileUpload}
                  className="hover:cursor-pointer" 
                />
              </TabsContent>
              <TabsContent value="record" className="mt-4">
                <AudioRecorder onRecordingComplete={setAudioFile} />
              </TabsContent>
              <TabsContent value="url" className="mt-4">
                <Input
                  type="url"
                  placeholder="Enter audio URL"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </TabsContent>
            </Tabs>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={handleTranscribe} 
                disabled={isLoading}
                className="w-full md:w-auto px-8 py-2 text-lg"
              >
                {isLoading ? 'Transcribing...' : 'Transcribe'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {displayedTranscription.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Transcription Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={transcriptionContainerRef}
                className="space-y-4 max-h-[500px] overflow-y-auto" // Added max-height and overflow
              >
                {displayedTranscription.map((segment, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col space-y-2 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(segment.start)} - {formatTime(segment.end)}
                    </span>
                    <p className="text-gray-900 dark:text-gray-100 text-lg">
                      {segment.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

