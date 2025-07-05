'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Send , Bot , User , Moon ,Sun } from 'lucide-react'
import { text } from 'node:stream/consumers'
interface Message{
  id:string
  content : string
  role : 'user' | 'assistant'
  timestamp : Date
}
export default function MainPage() {
  const [msgs , setMsgs] = useState<Message[]>([])
  const [input , setInput] = useState('');
  const [isLoading , setIsLoading] = useState(false)
  const [darkMode,setDarkMode] = useState(false)
  const msgEndRef = useRef<HTMLDivElement>(null) //ye reference to a DOM element or store a mutable value that doesn't trigger re-renders when changed

  const scrollToBottom = ()=>{
    msgEndRef.current?.scrollIntoView({behavior:'smooth'}) // .current refer to actual DOM element , scrollIntoView se vo div view me aa jaega aur usko end me place kr rkha hai to bottom me scroll ho jaega
  }
  useEffect(()=>{
    scrollToBottom()
  },[msgs])

  useEffect(()=>{
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  },[] )

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newDarkMode = !prev
      // Apply the dark mode class immediately when toggling
      //document.documentElement.classList.toggle('dark', newDarkMode) for tailwind v3 
      document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light')

      return newDarkMode
    })  
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
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
          message: input.trim(),
          history: msgs
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      }

      setMsgs(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMsgs(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className='flex flex-col h-screen bg-gray-50 dark:bg-gray-900'>
      {/* header */}
      <div className='flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3'>
          <div>
            <h1 className='text-xl font-semibold text-gray-900 dark:text-white'>
              AI Assistant
            </h1>
          </div>
          <button onClick={toggleDarkMode} className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'>
            {
              darkMode ? (< Sun className='w-5 h-5 text-gray-600 dark:text-gray-300'/>) : (<Moon className='w-5 h-5 text-gray-600 dark:text-gray-300'/>)
            }
          </button>
      </div>
      {/* messages */}
      <div className='flex-1 overflow-y-auto px-4 py-6'>
        <div className='max-w-4xl mx-auto space-y-6'>
          {(msgs.length ==0) && (
            <div className='text-center py-12'>
              <div className='w-24 h-24 bg-gradient-to-t from-blue-500 to-purple-300 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Bot className='w-12 h-12 text-white'/>
              </div>
              <h2 className='text-2xl font-semibold text-gray-900 dark:text-white mb-2'>
                How Can i Help YOu ?
              </h2>
              <p className='text-gray-600 dark:text-gray-400'>
                Start a converstation
              </p>
            </div>
          )}

          {msgs.map((msg)=>(
            <div key={msg.id} className={`flex ${msg.role == 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-3xl ${msg.role == 'user'? 'flex-row-reverse':'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role == 'user'? 'bg-blue-500 ml-3':'bg-gray-200 dark:bg-gray-700 mr-3'}`}>
                  {msg.role=='user'?(
                    <User className="w-5 h-5 text-white" />
                  ):(
                    <Bot className="w-5 h-5 bg-gradient-to-t from-blue-500 to-purple-300" />
                  )
                  }
                </div>
                <div className={`px-4 py-3 rounded-2xl ${msg.role =='user'?'bg-blue-500 text-white':'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'}`}>
                  <p className='whitespace-pre-wrap'> Message Content {msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {isLoading&&(
            <div className='flex justify-start'>
              <div className='flex max-w-3xl'>
                <div className='bg-gradient-to-t from-blue-500 to-purple-300 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3'>
                  <Bot className='w-5 h-5 text-gray-600 dark:text-gray-300'/>
                </div>
                <div className='px-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'>
                  <div className='flex spacex-x-1'>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse "></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={msgEndRef} /> 
        </div>
      </div>

      {/* input */}
      <div className='border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4'>
        <form onSubmit={handleSubmit} className='max-w-3xl mx-auto'>
          <div className='flex items-center space-x-3'>
            <div className='flex-1'>
              <textarea
                rows={1}
                value={input}
                onChange={(e)=>{
                  setInput(e.target.value)
                  const textarea = e.target
                  textarea.style.height = 'auto'
                  textarea.style.height = Math.min(textarea.scrollHeight,200)+'px'
                }}
                placeholder="Type your message..."
                style={{minHeight:'40px',maxHeight:'200px'}}
                className='w-full h-12 px-4 py-2 border-none border border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none bg-white dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
              />
            </div>
            <div>
              <button type='submit' disabled={!input.trim() || isLoading} className='p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300'>
                <Send className='w-5 h-5'/>
              </button>
            </div>
              
            
          </div>
        </form>
      </div>

    </div>
  )
}

