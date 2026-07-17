import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Settings, Menu, X, RefreshCw, Edit2, Trash2, Brain, Grid, Upload, Trash, Edit } from 'lucide-react';

const API_BASE_URL = 'https://chat-backend-wsuj.onrender.com';

const ChatInterface = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSessionConfig, setShowSessionConfig] = useState(false);
  const [currentSessionConfig, setCurrentSessionConfig] = useState(null);
  const [worldBook, setWorldBook] = useState([]);
  const [memorySummaries, setMemorySummaries] = useState([]);
  const [editingWorldBook, setEditingWorldBook] = useState(null);
  const [editingSummary, setEditingSummary] = useState(null);
  const [settingsTab, setSettingsTab] = useState('api');
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [expandedThinking, setExpandedThinking] = useState({});
  const [systemSettings, setSystemSettings] = useState(null);
  
  const [apiConfig, setApiConfig] = useState(() => {
    const saved = localStorage.getItem('apiConfig');
    return saved ? JSON.parse(saved) : {
      baseUrl: '',
      apiKey: '',
      model: ''
    };
  });
  
  const messagesEndRef = useRef(null);
  const charAvatarInputRef = useRef(null);
  const userAvatarInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSessions();
    
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'char') {
        setCurrentSessionConfig({...currentSessionConfig, char_avatar: reader.result});
      } else {
        setCurrentSessionConfig({...currentSessionConfig, user_avatar: reader.result});
      }
    };
    reader.readAsDataURL(file);
  };

  const loadSessionConfig = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error('加载会话配置失败');
      const data = await response.json();
      setCurrentSessionConfig(data);
      
      // 加载世界书
      const wbResponse = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/worldbook`);
      if (wbResponse.ok) {
        const wbData = await wbResponse.json();
        setWorldBook(wbData);
      }
      
      // 加载记忆总结
      const msResponse = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/summaries`);
      if (msResponse.ok) {
        const msData = await msResponse.json();
        setMemorySummaries(msData);
      }
      
      setShowSessionConfig(true);
    } catch (error) {
      console.error('加载会话配置失败:', error);
    }
  };

  const saveSessionConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${currentSessionConfig.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentSessionConfig),
      });

      if (!response.ok) throw new Error('保存失败');
      
      // 更新本地会话列表
      setSessions(prev => prev.map(s => s.id === currentSessionConfig.id ? {...s, name: currentSessionConfig.name} : s));
      
      setShowSessionConfig(false);
      alert('设置已保存');
    } catch (error) {
      console.error('保存会话配置失败:', error);
      alert('保存失败');
    }
  };

  const addWorldBookEntry = async () => {
    setEditingWorldBook({ name: '', content: '', isNew: true });
  };

  const saveWorldBookEntry = async (entry) => {
    try {
      if (entry.isNew) {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${currentSessionConfig.id}/worldbook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: entry.name, content: entry.content }),
        });
        
        if (!response.ok) throw new Error('添加失败');
        const newEntry = await response.json();
        setWorldBook(prev => [...prev, newEntry]);
      } else {
        const response = await fetch(`${API_BASE_URL}/api/worldbook/${entry.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: entry.name, content: entry.content }),
        });
        
        if (!response.ok) throw new Error('更新失败');
        const updated = await response.json();
        setWorldBook(prev => prev.map(e => e.id === entry.id ? updated : e));
      }
      
      setEditingWorldBook(null);
    } catch (error) {
      console.error('保存世界书失败:', error);
      alert('保存失败');
    }
  };

  const deleteWorldBookEntry = async (id) => {
    if (!window.confirm('确定删除这条世界书吗？')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/worldbook/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('删除失败');
      setWorldBook(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('删除世界书失败:', error);
      alert('删除失败');
    }
  };

  const saveSummary = async (summary) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/summaries/${summary.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ summary: summary.summary }),
      });
      
      if (!response.ok) throw new Error('更新失败');
      const updated = await response.json();
      setMemorySummaries(prev => prev.map(s => s.id === summary.id ? updated : s));
      setEditingSummary(null);
    } catch (error) {
      console.error('更新记忆总结失败:', error);
      alert('更新失败');
    }
  };

  const deleteSummary = async (id) => {
    if (!window.confirm('确定删除这条记忆总结吗？')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/summaries/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('删除失败');
      setMemorySummaries(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('删除记忆总结失败:', error);
      alert('删除失败');
    }
  };

  const deleteAllSummaries = async () => {
    if (!window.confirm('确定删除所有记忆总结吗？')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${currentSessionConfig.id}/summaries`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('删除失败');
      setMemorySummaries([]);
    } catch (error) {
      console.error('删除所有记忆总结失败:', error);
      alert('删除失败');
    }
  };

  const clearAllMessages = async () => {
    if (!window.confirm('确定清除所有聊天记录吗？此操作不可恢复！')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${currentSessionConfig.id}/messages`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('清除失败');
      
      // 如果当前正在查看这个会话，清空消息列表
      if (currentSessionId === currentSessionConfig.id) {
        setMessages([]);
      }
      
      alert('聊天记录已清除');
    } catch (error) {
      console.error('清除聊天记录失败:', error);
      alert('清除失败');
    }
  };

  const loadSystemSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings`);
      if (!response.ok) throw new Error('加载设置失败');
      const data = await response.json();
      setSystemSettings(data);
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  const saveSystemSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(systemSettings),
      });

      if (!response.ok) throw new Error('保存设置失败');
      alert('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存失败');
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`);
      if (!response.ok) throw new Error('加载会话失败');
      
      const data = await response.json();
      setSessions(data);
      
      if (data.length > 0) {
        switchSession(data[0].id);
      } else {
        createNewSession();
      }
    } catch (error) {
      console.error('加载会话失败:', error);
    }
  };

  const switchSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
    
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
      
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
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
    if (!window.confirm('确定删除这个会话吗？')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('删除失败');

      const newSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(newSessions);
      
      if (currentSessionId === sessionId) {
        if (newSessions.length > 0) {
          switchSession(newSessions[0].id);
        } else {
          createNewSession();
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
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage, created_at: new Date().toISOString() }]);
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
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply,
        reasoning_content: data.reasoning,
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，出了点问题。稍后再试？',
        created_at: new Date().toISOString()
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

  const getCurrentSession = () => {
    return sessions.find(s => s.id === currentSessionId);
  };

  return (
    <div className="h-screen flex bg-[#1A1A1A]">
      {/* 侧边栏 */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed md:relative w-64 h-full bg-[#2A2A2A] flex flex-col border-r border-white/5 transition-transform duration-300 z-30`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <button 
            onClick={createNewSession}
            className="flex-1 flex items-center gap-2 px-4 py-2 bg-[#D4A574] text-white rounded-lg hover:bg-[#C39564] transition-colors"
          >
            <Plus size={18} />
            <span>新对话</span>
          </button>
          <button 
            onClick={() => setShowSidebar(false)}
            className="md:hidden ml-2 p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400"
          >
            <X size={20} />
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
                        loadSessionConfig(session.id);
                      }}
                      className="p-1 hover:bg-white/10 rounded"
                      title="会话设置"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSessionId(session.id);
                        setEditingName(session.name);
                      }}
                      className="p-1 hover:bg-white/10 rounded"
                      title="重命名"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="p-1 hover:bg-white/10 rounded"
                      title="删除"
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
            onClick={() => {
              setShowSettings(true);
              if (settingsTab === 'system' && !systemSettings) {
                loadSystemSettings();
              }
            }}
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-lg transition-colors text-gray-300"
          >
            <Settings size={18} />
            <span>设置</span>
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col relative">
        <div className="h-16 flex items-center justify-between px-4 md:px-6 bg-[#2A2A2A] border-b border-white/5">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSidebar(true)}
              className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400"
            >
              <Menu size={20} />
            </button>
            <div className="text-gray-200">
              {getCurrentSession()?.char_name || getCurrentSession()?.name || 'Claude'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-sm text-gray-400">
              {apiConfig.model || '未配置'}
            </div>
            <button
              onClick={() => setShowApps(true)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400"
            >
              <Grid size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
          {messages.map((msg, i) => {
            const session = getCurrentSession();
            const avatar = msg.role === 'user' ? session?.user_avatar : session?.char_avatar;
            const name = msg.role === 'user' ? session?.user_name || '我' : session?.char_name || 'Claude';
            
            return (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-start gap-2 max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-8 h-8 rounded-full flex-shrink-0" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${
                      msg.role === 'user' ? 'bg-[#D4A574]' : 'bg-[#2A2A2A]'
                    } text-white`}>
                      {name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className={`text-xs mb-1 ${msg.role === 'user' ? 'text-right' : 'text-left'} text-gray-400`}>
                      {name}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl whitespace-pre-wrap text-sm md:text-base ${
                      msg.role === 'user' 
                        ? 'bg-[#D4A574] text-white' 
                        : 'bg-[#2A2A2A] text-gray-200'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
                
                {msg.reasoning_content && (
                  <div className="max-w-[85%] md:max-w-[70%] mt-2 ml-10">
                    <button
                      onClick={() => setExpandedThinking({...expandedThinking, [i]: !expandedThinking[i]})}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <Brain size={14} />
                      <span>{expandedThinking[i] ? '收起' : '查看'}思考过程</span>
                    </button>
                    {expandedThinking[i] && (
                      <div className="mt-2 px-4 py-3 bg-[#1A1A1A] rounded-lg text-sm text-gray-400 whitespace-pre-wrap">
                        {msg.reasoning_content}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`text-xs text-gray-500 mt-1 ${msg.role === 'user' ? 'mr-10' : 'ml-10'}`}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl bg-[#2A2A2A] text-gray-200">
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

        <div className="p-4 md:p-6">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#2A2A2A] rounded-2xl border border-white/10">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="跟我说说..."
              disabled={isLoading || !currentSessionId}
              className="flex-1 bg-transparent border-0 outline-none text-gray-200 placeholder-gray-500 disabled:opacity-50 text-sm md:text-base"
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
      </div>

      {/* 移动端侧边栏遮罩 */}
      {showSidebar && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* 会话配置弹窗 */}
      {showSessionConfig && currentSessionConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#2A2A2A] rounded-xl w-full max-w-3xl my-8 border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-[#2A2A2A] z-10">
              <h2 className="text-xl text-gray-200">会话设置</h2>
              <button 
                onClick={() => setShowSessionConfig(false)}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* 头像设置 */}
              <div>
                <label className="block text-sm text-gray-300 mb-3">头像设置</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-2">CHAR（AI头像）</div>
                    <div className="flex flex-col items-center gap-2">
                      {currentSessionConfig.char_avatar ? (
                        <img src={currentSessionConfig.char_avatar} alt="CHAR" className="w-20 h-20 rounded-full" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center text-gray-500">
                          CHAR
                        </div>
                      )}
                      <input
                        ref={charAvatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'char')}
                        className="hidden"
                      />
                      <button
                        onClick={() => charAvatarInputRef.current?.click()}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-sm text-gray-300 transition-colors"
                      >
                        上传头像
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-2">USER（用户头像）</div>
                    <div className="flex flex-col items-center gap-2">
                      {currentSessionConfig.user_avatar ? (
                        <img src={currentSessionConfig.user_avatar} alt="USER" className="w-20 h-20 rounded-full" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center text-gray-500">
                          USER
                        </div>
                      )}
                      <input
                        ref={userAvatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'user')}
                        className="hidden"
                      />
                      <button
                        onClick={() => userAvatarInputRef.current?.click()}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-sm text-gray-300 transition-colors"
                      >
                        上传头像
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 昵称设置 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">CHAR NAME（AI昵称）</label>
                  <input
                    type="text"
                    value={currentSessionConfig.char_name || ''}
                    onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, char_name: e.target.value})}
                    placeholder="Claude"
                    className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">USER NAME（用户昵称）</label>
                  <input
                    type="text"
                    value={currentSessionConfig.user_name || ''}
                    onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, user_name: e.target.value})}
                    placeholder="我"
                    className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                  />
                </div>
              </div>

              {/* 用户设定 */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">用户设定 USER</label>
                <textarea
                  value={currentSessionConfig.user_setting || ''}
                  onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, user_setting: e.target.value})}
                  placeholder="描述用户的性格、喜好、背景等信息..."
                  rows={4}
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574] resize-none"
                />
              </div>

              {/* 人物设定 */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">人物设定 PERSONAL</label>
                <textarea
                  value={currentSessionConfig.character_setting || ''}
                  onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, character_setting: e.target.value})}
                  placeholder="描述AI角色的性格、说话方式、行为习惯等..."
                  rows={4}
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574] resize-none"
                />
              </div>

              {/* 世界书 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-300">世界书</label>
                  <button
                    onClick={addWorldBookEntry}
                    className="px-3 py-1 bg-[#D4A574] hover:bg-[#C39564] rounded text-sm text-white transition-colors"
                  >
                    + 添加
                  </button>
                </div>
                <div className="space-y-2">
                  {worldBook.map(entry => (
                    <div key={entry.id} className="p-3 bg-[#1A1A1A] rounded-lg">
                      {editingWorldBook?.id === entry.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingWorldBook.name}
                            onChange={(e) => setEditingWorldBook({...editingWorldBook, name: e.target.value})}
                            placeholder="名称"
                            className="w-full px-3 py-2 bg-[#2A2A2A] border border-white/10 rounded text-gray-200 outline-none focus:border-[#D4A574]"
                          />
                          <textarea
                            value={editingWorldBook.content}
                            onChange={(e) => setEditingWorldBook({...editingWorldBook, content: e.target.value})}
                            placeholder="内容"
                            rows={3}
                            className="w-full px-3 py-2 bg-[#2A2A2A] border border-white/10 rounded text-gray-200 outline-none focus:border-[#D4A574] resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveWorldBookEntry(editingWorldBook)}
                              className="px-3 py-1 bg-[#D4A574] hover:bg-[#C39564] rounded text-sm text-white transition-colors"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingWorldBook(null)}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-sm text-gray-300 transition-colors"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium text-gray-200">{entry.name}</div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingWorldBook(entry)}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                <Edit size={14} className="text-gray-400" />
                              </button>
                              <button
                                onClick={() => deleteWorldBookEntry(entry.id)}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                <Trash size={14} className="text-gray-400" />
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">{entry.content}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  {editingWorldBook?.isNew && (
                    <div className="p-3 bg-[#1A1A1A] rounded-lg space-y-2">
                      <input
                        type="text"
                        value={editingWorldBook.name}
                        onChange={(e) => setEditingWorldBook({...editingWorldBook, name: e.target.value})}
                        placeholder="名称"
                        className="w-full px-3 py-2 bg-[#2A2A2A] border border-white/10 rounded text-gray-200 outline-none focus:border-[#D4A574]"
                      />
                      <textarea
                        value={editingWorldBook.content}
                        onChange={(e) => setEditingWorldBook({...editingWorldBook, content: e.target.value})}
                        placeholder="内容"
                        rows={3}
                        className="w-full px-3 py-2 bg-[#2A2A2A] border border-white/10 rounded text-gray-200 outline-none focus:border-[#D4A574] resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveWorldBookEntry(editingWorldBook)}
                          className="px-3 py-1 bg-[#D4A574] hover:bg-[#C39564] rounded text-sm text-white transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingWorldBook(null)}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-sm text-gray-300 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                  {worldBook.length === 0 && !editingWorldBook && (
                    <div className="text-center text-gray-500 py-4">暂无世界书条目</div>
                  )}
                </div>
              </div>

              {/* 回复条数 */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">回复条数</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={currentSessionConfig.min_reply_count || 1}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val <= currentSessionConfig.max_reply_count) {
                        setCurrentSessionConfig({...currentSessionConfig, min_reply_count: val});
                      }
                    }}
                    className="w-20 px-3 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    min="1"
                    value={currentSessionConfig.max_reply_count || 5}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= currentSessionConfig.min_reply_count) {
                        setCurrentSessionConfig({...currentSessionConfig, max_reply_count: val});
                      }
                    }}
                    className="w-20 px-3 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                  />
                </div>
              </div>

              {/* 时间感知 */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSessionConfig.time_awareness || false}
                    onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, time_awareness: e.target.checked})}
                    className="w-4 h-4 rounded border-white/10 bg-[#1A1A1A] text-[#D4A574] focus:ring-[#D4A574]"
                  />
                  <span className="text-sm text-gray-300">时间感知 TIME</span>
                </label>
                <div className="text-xs text-gray-500 mt-1 ml-6">
                  勾选后，AI 将感知系统时间并据此调整回复逻辑
                </div>
              </div>

              {/* 记忆条数 */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">记忆条数 MEMORY COUNT</label>
                <input
                  type="number"
                  min="1"
                  value={currentSessionConfig.memory_count || ''}
                  onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, memory_count: e.target.value ? parseInt(e.target.value) : null})}
                  placeholder="留空表示记忆全部对话"
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                />
                <div className="text-xs text-gray-500 mt-1">
                  设置 AI 回复时参考的最近对话条数（包含双方消息）
                </div>
              </div>

              {/* 记忆总结 */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={currentSessionConfig.memory_summary_enabled || false}
                    onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, memory_summary_enabled: e.target.checked})}
                    className="w-4 h-4 rounded border-white/10 bg-[#1A1A1A] text-[#D4A574] focus:ring-[#D4A574]"
                  />
                  <span className="text-sm text-gray-300">记忆总结 MEMORY CORE</span>
                </label>
                
                {currentSessionConfig.memory_summary_enabled && (
                  <div className="space-y-3 ml-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>每</span>
                      <input
                        type="number"
                        min="1"
                        value={currentSessionConfig.memory_summary_interval || 10}
                        onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, memory_summary_interval: parseInt(e.target.value)})}
                        className="w-16 px-2 py-1 bg-[#1A1A1A] border border-white/10 rounded text-gray-200 outline-none focus:border-[#D4A574]"
                      />
                      <span>轮对话自动总结一次</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-400">已有总结</div>
                        {memorySummaries.length > 0 && (
                          <button
                            onClick={deleteAllSummaries}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            清空全部
                          </button>
                        )}
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {memorySummaries.map(summary => (
                          <div key={summary.id} className="p-3 bg-[#1A1A1A] rounded-lg">
                            {editingSummary?.id === summary.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingSummary.summary}
                                  onChange={(e) => setEditingSummary({...editingSummary, summary: e.target.value})}
                                  rows={3}
                                  className="w-full px-3 py-2 bg-[#2A2A2A] border border-white/10 rounded text-gray-200 text-sm outline-none focus:border-[#D4A574] resize-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveSummary(editingSummary)}
                                    className="px-3 py-1 bg-[#D4A574] hover:bg-[#C39564] rounded text-xs text-white transition-colors"
                                  >
                                    保存
                                  </button>
                                  <button
                                    onClick={() => setEditingSummary(null)}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-300 transition-colors"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="text-xs text-gray-500">
                                    {new Date(summary.created_at).toLocaleString('zh-CN')}
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => setEditingSummary(summary)}
                                      className="p-1 hover:bg-white/10 rounded"
                                    >
                                      <Edit size={12} className="text-gray-400" />
                                    </button>
                                    <button
                                      onClick={() => deleteSummary(summary.id)}
                                      className="p-1 hover:bg-white/10 rounded"
                                    >
                                      <Trash size={12} className="text-gray-400" />
                                    </button>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-300">{summary.summary}</div>
                              </div>
                            )}
                          </div>
                        ))}
                        {memorySummaries.length === 0 && (
                          <div className="text-center text-gray-500 py-4 text-sm">暂无记忆总结</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 清除聊天记录 */}
              <div>
                <button
                  onClick={clearAllMessages}
                  className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 font-medium transition-colors"
                >
                  清除所有聊天记录
                </button>
                <div className="text-xs text-gray-500 mt-1 text-center">
                  此操作不可恢复，请谨慎操作
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="p-6 border-t border-white/5 flex gap-3 sticky bottom-0 bg-[#2A2A2A]">
              <button
                onClick={() => setShowSessionConfig(false)}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveSessionConfig}
                className="flex-1 px-4 py-2 bg-[#D4A574] hover:bg-[#C39564] rounded-lg text-white transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 应用列表弹窗 */}
      {showApps && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] rounded-xl w-full max-w-md border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl text-gray-200">应用</h2>
              <button 
                onClick={() => setShowApps(false)}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-400 py-8">
                暂无应用
                <div className="text-sm mt-2">之后可以在这里添加音乐、日记、待办等功能</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 系统设置弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] rounded-xl w-full max-w-2xl max-h-[90vh] border border-white/10 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl text-gray-200">设置</h2>
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

            <div className="flex border-b border-white/5">
              <button
                onClick={() => setSettingsTab('api')}
                className={`flex-1 px-4 py-3 text-sm transition-colors ${
                  settingsTab === 'api'
                    ? 'text-[#D4A574] border-b-2 border-[#D4A574]'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                API 配置
              </button>
              <button
                onClick={() => {
                  setSettingsTab('system');
                  if (!systemSettings) loadSystemSettings();
                }}
                className={`flex-1 px-4 py-3 text-sm transition-colors ${
                  settingsTab === 'system'
                    ? 'text-[#D4A574] border-b-2 border-[#D4A574]'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                系统设置
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {settingsTab === 'api' ? (
                <div className="space-y-4">
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
                        placeholder="claude-3-5-sonnet-20241022"
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
              ) : (
                systemSettings ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">系统提示词</label>
                      <textarea
                        value={systemSettings.system_prompt}
                        onChange={(e) => setSystemSettings({...systemSettings, system_prompt: e.target.value})}
                        rows={6}
                        className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574] resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">温度 (0-1)</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={systemSettings.temperature}
                          onChange={(e) => setSystemSettings({...systemSettings, temperature: parseFloat(e.target.value)})}
                          className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">上下文轮数</label>
                        <input
                          type="number"
                          min="1"
                          value={systemSettings.max_context_rounds}
                          onChange={(e) => setSystemSettings({...systemSettings, max_context_rounds: parseInt(e.target.value)})}
                          className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">压缩阈值 (tokens)</label>
                        <input
                          type="number"
                          min="1000"
                          step="1000"
                          value={systemSettings.compress_threshold}
                          onChange={(e) => setSystemSettings({...systemSettings, compress_threshold: parseInt(e.target.value)})}
                          className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">压缩后保留轮数</label>
                        <input
                          type="number"
                          min="1"
                          value={systemSettings.compress_keep_rounds}
                          onChange={(e) => setSystemSettings({...systemSettings, compress_keep_rounds: parseInt(e.target.value)})}
                          className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">最大回复 tokens</label>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={systemSettings.max_reply_tokens}
                        onChange={(e) => setSystemSettings({...systemSettings, max_reply_tokens: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-200 outline-none focus:border-[#D4A574]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400">
                    加载中...
                  </div>
                )
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3">
              {settingsTab === 'api' ? (
                <>
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
                </>
              ) : (
                <button
                  onClick={saveSystemSettings}
                  className="flex-1 px-4 py-2 bg-[#D4A574] hover:bg-[#C39564] rounded-lg text-white transition-colors"
                >
                  保存系统设置
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
