import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Settings, Music, Play, Pause, SkipForward, ChevronDown, ChevronUp, X, RefreshCw, MoreVertical, Trash2, Edit2 } from 'lucide-react';

const API_BASE_URL = 'https://chat-backend-wsuj.onrender.com';

const ChatInterface = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [currentSong, setCurrentSong] = useState({
    name: '夜的第七章',
    artist: '周杰伦',
    cover: 'https://via.placeholder.com/60'
  });
  
  const [apiConfig, setApiConfig] = useState(() => {
    const saved = localStorage.getItem('apiConfig');
    return saved ? JSON.parse(saved) : {
      baseUrl: '',
      apiKey: '',
      model: ''
    };
  });
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 组件挂载时加载会话列表
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`);
      if (!response.ok) throw new Error('加载会话失败');
      
      const data = await response.json();
      setSessions(data);
      
      // 如果有会话，自动选中第一个
      if (data.length > 0 && !currentSessionId) {
        switchSession(data[0].id);
      }
    } catch (error) {
      console.error('加载会话失败:', error);
    }
  };

  const switchSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    
    // 加载该会话的消息
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/messages`);
      if (!response.ok) throw new Error('加载消息失败');
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('加载消息失败:', error);
      setMessages([]);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '新对话' }),
      });

      if (!response.ok) throw new Error('创建会话失败');

      const session = await response.json();
      setSessions(prev => [session, ...prev]);
      setCurrentSessionId(session.id);
      setMessages([]);
    } catch (error) {
      console.error('创建会话失败:', error);
    }
  };

  const renameSession = async (sessionId, newName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) throw new Error('重命名失败');

      const updated = await response.json();
      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s));
      setEditingSessionId(null);
    } catch (error) {
      console.error('重命名失败:', error);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!confirm('确定删除这个会话吗？')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('删除失败');

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        if (remaining.length > 0) {
          switchSession(remaining[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const fetchModels = async () => {
    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      alert('请先填写 API 地址和 API Key');
      return;
    }

    setIsLoadingModels(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`${apiConfig.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`
        }
      });

      if (!response.ok) throw new Error('获取模型列表失败');

      const data = await response.json();
      const models = data.data.map(m => m.id);
      setAvailableModels(models);
      setTestResult({ success: true, message: `成功获取 ${models.length} 个模型` });
    } catch (error) {
      console.error('获取模型失败:', error);
      setTestResult({ success: false, message: '获取模型列表失败，请检查 API 配置' });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const testConnection = async () => {
    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      alert('请先填写 API 地址和 API Key');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`${apiConfig.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`
        }
      });

      if (!response.ok) throw new Error('连接失败');

      setTestResult({ success: true, message: '连接成功！API 配置正确' });
    } catch (error) {
      console.error('测试连接失败:', error);
      setTestResult({ success: false, message: '连接失败，请检查 API 地址和 Key 是否正确' });
    } finally {
      setIsTesting(false);
    }
  };

  const saveApiConfig = () => {
    if (!apiConfig.baseUrl || !apiConfig.apiKey || !apiConfig.model) {
      alert('请填写完整的 API 配置');
      return;
    }
    
    localStorage.setItem('apiConfig', JSON.stringify(apiConfig));
    setShowSettings(false);
    setTestResult(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !currentSessionId) return;
    
    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      alert('请先在设置中配置 API');
      setShowSettings(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${currentSessionId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          apiConfig: apiConfig
        }),
      });

      if (!response.ok) throw new Error('网络响应失败');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，出了点问题。稍后再试？' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex bg-[#1A1A1A]">
      <div className="w-64 bg-[#2A2A2A] flex flex-col border-r border-white/5">
        <div className="p-4 border-b border-white/5">
          <button 
            onClick={createNewSession}
            className="w-full flex items-center gap-2 px-4 py-2 bg-[#D4A574] text-white rounded-lg hover:bg-[#C39564] transition-colors"
          >
            <Plus size={18} />
            <span>新对话</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`group px-3 py-2 rounded-lg mb-1 cursor-pointer transition-colors ${
                currentSessionId === session.id
                  ? 'bg-white/10 text-gray-200'
                  : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              {editingSessionId === session.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => renameSession(session.id, editingName)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      renameSession(session.id, editingName);
                    }
                  }}
                  className="w-full bg-transparent border-0 outline-none text-sm"
                  autoFocus
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => switchSession(session.id)}
                    className="flex-1 truncate text-sm"
                  >
                    {session.name}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSessionId(session.id);
                        setEditingName(session.name);
                      }}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-lg transition-colors text-gray-300"
          >
            <Settings size={18} />
            <span>设置</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="h-16 flex items-center justify-between px-6 bg-[#2A2A2A] border-b border-white/5">
          <div className="text-gray-200">
            {sessions.find(s => s.id === currentSessionId)?.name || 'Claude'}
          </div>
          <div className="text-sm text-gray-400">
            {apiConfig.model || '未配置'}
          </div>
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
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] px-4 py-3 rounded-2xl bg-[#2A2A2A] text-gray-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#2A2A2A] rounded-2xl border border-white/10">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="跟我说说..."
              disabled={isLoading || !currentSessionId}
              className="flex-1 bg-transparent border-0 outline-none text-gray-200 placeholder-gray-500 disabled:opacity-50"
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !currentSessionId}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
                <div className="w-14 h-14 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                  <Music size={24} className="text-gray-600" />
                </div>
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

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2A2A2A] rounded-xl w-[500px] max-w-[90vw] border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl text-gray-200">API 设置</h2>
              <button 
                onClick={() => {
                  setShowSettings(false);
                  setTestResult(null);
                }}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">API 地址</label>
                <input
                  type="text"
                  value={apiConfig.baseUrl}
                  onChange={(e) => setApiConfig({...apiConfig, baseUrl: e.target.value})}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">API Key</label>
                <input
                  type="password"
                  value={apiConfig.apiKey}
                  onChange={(e) => setApiConfig({...apiConfig, apiKey: e.target.value})}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-300">模型</label>
                  <button
                    onClick={fetchModels}
                    disabled={isLoadingModels}
                    className="flex items-center gap-1 text-sm text-[#D4A574] hover:text-[#C39564] disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isLoadingModels ? 'animate-spin' : ''} />
                    <span>获取列表</span>
                  </button>
                </div>
                
                {availableModels.length > 0 ? (
                  <select
                    value={apiConfig.model}
                    onChange={(e) => setApiConfig({...apiConfig, model: e.target.value})}
                    className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                  >
                    <option value="">选择模型</option>
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={apiConfig.model}
                    onChange={(e) => setApiConfig({...apiConfig, model: e.target.value})}
                    placeholder="claude-3.5-sonnet / gpt-4 / deepseek-chat"
                    className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                  />
                )}
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3">
              <button
                onClick={testConnection}
                disabled={isTesting}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors disabled:opacity-50"
              >
                {isTesting ? '测试中...' : '测试连接'}
              </button>
              <button
                onClick={saveApiConfig}
                className="flex-1 px-4 py-2 bg-[#D4A574] hover:bg-[#C39564] rounded-lg text-white transition-colors"
              >
                保存 API 配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
