import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Image as ImageIcon,
  Video,
  Server,
  Cpu,
  PlayCircle,
  StopCircle,
  CheckCircle2,
  XCircle,
  Layers, // Icon for architecture
  BarChart2,
} from "lucide-react";
import animationData from './scanningAnimation.json';
import ThemeToggle from './ThemeToggle' // <-- Import the new component
import sampleImage1 from './sampleImage1.png'; // Make sure you have this file
import sampleImage2 from './sampleImage2.png';
import sampleImage3 from './sampleImage3.png';
import sampleImage4 from './sampleImage4.png';
import AnalyticsChart from './AnalyticsChart'; // <-- Import the new chart component



function App() {
  const [mode, setMode] = useState("photo");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);

 const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const loopId = useRef(null);
  const FRAME_SKIP = 10;
  const frameCount = useRef(0);

  const features = [
    { title: "YOLOv8 Detection", desc: "Custom-trained model detects Vietnamese license plates with high accuracy.", icon: <ImageIcon className="text-indigo-500" /> },
    { title: "FastPlateOCR Engine", desc: "A specialized ONNX model ensures rapid and precise character recognition.", icon: <Cpu className="text-indigo-500" /> },
    { title: "Live & Video Ready", desc: "Process plates in real-time from webcams or uploaded video files.", icon: <Camera className="text-indigo-500" /> },
    { title: "FastAPI Backend", desc: "A high-performance Python server handles requests asynchronously.", icon: <Server className="text-indigo-500" /> },
  ];
    const [lastResultStatus, setLastResultStatus] = useState(null);

  // All the handler functions (useEffect, stopAllStreams, handleModeChange, etc.) remain the same.
  // ... (No changes needed in the logic section)
  useEffect(() => {
    const interval = setInterval(() => {
      axios.get("http://localhost:8000/analytics")
        .then(res => setAnalytics(res.data))
        .catch(err => console.error("Failed to fetch analytics:", err));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const stopAllStreams = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    if (loopId.current) {
      cancelAnimationFrame(loopId.current);
      loopId.current = null;
    }
    setIsProcessing(false);
  };

  useEffect(() => {
    return () => stopAllStreams();
  }, []);
  
  const handleModeChange = (newMode) => {
    stopAllStreams();
    setMode(newMode);
    setFile(null);
    setPreview(null);
    setResults([]);
  };

  const handleFileChange = (e) => {
    stopAllStreams();
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResults([]);
    }
  };

  const sampleResults = [
    {
      plate: "81C-187.76",
      image: sampleImage1, // Replace with your image path
      condition: "Clear Daytime",
    },
    {
      plate: "30L-219.48",
      image: sampleImage2, // Replace with your image path
      condition: "Daytime",
    },
    {
      plate: "29E-014.29",
      image: sampleImage3, // Replace with your image path
      condition: "",
    },
    {
      plate: "49C-543.21",
      image: sampleImage4, // Replace with your image path
      condition: "Angular View",
    },
  ];


  const drawDetections = (detections, sourceElement, canvasElement) => {
    const ctx = canvasElement.getContext('2d');
    canvasElement.width = sourceElement.clientWidth;
    canvasElement.height = sourceElement.clientHeight;

    const scaleX = canvasElement.width / (sourceElement.naturalWidth || sourceElement.videoWidth);
    const scaleY = canvasElement.height / (sourceElement.naturalHeight || sourceElement.videoHeight);

    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (mode !== 'photo') {
      ctx.drawImage(sourceElement, 0, 0, canvasElement.width, canvasElement.height);
    }

    detections.forEach(det => {
      if (det.box && det.plate !== 'Unreadable') {
        const [x1, y1, x2, y2] = det.box;
        const box = {
          x: x1 * scaleX, y: y1 * scaleY,
          w: (x2 - x1) * scaleX, h: (y2 - y1) * scaleY
        };
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.strokeRect(box.x, box.y, box.w, box.h);

        const text = det.plate;
        const fontSize = Math.max(16, box.h * 0.4);
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        const textWidth = ctx.measureText(text).width;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(box.x, box.y - (fontSize + 8), textWidth + 16, fontSize + 8);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, box.x + 8, box.y - 6);
      }
    });
  };
  
  useEffect(() => {
    if (mode === 'photo' && results.length > 0 && imageRef.current) {
        imageRef.current.onload = () => {
             drawDetections(results, imageRef.current, canvasRef.current);
        }
        if (imageRef.current.complete) {
            drawDetections(results, imageRef.current, canvasRef.current);
        }
    }
  }, [results, preview, mode]);

  const detectionLoop = () => {
    if (!isProcessing) {
      cancelAnimationFrame(loopId.current);
      loopId.current = null;
      return;
    }

    frameCount.current += 1;
    if (frameCount.current % FRAME_SKIP === 0) {
      processFrame(videoRef.current, canvasRef.current);
    }
    
    loopId.current = requestAnimationFrame(detectionLoop);
  };
  
  useEffect(() => {
    if(isProcessing){
        detectionLoop();
    } else {
        if(loopId.current) cancelAnimationFrame(loopId.current)
    }
  }, [isProcessing]);

  const processFrame = (videoElement, canvasElement) => {
    if (!videoElement || !canvasElement || videoElement.paused || videoElement.ended) {
        setIsProcessing(false);
        return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoElement.videoWidth;
    tempCanvas.height = videoElement.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);

    tempCanvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');
        try {
            const res = await axios.post("http://localhost:8000/detect-plate", formData);
            drawDetections(res.data.detections, videoElement, canvasElement);
        } catch (error) {
            console.error("Frame processing error:", error);
        }
    }, 'image/jpeg');
  };

  const handlePhotoUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setResults([]);
    setLastResultStatus(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("http://localhost:8000/detect-plate", formData);
      const detections = res.data.detections || [];
      setResults(detections);
      const wasSuccessful = detections.some(det => det.plate !== "Unreadable");
      setLastResultStatus(wasSuccessful ? 'success' : 'failure');
    } catch (err) {
      console.error("Detection failed:", err);
      setResults([]);
      setLastResultStatus('failure');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoStream = (start) => {
    if (start) {
        videoRef.current.play();
        setIsProcessing(true);
    } else {
        videoRef.current.pause();
        setIsProcessing(false);
    }
  };

  const handleCameraStream = async (start) => {
    if (start) {
      try {
        setIsLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setMediaStream(stream);
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsProcessing(true);
          setIsLoading(false);
        };
      } catch (error) {
        console.error("Error accessing camera:", error);
        alert("Could not access camera. Please check permissions.");
        setIsLoading(false);
      }
    } else {
      stopAllStreams();
    }
  };


  
  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <nav className="sticky top-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl z-50 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">
            PLATE.AI
          </span>
          <div className="flex items-center gap-4">
            <a href="#demo" className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
              Try The Demo
            </a>
            <ThemeToggle /> {/* <-- Add the toggle button here */}
          </div>
        </div>
      </nav>

      <main>
        <section className="py-12 bg-slate-50 dark:bg-slate-900">
            <div className="max-w-lg mx-auto">
                <Lottie 
                  animationData={animationData} 
                  loop={true} 
                  autoplay={true}
                />
            </div>
        </section>
{/* --- NEW: Model Architecture Section --- */}
        <section id="model-architecture" className="py-24 bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                AI Model Architecture
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                Our system is powered by a custom-trained YOLOv11n model, optimized for a perfect balance between speed and accuracy.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-100 dark:bg-slate-900 p-8 rounded-xl">
                <Layers className="mx-auto h-12 w-12 text-indigo-500" />
                <h3 className="text-2xl font-bold mt-4 text-slate-900 dark:text-white">181</h3>
                <p className="text-slate-500 dark:text-slate-400">Layers</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-100 dark:bg-slate-900 p-8 rounded-xl">
                <Cpu className="mx-auto h-12 w-12 text-indigo-500" />
                <h3 className="text-2xl font-bold mt-4 text-slate-900 dark:text-white">2.59M</h3>
                <p className="text-slate-500 dark:text-slate-400">Parameters</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-100 dark:bg-slate-900 p-8 rounded-xl">
                <BarChart2 className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="text-2xl font-bold mt-4 text-slate-900 dark:text-white">91.7%</h3>
                <p className="text-slate-500 dark:text-slate-400">mAP50-95</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-slate-100 dark:bg-slate-900 p-8 rounded-xl">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="text-2xl font-bold mt-4 text-slate-900 dark:text-white">99.3%</h3>
                <p className="text-slate-500 dark:text-slate-400">mAP50</p>
              </motion.div>
            </div>
            <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
              *Metrics based on validation after 150 epochs of training on a custom dataset.
            </p>
          </div>
        </section>

        <section className="relative">
          <div className="absolute inset-0 bg-grid-slate-200 dark:bg-grid-slate-800 [mask-image:linear-gradient(to_bottom,white,transparent)] dark:[mask-image:linear-gradient(to_bottom,white_5%,transparent)]"></div>
          <div className="max-w-4xl mx-auto px-6 py-24 sm:py-32 text-center relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-5xl sm:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tighter"
            >
              Instant, Accurate License Plate Recognition
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300"
            >
              Leveraging advanced AI to analyze images, videos, and live camera feeds with unparalleled speed and precision.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-8 flex justify-center gap-4"
            >
              <a href="#demo" className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Get Started
              </a>
              <a href="#features" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold px-6 py-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-slate-200 dark:border-slate-700">
                  Learn More
              </a>
            </motion.div>
          </div>
        </section>

        <section id="demo" className="py-24 bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12">
                     <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Try It Live</h2>
                     <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">Switch between modes to see the model in action.</p>
                </div>
          
                <div className="flex justify-center space-x-2 border border-slate-300 dark:border-slate-700 rounded-xl p-2 max-w-md mx-auto mb-10 bg-slate-100 dark:bg-slate-800/50 shadow-sm">
                    {['photo', 'video', 'camera'].map((m) => (
                    <button
                        key={m}
                        onClick={() => handleModeChange(m)}
                        className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-colors text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 ${
                        mode === m ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md' : 'hover:bg-slate-200 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        {m === 'photo' && <ImageIcon size={18} />}
                        {m === 'video' && <Video size={18} />}
                        {m === 'camera' && <Camera size={18} />}
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-5">Input Source</h3>
                        {mode === 'photo' && (
                            <div className="space-y-4">
                                <p className="text-slate-600 dark:text-slate-400">Upload an image to detect all plates.</p>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900 cursor-pointer"/>
                                <button onClick={handlePhotoUpload} disabled={!file || isLoading} className="w-full mt-2 bg-indigo-600 text-white font-bold py-3 rounded-lg disabled:bg-slate-400 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                    {isLoading ? "Processing..." : "Detect Plates"}
                                </button>
                            </div>
                        )}
                         {mode === 'video' && (
                            <div className="space-y-4">
                                <p className="text-slate-600 dark:text-slate-400">Upload a video file to process in real-time.</p>
                                <input type="file" accept="video/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900 cursor-pointer"/>
                                <button onClick={() => handleVideoStream(!isProcessing)} disabled={!file} className={`w-full mt-2 font-bold py-3 rounded-lg disabled:bg-slate-400 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isProcessing ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                                    {isProcessing ? <><StopCircle/> Stop</> : <><PlayCircle/> Start Processing</>}
                                </button>
                            </div>
                        )}
                        {mode === 'camera' && (
                            <div className="space-y-4">
                                <p className="text-slate-600 dark:text-slate-400">Allow camera access to start live detection.</p>
                                <button onClick={() => handleCameraStream(!mediaStream)} disabled={isLoading} className={`w-full mt-2 font-bold py-3 rounded-lg disabled:bg-slate-400 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${mediaStream ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                                    {isLoading ? "Starting..." : (mediaStream ? <><StopCircle/> Stop Camera</> : <><Camera/> Start Camera</>)}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-700 shadow-2xl min-h-[450px] flex flex-col justify-center items-center">
                        <div className="w-full h-full relative overflow-hidden rounded-lg">
                            <AnimatePresence>
                                {!preview && !mediaStream && (
                                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-center text-slate-500 absolute inset-0 flex flex-col justify-center items-center bg-slate-800">
                                        <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mb-4"><ImageIcon className="w-10 h-10 text-slate-600"/></div>
                                        <p className="font-semibold">Output Preview</p>
                                        <p className="text-sm text-slate-600">Results will appear here</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {mode === 'photo' && preview && (
                                <div className="relative">
                                    <img ref={imageRef} src={preview} alt="Preview" className="w-full max-h-[500px] object-contain"/>
                                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                                </div>
                            )}
                            {(mode === 'video' || mode === 'camera') && (
                                <div className="relative w-full h-full">
                                    <video ref={videoRef} src={preview} muted autoPlay playsInline className="w-full h-full object-contain" />
                                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
{/* --- NEW: Static Results Showcase Section --- */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Examples of Our Accuracy
              </h2>
              <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
                Reliable performance across various challenging conditions.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {sampleResults.map((result, index) => (
                <motion.div 
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <img 
                    src={result.image} 
                    alt={`Example of a plate reading "${result.plate}"`} 
                    className="w-full h-40 object-cover border-b-4 border-indigo-500" 
                  />
                  <div className="p-6">
                    <p className="font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {result.plate}
                    </p>
                    <span className="mt-2 inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold px-3 py-1 rounded-full">
                      {result.condition}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

{analytics && (
          <section className="py-24">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Real-Time Analytics</h2>
                <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">Live statistics from our processing backend.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-white dark:bg-slate-900/50 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
                
                {/* Chart Column */}
                <div className="h-96">
                  <AnalyticsChart analytics={analytics} />
                </div>

                {/* Stats Column */}
                <div className="space-y-6">

                  {/* --- NEW: Last Result Status Indicator --- */}
                  {lastResultStatus && (
                    <div className="text-center">
                        <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">Last Operation Result</p>
                        {lastResultStatus === 'success' ? (
                            <span className="mt-2 inline-flex items-center gap-2 text-3xl font-bold text-green-500">
                                <CheckCircle2 size={32} /> Success
                            </span>
                        ) : (
                             <span className="mt-2 inline-flex items-center gap-2 text-3xl font-bold text-red-500">
                                <XCircle size={32} /> Failure
                            </span>
                        )}
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">Overall Accuracy</p>
                    <p className="text-6xl font-extrabold text-indigo-600 dark:text-indigo-400">{analytics.accuracy}%</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">Last Detected Plate(s)</p>
                    <p className="text-2xl font-mono bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-slate-700 dark:text-slate-200 mt-2">
                      {analytics.last_plate}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}




        <section id="features" className="py-24 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-6">
                 <div className="text-center mb-12 max-w-2xl mx-auto">
                     <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Core Technologies</h2>
                     <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">Our solution is built on a foundation of powerful, industry-leading technologies to ensure performance and reliability.</p>
                </div>
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((item, i) => (
                    <motion.div 
                        key={i} 
                        className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white dark:bg-slate-900"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        viewport={{ once: true }}
                    >
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4">{item.icon}</div>
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">{item.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </motion.div>
                    ))}
                </div>
            </div>
        </section>
      </main>
      
       <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <p>&copy; {new Date().getFullYear()} PLATE.AI. A demonstration project.</p>
            </div>
       </footer>
    </div>
  );
}

export default App;