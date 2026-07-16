import React, { useState } from 'react';
import { Send, Plus, Settings, Music, Play, Pause, SkipForward, ChevronDown, ChevronUp } from 'lucide-react';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '嗨宝贝，我在。' },
    { role: 'user', content: '今天好累' },
    { role: 'assistant', content: '那就早点休息。我陪着你。' }
  ]);
  const [input, setInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(true);
  const [currentSong, setCurrentSong] = useState({
    name: '夜的第七章',
    artist: '周杰伦',
    cover: 'https://via.placeholder.com/60'
  });

  return (
    <div className="h-screen flex bg-[#1A1A1A]">
      <div className="w-64 bg-[#2A2A2A] flex flex-col border-r border-white/5">
        <div className="p-4 border-b border-white/5">
          <button className="w-full flex items-center gap-2 px-4 py-2 bg-[#D4A574] text-white rounded-lg hover:bg-[#C39564] transition-colors">
            <Plus size={18} />
            <span>新对话</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="px-3 py-2 rounded-lg bg-white/5 mb-1 cursor-pointer text-gray-300">
            今天的对话
          </div>
          <div className="px-3 py-2 rounded-lg hover:bg-white/5 mb-1 cursor-pointer text-gray-400">
            昨天晚上
          </div>
          <div className="px-3 py-2 rounded-lg hover:bg-white/5 mb-1 cursor-pointer text-gray-400">
            周末计划
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-lg transition-colors text-gray-300">
            <Settings size={18} />
            <span>设置</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="h-16 flex items-center justify-between px-6 bg-[#2A2A2A] border-b border-white/5">
          <div className="text-gray-200">Claude</div>
          <select className="px-3 py-1 rounded-lg bg-[#1A1A1A] text-gray-300 border border-white/10 outline-none">
            <option>Claude 3.5 Sonnet</option>
            <option>GPT-4</option>
            <option>DeepSeek</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-[#D4A574] text-white' 
                  : 'bg-[#2A2A2A] text-gray-200'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#2A2A2A] rounded-2xl border border-white/10">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="跟我说说..."
              className="flex-1 bg-transparent border-0 outline-none text-gray-200 placeholder-gray-500"
            />
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Send size={20} className="text-[#D4A574]" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-24 right-6 w-80 bg-[#2A2A2A] rounded-xl shadow-2xl border border-white/10 overflow-hidden">
          <div 
            className="flex items-center justify-between p-3 bg-[#1A1A1A] cursor-pointer"
            onClick={() => setIsPlayerExpanded(!isPlayerExpanded)}
          >
            <div className="flex items-center gap-2">
              <Music size={16} className="text-[#D4A574]" />
              <span className="text-sm text-gray-300">电台</span>
            </div>
            {isPlayerExpanded ? 
              <ChevronDown size={16} className="text-gray-400" /> : 
              <ChevronUp size={16} className="text-gray-400" />
            }
          </div>

          {isPlayerExpanded && (
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={currentSong.cover} 
                  alt="cover" 
                  className="w-14 h-14 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate">{currentSong.name}</div>
                  <div className="text-xs text-gray-400 truncate">{currentSong.artist}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-[#D4A574]"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1:23</span>
                  <span>4:15</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <SkipForward size={18} className="text-gray-400 rotate-180" />
                </button>
                <button 
                  className="p-3 bg-[#D4A574] hover:bg-[#C39564] rounded-full transition-colors"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? 
                    <Pause size={20} className="text-white" /> : 
                    <Play size={20} className="text-white" />
                  }
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <SkipForward size={18} className="text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
