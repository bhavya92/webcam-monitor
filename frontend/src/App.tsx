import { useEffect, useRef, useState } from "react";

export default function App() {
  const [droswy, setDrowsy ] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<number| null>(null);
  const [start, setStart] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    if(!start)
      return;

    if(socketRef.current === null || socketRef.current.CLOSED)
      socketRef.current = new WebSocket("ws://localhost:8000/ws");
    
    socketRef.current.onmessage = (message) => {
      console.log(message);
      if(message.data === "drowsy"){
        setDrowsy(true)
      } else {
        setDrowsy(false)
      }
    }
    
    socketRef.current.onopen = () => {
      console.log("socket opened");
    }

    socketRef.current.onerror = (err) => {
      console.log("socket error",err);
    }

    socketRef.current.onclose = () => {
      console.log("socket closed");
      console.log(intervalRef.current);
    }

    return () => {
      console.log("Cleaning up ws...");
      socketRef.current?.close();
    }

  },[start])

  function startProcess() {
    setStart(true);
    navigator.mediaDevices.getUserMedia(
      {
        video:true
      }
    ).then( (stream) => {
      const video = document.querySelector("video");
      mediaStreamRef.current = stream;
      video!.srcObject = stream;
      video!.onloadedmetadata = () => {
        if(video === null)
          return;
        startStreaming(video);
      }
      
    })
    
  }

  function startStreaming(video: HTMLVideoElement) {
   
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if(!ctx || !video?.videoWidth) return;
    
    intervalRef.current = setInterval(() => {
      canvas.width = video!.videoWidth;
      canvas.height = video!.videoHeight;
      ctx!.drawImage(video!,0,0, canvas.width, canvas.height);
  
      canvas.toBlob((blob) => {
        if(blob === null)
          return;
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const final_data = (reader.result! as string).split(',')[1];
          if(socketRef.current && socketRef.current.readyState === WebSocket.OPEN)
            socketRef.current.send(final_data);
          else
            console.log("Socket not connected");
        }
      })
    },150);
  
  }
    

  function stopConnection(){
    setStart(false);
    if(socketRef.current && socketRef.current.readyState === WebSocket.OPEN)
      socketRef.current.close()

    if(mediaStreamRef.current) {
      const tracks = mediaStreamRef.current.getTracks();
      tracks.forEach( t=> t.stop());
      mediaStreamRef.current = null;
    }
    clearInterval(intervalRef.current!);
  }

  return <div className="w-screen h-screen flex flex-col items-center mt-8 gap-y-4">
      <div className="flex items-center justify-center w-full h-fit p-2 flex-col">
        <div className="text-2xl font-medium font-mono">Welocme to drowsiness detector, Click Start to begin</div>
        <div className="flex gap-4">
          <button className="cursor-pointer border p-2 font-light text-lg"
            onClick={startProcess}
          >Start</button>
          <button className="cursor-pointer border p-2 font-light text-lg"
            onClick={stopConnection}
          >Stop</button>
        </div>
       
      </div>
        <div className="w-1/2 h-1/2">
            <video className="bg-red-200 w-full h-full" autoPlay playsInline controls={false}/>
        </div>
      <div className={`${droswy ? "bg-red-500" : "bg-green-500"} text-white text-xl w-fit h-fit p-4`}>
          {droswy ? "Wakey wakey, eggs and bakey" : "Good kiddo, keep up"}
      </div>

  </div>
}

