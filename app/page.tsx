'use client'
import React, { useEffect, useState, useCallback } from 'react'
import toast, { Toaster } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns'
import { Bot, Play, Trash2, Loader2, Sparkles, Video as VideoIcon, RefreshCw } from 'lucide-react'
import { UserButton, useUser } from '@clerk/nextjs'
// REMOVED: import { text } from 'node:stream/consumers' <--- This was causing the crash
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  isV: boolean
  timestamp: Date
}

interface Video {
  _id: string
  prompt: string
  videoUrl: string
  // Support both old ('success') and new ('completed') statuses
  status: "completed" | "success" | "failed" | "processing" | "pending";
  createdAt: string
}

export default function MainPage() {
  const [msgs, setMsgs] = useState<Message[]>([])
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false)
  const [loadingVideos, setLoadingVideos] = useState(true) 
  const [videos, setVideos] = useState<Video[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { user, isLoaded } = useUser();

  const saveUserInfo = useCallback(async () => {
    if (!user) return;
    try {
        await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user }),
        })
    } catch (e) { console.log("User save error", e) }
  }, [user]);

  const getVideos = useCallback(async (isBackgroundRefresh = false) => {
    if (!user) return;
    try {
      if (!isBackgroundRefresh) setLoadingVideos(true);
      
      const res = await fetch('api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
      })
      const data = await res.json();
      
      const allVideos: Video[] = data.videos || [];
      setVideos(allVideos);
      
    } catch {
      console.log('Error fetching videos')
    } finally {
      if (!isBackgroundRefresh) setLoadingVideos(false)
    }
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, videoId: string) => {
    e.preventDefault(); 
    if(!confirm("Are you sure you want to delete this video?")) return;

    const newVideos = videos.filter(v => v._id !== videoId);
    setVideos(newVideos); 
    toast.success("Video deleted");

    try {
      await fetch(`/api/video/${videoId}`, { method: "DELETE" });
    } catch (err) {
      toast.error("Failed to delete video");
      getVideos(); 
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      saveUserInfo();
      getVideos();
    }
  }, [isLoaded, user, saveUserInfo, getVideos])

  // Auto-polling logic
  useEffect(() => {
    const hasPending = videos.some(v => v.status === 'pending' || v.status === 'processing');
    let interval: NodeJS.Timeout;

    if (hasPending) {
      interval = setInterval(() => {
        getVideos(true);
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [videos, getVideos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const tempId = Date.now().toString();
    const userMessage: Message = {
      id: tempId,
      content: input.trim(),
      role: 'user',
      isV: false,
      timestamp: new Date()
    }
    setMsgs(prev => [...prev, userMessage])
    
    const currentInput = input;
    setInput('')
    setIsLoading(true)
    setIsDialogOpen(false) 
    toast.success("Generation started!")

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg: currentInput.trim(),
          history: msgs,
          user
        }),
      })

      if (!response.ok) throw new Error('Failed to start generation')
      
      // Refresh immediately to show pending card
      getVideos(true);

    } catch (error) {
      console.error('Error:', error)
      toast.error("Failed to start generation");
    } finally {
      setIsLoading(false)
    }
  }

  const truncateText = (text: string, maxLength: number = 80) => {
    if (!text) return "";
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const StatusBadge = ({ status }: { status: Video['status'] }) => {
    switch(status) {
      case 'pending':
      case 'processing':
        return (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-blue-600/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full shadow-lg z-10">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="capitalize">{status}</span>
          </div>
        );
      case 'failed':
        return (
          <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full shadow-lg z-10">
            Failed
          </div>
        );
      case 'completed':
      case 'success':
        return null;
      default:
        return null;
    }
  }

  return (
    <div className='flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950'>
      <Toaster position="bottom-right" reverseOrder={false}/>
      
      <div className='sticky top-0 z-50 h-16 flex items-center justify-between px-4 md:px-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800'>
        <div className='flex items-center space-x-3'>
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 rounded-lg shadow-md">
             <Bot className="w-5 h-5 text-white" />
          </div>
          <h1 className='text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600'>
            Gem2Manim
          </h1>
        </div>
        
        <div className='flex items-center space-x-4'>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02]'>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Video
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] border-gray-200 dark:border-gray-800">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <span className="text-blue-600">✨</span> Create New Animation
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                  Describe the concept you want to visualize (e.g. &quot;Binary Search&quot;, &quot;Solar System&quot;).
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className='mt-4 space-y-4'>
                <Textarea 
                  value={input} 
                  onChange={(e)=>setInput(e.target.value)} 
                  placeholder="Explain how a Bubble Sort algorithm works..."
                  className='min-h-[150px] text-base p-4 resize-none focus-visible:ring-blue-500'
                />
                <div className="flex justify-end">
                  <Button 
                    type='submit' 
                    disabled={!input.trim() || isLoading} 
                    className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700'
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                      </>
                    ) : 'Generate Animation'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <main className='flex-1 container mx-auto px-4 md:px-8 py-8 max-w-7xl'>
        
        <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8'>
          <div>
            <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>Your Library</h2>
            <p className='text-gray-500 dark:text-gray-400 mt-1'>
              {videos.length} {videos.length === 1 ? 'video' : 'videos'} generated
            </p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => getVideos(false)}
            className="text-gray-600 gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingVideos ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loadingVideos && videos.length === 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden h-[300px] animate-pulse">
                <div className="h-[180px] bg-gray-200 dark:bg-gray-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-center'>
            <div className='bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6'>
              <VideoIcon className='w-12 h-12 text-gray-400' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>No videos created yet</h3>
            <p className='text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8'>
              Use the create button to generate your first educational animation powered by AI.
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
              className="border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600"
            >
              Start Creating
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {videos.map((video) => (
              <div 
                key={video._id} 
                className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-video bg-gray-900">
                  <StatusBadge status={video.status} />
                  
                  {/* FIX: Check for both 'completed' AND 'success' */}
                  {(video.status === 'completed' || video.status === 'success') && video.videoUrl ? (
                    <video 
                      controls 
                      className="w-full h-full object-cover"
                      preload="metadata"
                      poster="/video-placeholder.png" // Add a placeholder image in public folder if you want
                    >
                      <source src={video.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 bg-gray-900/50 backdrop-blur-sm">
                      {video.status === 'failed' ? (
                        <div className="flex flex-col items-center text-red-400">
                          <VideoIcon className="w-10 h-10 mb-2 opacity-50" />
                          <span className="text-sm font-medium">Generation Failed</span>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                            <Loader2 className="relative w-10 h-10 animate-spin text-blue-400 mb-3" />
                          </div>
                          <p className="text-sm font-medium text-blue-100 animate-pulse">
                            Rendering Animation...
                          </p>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Delete Overlay (Visible on Hover) */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                    <button 
                      onClick={(e) => handleDelete(e, video._id)}
                      className="p-2 bg-black/50 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-colors"
                      title="Delete video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug" title={video.prompt}>
                      {truncateText(video.prompt)}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Play className="w-3 h-3" /> Manim
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}