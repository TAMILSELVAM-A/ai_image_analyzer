import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2, Menu, Home, Camera, Settings, HelpCircle,
  MessageSquare, User, Upload, Image,
  Zap, Layers, Globe, Star, Folder, Archive, X
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from "react-markdown";

const AIImageAnalysis = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionImage, setsessionImage] = useState("");
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialAnalysisDone, setIsInitialAnalysisDone] = useState(false);

  // Add refs to manage scroll behavior
  const fileInputRef = useRef(null);
  const pageContainerRef = useRef(null);

  const gemini_api_key = "AIzaSyA69gs1nsB8EUQO8cW1J6vktbXZxUKvX1s"

  // Generative AI setup
  const genAI = new GoogleGenerativeAI(
    gemini_api_key
  );

  const prompt = `You are an AI-powered image recognition chatbot. 
Your task is to accurately analyze the uploaded image, identify objects, describe the scene, 
and provide clear and detailed answers to any user queries related to the image. 
Ensure your responses are concise, relevant, and insightful
Only provide information that is visible in the image—do not speculate or include external information.`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction: prompt });

  let conversationHistory = [];

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Prevent default scroll behavior
  useEffect(() => {
    const preventScroll = (e) => {
      if (e.target.closest('.image-upload-container')) {
        e.preventDefault();
      }
    };

    const container = pageContainerRef.current;
    if (container) {
      container.addEventListener('wheel', preventScroll, { passive: false });
      return () => {
        container.removeEventListener('wheel', preventScroll);
      };
    }
  }, []);

  // Image upload handler
  const handleImageUpload = async (event) => {
    try {
      setIsLoading(true);
      setIsInitialAnalysisDone(false);
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
          const base64Image = reader.result.split(",")[1];
          setsessionImage(base64Image);

          const imageUrl = URL.createObjectURL(file);
          setSelectedImage(imageUrl);

          try {
            const response = await model.generateContent([
              "Tell me about this image",
              { inlineData: { mimeType: file.type, data: base64Image } }
            ]);

            const textResponse = await response.response.text();
            conversationHistory.push({ role: "assistant", content: textResponse });

            const aiResponse = {
              text: textResponse,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sender: 'ai'
            };

            setChatMessages([...chatMessages, aiResponse]);
            setIsInitialAnalysisDone(true);
          } catch (error) {
            console.error('Error generating content:', error);
            const errorResponse = {
              text: "Sorry, I couldn't analyze the image. Please try again.",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sender: 'ai'
            };
            setChatMessages([...chatMessages, errorResponse]);
          } finally {
            setIsLoading(false);
          }
        };

        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          setIsLoading(false);
          setIsInitialAnalysisDone(false);
        };
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setIsInitialAnalysisDone(false);
    }
  };

  // Delete image handler
  const handleDeleteImage = () => {
    setSelectedImage(null);
    setsessionImage("");
    setChatMessages([]);
    setInputMessage("");
    setIsInitialAnalysisDone(false);
  };

  // Send message handler
  const handleSendMessage = async () => {
    if (inputMessage.trim() && isInitialAnalysisDone && !isLoading) {
      setIsLoading(true);
      const userMessage = {
        text: inputMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: 'user'
      };

      try {
        const aiResponseText = await askQuestion(inputMessage);

        const aiResponse = {
          text: aiResponseText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: 'ai'
        };

        setChatMessages(prevMessages => [...prevMessages, userMessage, aiResponse]);
        setInputMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
        const errorResponse = {
          text: "Sorry, I couldn't process your message. Please try again.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: 'ai'
        };
        setChatMessages(prevMessages => [...prevMessages, userMessage, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Ask AI question
  const askQuestion = async (question) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const response = await model.generateContent({
        contents: [
          ...conversationHistory,
          {
            role: "user",
            parts: [
              { text: question },
              sessionImage ? { inlineData: { mimeType: "image/png", data: sessionImage } } : null
            ].filter(Boolean)
          }
        ]
      });

      const textResponse = await response.response.text();
      conversationHistory.push({ role: "assistant", content: textResponse });

      return textResponse;
    } catch (error) {
      console.error("Error processing question:", error);
      throw error;
    }
  };

  // Navbar Menu Items Component
  const NavbarMenuItems = () => {
    const menuItems = [
      { icon: <Home size={20} />, label: 'Dashboard', href: '#' },
      { icon: <Image size={20} />, label: 'Image Library', href: '#' },
      { icon: <Layers size={20} />, label: 'Analysis History', href: '#' },
      { icon: <Star size={20} />, label: 'Favorites', href: '#' },
      { icon: <Folder size={20} />, label: 'Projects', href: '#' },
      { icon: <Archive size={20} />, label: 'Archived', href: '#' }
    ];

    return (
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
        {menuItems.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="flex items-center px-3 py-2 hover:bg-purple-50 rounded-lg text-gray-700 hover:text-purple-600 transition duration-200"
          >
            {item.icon}
            <span className="ml-2 md:block">{item.label}</span>
          </a>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={pageContainerRef}
      className="min-h-screen bg-gray-50 flex flex-col overflow-hidden"
    >
      {/* Navigation */}
      <nav className="bg-white shadow-md px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Zap className="text-purple-600" />
            <h1 className="text-xl font-bold text-gray-800">AI Image Analyzer</h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <NavbarMenuItems />
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 hover:text-purple-600 transition duration-200"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <button
            className="text-gray-600 hover:text-purple-600 transition duration-200"
            title="New Analysis"
          >
            <Camera size={20} />
          </button>
          <button
            className="text-gray-600 hover:text-purple-600 transition duration-200"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            className="text-gray-600 hover:text-purple-600 transition duration-200"
            title="Help"
          >
            <HelpCircle size={20} />
          </button>
          <button
            className="text-gray-600 hover:text-purple-600 transition duration-200"
            title="Profile"
          >
            <User size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="absolute top-0 left-0 w-64 h-full bg-white shadow-lg">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="mr-2" />
                <h2 className="text-xl font-bold">AI Toolkit</h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:bg-purple-700 p-2 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="p-4">
              <NavbarMenuItems />
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className='container mx-auto px-2 sm:px-4 py-4 sm:py-6 flex-grow overflow-hidden'>
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-xl overflow-hidden h-[calc(100vh-120px)] sm:h-[calc(100vh-200px)] max-h-[1200px] flex flex-col">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 sm:p-3 flex items-center">
            <h2 className="text-lg sm:text-xl font-bold">AI Image Analysis & Chat</h2>
          </div>

          {/* Card Content - Responsive Layout */}
          <div className="flex flex-col md:grid md:grid-cols-2 gap-0 flex-grow overflow-hidden">
            {/* Upload Image Section */}
            <div className="p-3 sm:p-4 md:p-6 md:border-r border-t md:border-t-0 border-gray-200 flex flex-col overflow-hidden image-upload-container">
              <div className="flex items-center mb-2 sm:mb-4">
                <Upload className="mr-2 text-purple-600 w-4 h-4 sm:w-5 sm:h-5" />
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">Image Analysis</h2>
              </div>
              <p className="text-gray-600 text-sm sm:text-base mb-2 sm:mb-4">Upload your image for AI-powered analysis</p>

              {/* Image Upload/Preview Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg flex-grow flex flex-col justify-center items-center relative p-2 sm:p-4 overflow-hidden">
                {selectedImage ? (
                  <div className="w-full h-full flex items-center justify-center relative">
                    <img
                      src={selectedImage}
                      alt="Uploaded"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                    <button
                      onClick={handleDeleteImage}
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 md:top-4 md:right-4 bg-red-500 text-white p-1 sm:p-2 rounded-full hover:bg-red-600"
                    >
                      <Trash2 size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="imageUpload"
                    />
                    <label
                      htmlFor="imageUpload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6 sm:w-8 sm:h-8"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" x2="12" y1="3" y2="15" />
                        </svg>
                      </div>
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base"
                      >
                        Select Image
                      </button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Chat Section */}
            <div className="p-3 sm:p-4 md:p-6 flex flex-col overflow-hidden">
              <div className="flex items-center mb-2 sm:mb-4">
                <MessageSquare className="mr-2 text-purple-600 w-4 h-4 sm:w-5 sm:h-5" />
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">Interactive Chat</h2>
              </div>
              <p className="text-gray-600 text-sm sm:text-base mb-2 sm:mb-4">Engage with AI about your image</p>

              <div className="flex flex-col flex-grow overflow-hidden">
                {/* Chat messages container */}
                <div className="flex-grow overflow-y-auto mb-2 sm:mb-4 space-y-2 sm:space-y-4 pr-1 sm:pr-2">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`
                    max-w-[90%] sm:max-w-[80%] p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl 
                    ${msg.sender === 'user'
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                            : 'bg-blue-50 text-blue-800'}
                    text-sm sm:text-base
                  `}
                      >
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                        <p
                          className={`text-xs mt-1 sm:mt-2 
                      ${msg.sender === 'user'
                              ? 'text-blue-200'
                              : 'text-blue-600'}
                    `}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="flex items-center space-x-1 sm:space-x-2 mt-auto pt-1 sm:pt-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about the image's details..."
                    className="flex-grow p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-blue-500 text-sm sm:text-base"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={!selectedImage || !isInitialAnalysisDone || isLoading}
                  />

                  <div className="relative">
                    <button
                      className={`flex items-center justify-center p-2 sm:p-3 rounded-lg ${!selectedImage || !isInitialAnalysisDone || isLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90"
                        }`}
                      onClick={handleSendMessage}
                      disabled={!selectedImage || !isInitialAnalysisDone || isLoading}
                    >
                      {isLoading ? (
                        <svg
                          className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 sm:w-5 sm:h-5"
                        >
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      )}
                    </button>
                    {(!selectedImage || !isInitialAnalysisDone) && (
                      <div className="absolute -top-6 sm:-top-8 right-0 bg-gray-700 text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                        {!selectedImage
                          ? "Upload an image first"
                          : "Waiting for analysis..."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIImageAnalysis;
