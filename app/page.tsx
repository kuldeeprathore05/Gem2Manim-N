'use client'
import React, { useEffect, useRef, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast';
import { Send , Bot , User , Moon ,Sun,Play } from 'lucide-react'
import { UserButton, useUser } from '@clerk/nextjs'
import { text } from 'node:stream/consumers'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
interface Message{
  id:string
  content : string
  role : 'user' | 'assistant'
  isV : boolean
  timestamp : Date
}
interface Video{
  _id:string
  prompt:string
  videoUrl: string
  status?: "success" | "failed" | "processing";
}
export default function MainPage() {
  const [msgs , setMsgs] = useState<Message[]>([])
  const [input , setInput] = useState('');
  const [isLoading , setIsLoading] = useState(false)
  const [loadingVideos , setLoadingVideos] = useState(false)
  const [videos,setVideos] = useState<Video[]>([])

  const { user, isLoaded } = useUser();

  useEffect(()=>{
   if (isLoaded && user) {
      saveUserInfo();
    }
  },[isLoaded,user])
  
  useEffect(() => {
    if (isLoaded && user) {
      getVideos();
    }
  }, [isLoaded, user])

  const getVideos = async()=>{
    try{
      setLoadingVideos(true);
      const res = await fetch('api/videos',{
        method:'POST',
        body:JSON.stringify(user)
      })
      const ress = await res.json();
      console.log(ress)
      // if(ress.success){
      //   setVideos(ress.videos || [])
      // }
      const allVideos: Video[] = ress.videos || [];

      // Find failed videos
      const failedVideos = allVideos.filter((v) => v.status === "failed");
      const successfulVideos = allVideos.filter((v) => v.status !== "failed");

      // Show toast and delete failed videos
      for (const video of failedVideos) {
        toast.error(`❌ Video generation failed for: "${truncateText(video.prompt, 40)}"`);

        await fetch(`/api/video/${video._id}`, {
          method: "DELETE",
        });
      }

      // Only keep successful ones in UI
      setVideos(successfulVideos);
    }catch{
      console.log('Eroor in fetchin g videos')
    }
    finally{
      setLoadingVideos(false)
    }
    
  }
  const saveUserInfo =async ()=>{
    const res = await fetch('/api/user',{
      method:'POST',
      body:JSON.stringify(user),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      isV:false,
      timestamp: new Date()
    }

    setMsgs(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          msg: input.trim(),
          history: msgs,
          user
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      console.log(data)
      if(data.success){
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.url,
          isV:true,
          role: 'assistant',
          timestamp: new Date()
        }
        setMsgs(prev => [...prev, assistantMessage])
      }
      else{
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.message,
          isV:false,
          role: 'assistant',
          timestamp: new Date()
        }
        setMsgs(prev => [...prev, assistantMessage])
      }

      
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        isV:false,
        role: 'assistant',
        timestamp: new Date()
      }
      setMsgs(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }
   const VideoCard = ({ video }: { video: Video }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative aspect-video bg-gray-900 group">
        {video.status ==='success' && video.videoUrl?(
          <video controls className="w-full h-full object-cover">
                                  <source src={video.videoUrl} type="video/mp4" />
                                  Your browser does not support the video tag.
                    </video>
        ):(
<div className="flex h-full flex-col items-center justify-center text-white">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-2" />
            <p className="text-sm">Generating...</p>
          </div>
        )}
        
      </div> 
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {truncateText(video.prompt)}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Created At{/* {new Date(video.created_at).toLocaleDateString()} */}
        </p>
      </div>
    </div>
  )



  return (
    
    <div className='flex flex-col h-screen bg-gray-50 dark:bg-gray-900'>
      <Toaster position="bottom-right"
  reverseOrder={true}/>
      {/* header */}
       {/* <Header></Header> */}
      <div className='h-[60px] flex flex-row items-center justify-between px-4 bg-gray-400 shadow-sm'>
        <div className='flex items-center space-x-2'>
            <img className='h-8 w-8' src='https://images.saasworthy.com/videotoprompt_49333_logo_1725883156_c1inh.jpg' alt='image logo'></img>
            <h1 className='text-lg font-semibold'>Gem2Manim</h1>
        </div>
        <div className='flex items-center space-x-4'>
            <Dialog >
              <DialogTrigger className='bg-gradient-to-br from-blue-700 to-purple-700 hover:bg-gradient-to-br hover:from-blue-900 hover:to-purple-900 text-white px-3 py-1 rounded hover:bg-blue-700 transition'>+ Create</DialogTrigger>
              <DialogContent className="w-full max-w-xl">

                <DialogHeader>
                  <DialogTitle>
                    <div className='flex gap-2 items-center'>
                      <Bot className='text-white w-7 h-7 rounded-full p-1 bg-gradient-to-br from-blue-700 to-purple-400'></Bot>
                      <h3>Create your Video!</h3>
                    </div>
                    
                  </DialogTitle>
                  <DialogDescription className='text-gray-900 italic'>
                      Describe what you want to visualize and our AI will generate an educational video using mathematical animations.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
                  <Textarea value={input} onChange={(e)=>{setInput(e.target.value)}} className='w-full max-h-60 overflow-y-auto'></Textarea>
                  <Button type='submit' disabled={!input.trim() || isLoading} className='bg-gradient-to-br from-blue-700 to-purple-400 hover:bg-gradient-to-br hover:from-blue-900 hover:to-purple-600'>Generate</Button>
                </form>

              </DialogContent>
            </Dialog>
            {/* <button className='bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition'>+ Create</button> */}
            <UserButton></UserButton>
        </div>
    </div>

    {/* ContenT */}
    <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto px-4 py-6'>
          <div className='mb-6'>
            <h2 className='text-2xl font-bold text-gray-800 dark:text-white mb-2'>Your Videos</h2>
            <p className='text-gray-600 dark:text-gray-300'>Mathematical animations generated by AI</p>
          </div>

          {loadingVideos ? (
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-2 text-gray-600 dark:text-gray-300'>Loading videos...</span>
            </div>
          ) : videos.length === 0 ? (
            <div className='text-center py-12'>
              <Bot className='bg-gradient-to-br from-blue-700 to-purple-700 rounded-full w-24 h-24 p-4 text-white mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2'>No videos yet</h3>
              <p className='text-gray-500 dark:text-gray-400'>Create your first mathematical animation by clicking the "+ Create" button above.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {videos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          )}
        </div>
      </div>
      

    </div>
  )
}

