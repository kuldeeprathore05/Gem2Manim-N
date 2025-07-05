'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Send , Bot , User , Moon ,Sun } from 'lucide-react'
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
    document.documentElement.classList.toggle('dark',darkMode)
  },[] )
  const toggleDarkMode=()=>{
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className={`flex flex-col h-screen ${darkMode?'dark':''}`}>
      {/* header */}
      <div className='flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3'>
          <div>
            <h1 className='text-xl font-semibold text-gray-900 dark:text-white'>
              AI Assistant
            </h1>
          </div>
          <button onClick={toggleDarkMode}>
            {
              darkMode ? (<div>Sun</div>) : (<div>Moon</div>)
            }
          </button>
      </div>
      {/* messages */}
      <div>
        <div>
          {msgs.length ==0 && (
            <div>
              <div>
                Bot
              </div>
              <h2>
                How Can i Help YOu ?
              </h2>
              <p>
                Start a converstation
              </p>
            </div>
          )}

          {msgs.map((msg)=>(
            <div>
              <div>
                <div>
                  {msg.role=='user'?(
                    <div>USer</div>
                  ):(
                    <div>Bot</div>
                  )
                  }
                </div>
                <div>
                  <p> Message Content {msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {isLoading&&(
            <div>
              <div>
                <div>
                  bot
                </div>
                <div>
                  <div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={msgEndRef} /> 
        </div>
      </div>

      {/* input */}
      <div>
        <form>
          <div>
            <div>
              <textarea

              />
              <button>
                Send
              </button>
            </div>
          </div>
        </form>
      </div>

    </div>
  )
}

