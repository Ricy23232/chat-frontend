import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Settings, Menu, X, RefreshCw, Edit2, Trash2, Brain, Grid, Upload, Trash, Edit, MessageCircle } from 'lucide-react';

const API_BASE_URL = 'https://chat-backend-wsuj.onrender.com';

const themes = {
  dark: {
    name: '黑金配色',
    bg: '#1A1A1A',
    secondaryBg: '#2A2A2A',
    accent: '#D4A574',
    accentHover: '#C39564',
    text: '#E5E5E5',
    textSecondary: '#9CA3AF',
    border: 'rgba(255, 255, 255, 0.05)',
    userBubble: '#D4A574',
    aiBubble: '#2A2A2A',
  },
  light: {
    name: '白黑配色',
    bg: '#F5F5F5',
    secondaryBg: '#FFFFFF',
    accent: '#2A2A2A',
    accentHover: '#3A3A3A',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    border: 'rgba(0, 0, 0, 0.1)',
    userBubble: '#2A2A2A',
    aiBubble: '#E5E5E5',
  }
};

const ChatInterface = () => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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
  const backgroundImageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const currentTheme = themes[theme];

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

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

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
      } else if (type === 'user') {
        setCurrentSessionConfig({...currentSessionConfig, user_avatar: reader.result});
      } else if (type === 'background') {
        setCurrentSessionConfig({...currentSessionConfig, background_image: reader.result});
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
      
      const wbResponse = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/worldbook`);
      if (wbResponse.ok) {
        const wbData = await wbResponse.json();
        setWorldBook(wbData);
      }
      
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
      
      setSessions(prev => prev.map(s => s.id === currentSessionConfig.id ? {...s, ...currentSessionConfig} : s));
      
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

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setIsTyping(e.target.value.length > 0);
    
    // 清除之前的定时器
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // 设置新的定时器，2秒后认为停止输入
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
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
    setIsTyping(false);
    
    // 清除定时器
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage, created_at: new Date().toISOString() }]);
    
    const session = getCurrentSession();
    const replyMode = session?.reply_mode || 'auto';
    
    // 手动回复模式：只发送消息，不自动回复
    if (replyMode === 'manual') {
      return;
    }
    
    // 自动回复（不打断）模式：等待用户停止输入
    if (replyMode === 'auto_no_interrupt') {
      const waitForTypingStop = () => {
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (!isTyping) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 500);
        });
      };
      
      await waitForTypingStop();
    }
    
    // 自动回复（可打断）模式：立即回复
    triggerAIReply(userMessage);
  };

  const triggerAIReply = async (messageContent) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${currentSessionId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageContent,
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

  const replyToMessages = async () => {
    if (isLoading || !currentSessionId) return;
    
    if (!apiConfig.baseUrl || !apiConfig.apiKey) {
      alert('请先在设置中配置 API');
      setShowSettings(true);
      return;
    }

    // 找到最后一条 AI 消息的索引
    let lastAIIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        lastAIIndex = i;
        break;
      }
    }

    // 获取最后一条 AI 消息之后的所有用户消息
    const userMessages = messages.slice(lastAIIndex + 1).filter(m => m.role === 'user');
    
    if (userMessages.length === 0) {
      alert('没有需要回复的消息');
      return;
    }

    // 使用最后一条用户消息作为触发
    const lastUserMessage = userMessages[userMessages.length - 1].content;
    triggerAIReply(lastUserMessage);
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
    <div className="h-screen flex" style={{ backgroundColor: currentTheme.bg }}>
      {/* 侧边栏 */}
      <div 
        className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed md:relative w-64 h-full flex flex-col transition-transform duration-300 z-30`}
        style={{ 
          backgroundColor: currentTheme.secondaryBg,
          borderRight: `1px solid ${currentTheme.border}`
        }}
      >
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
          <button 
            onClick={createNewSession}
            className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: currentTheme.accent,
              color: theme === 'dark' ? '#FFFFFF' : '#FFFFFF'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.accentHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.accent}
          >
            <Plus size={18} />
            <span>新对话</span>
          </button>
          <button 
            onClick={() => setShowSidebar(false)}
            className="md:hidden ml-2 p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: currentTheme.textSecondary }}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`group px-3 py-2 rounded-lg mb-1 cursor-pointer transition-colors`}
              style={{
                backgroundColor: currentSessionId === session.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: currentSessionId === session.id ? currentTheme.text : currentTheme.textSecondary
              }}
              onMouseEnter={(e) => {
                if (currentSessionId !== session.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentSessionId !== session.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
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
                  style={{ color: currentTheme.text }}
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

        <div className="p-4" style={{ borderTop: `1px solid ${currentTheme.border}` }}>
          <button 
            onClick={() => {
              setShowSettings(true);
              if (settingsTab === 'system' && !systemSettings) {
                loadSystemSettings();
              }
            }}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: currentTheme.text }}
          >
            <Settings size={18} />
            <span>设置</span>
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col relative">
        <div 
          className="h-16 flex items-center justify-between px-4 md:px-6"
          style={{ 
            backgroundColor: currentTheme.secondaryBg,
            borderBottom: `1px solid ${currentTheme.border}`
          }}
        >
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSidebar(true)}
              className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: currentTheme.textSecondary }}
            >
              <Menu size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-sm" style={{ color: currentTheme.textSecondary }}>
              {apiConfig.model || '未配置'}
            </div>
            <button
              onClick={() => setShowApps(true)}
              className="p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: currentTheme.textSecondary }}
            >
              <Grid size={20} />
            </button>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4"
          style={{
            backgroundImage: getCurrentSession()?.background_image ? `url(${getCurrentSession().background_image})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
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
                    <div 
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: msg.role === 'user' ? currentTheme.accent : currentTheme.secondaryBg,
                        color: theme === 'dark' ? '#FFFFFF' : (msg.role === 'user' ? '#FFFFFF' : currentTheme.text)
                      }}
                    >
                      {name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div 
                      className={`text-xs mb-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                      style={{ color: currentTheme.textSecondary }}
                    >
                      {name}
                    </div>
                    <div 
                      className="px-4 py-3 rounded-2xl whitespace-pre-wrap text-sm md:text-base"
                      style={{
                        backgroundColor: msg.role === 'user' ? currentTheme.userBubble : currentTheme.aiBubble,
                        color: msg.role === 'user' 
                          ? (theme === 'dark' ? '#FFFFFF' : '#FFFFFF')
                          : (theme === 'dark' ? '#E5E5E5' : '#1A1A1A')
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
                
                {msg.reasoning_content && (
                  <div className="max-w-[85%] md:max-w-[70%] mt-2 ml-10">
                    <button
                      onClick={() => setExpandedThinking({...expandedThinking, [i]: !expandedThinking[i]})}
                      className="flex items-center gap-2 text-sm transition-colors"
                      style={{ color: currentTheme.textSecondary }}
                    >
                      <Brain size={14} />
                      <span>{expandedThinking[i] ? '收起' : '查看'}思考过程</span>
                    </button>
                    {expandedThinking[i] && (
                      <div 
                        className="mt-2 px-4 py-3 rounded-lg text-sm whitespace-pre-wrap"
                        style={{
                          backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                          color: currentTheme.textSecondary
                        }}
                      >
                        {msg.reasoning_content}
                      </div>
                    )}
                  </div>
                )}
                
                <div 
                  className={`text-xs mt-1 ${msg.role === 'user' ? 'mr-10' : 'ml-10'}`}
                  style={{ color: currentTheme.textSecondary, opacity: 0.6 }}
                >
                  {formatTime(msg.created_at)}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div 
                className="max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl"
                style={{
                  backgroundColor: currentTheme.aiBubble,
                  color: theme === 'dark' ? '#E5E5E5' : '#1A1A1A'
                }}
              >
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: currentTheme.textSecondary, animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: currentTheme.textSecondary, animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: currentTheme.textSecondary, animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 md:p-6">
          <div 
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              backgroundColor: currentTheme.secondaryBg,
              border: `1px solid ${currentTheme.border}`
            }}
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="跟我说说..."
              disabled={isLoading || !currentSessionId}
              className="flex-1 bg-transparent border-0 outline-none text-sm md:text-base disabled:opacity-50"
              style={{ 
                color: currentTheme.text,
                caretColor: currentTheme.accent
              }}
            />
            {getCurrentSession()?.reply_mode === 'manual' && (
              <button 
                onClick={replyToMessages}
                disabled={isLoading || !currentSessionId}
                className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
                title="回复"
              >
                <MessageCircle size={20} style={{ color: currentTheme.accent }} />
              </button>
            )}
            <button 
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !currentSessionId}
              className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
            >
              <Send size={20} style={{ color: currentTheme.accent }} />
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
          <div 
            className="rounded-xl w-full max-w-3xl my-8"
            style={{
              backgroundColor: currentTheme.secondaryBg,
              border: `1px solid ${currentTheme.border}`
            }}
          >
            <div 
              className="flex items-center justify-between p-6 sticky top-0 z-10"
              style={{ 
                backgroundColor: currentTheme.secondaryBg,
                borderBottom: `1px solid ${currentTheme.border}`
              }}
            >
              <h2 className="text-xl" style={{ color: currentTheme.text }}>会话设置</h2>
              <button 
                onClick={() => setShowSessionConfig(false)}
                className="p-1 rounded-lg transition-colors hover:bg-white/5"
              >
                <X size={20} style={{ color: currentTheme.textSecondary }} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* 头像设置 */}
              <div>
                <label className="block text-sm mb-3" style={{ color: currentTheme.text }}>头像设置</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs mb-2" style={{ color: currentTheme.textSecondary }}>CHAR（AI头像）</div>
                    <div className="flex flex-col items-center gap-2">
                      {currentSessionConfig.char_avatar ? (
                        <img src={currentSessionConfig.char_avatar} alt="CHAR" className="w-20 h-20 rounded-full" />
                      ) : (
                        <div 
                          className="w-20 h-20 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5',
                            color: currentTheme.textSecondary
                          }}
                        >
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
                        className="px-3 py-1 rounded text-sm transition-colors"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: currentTheme.text
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                      >
                        上传头像
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs mb-2" style={{ color: currentTheme.textSecondary }}>USER（用户头像）</div>
                    <div className="flex flex-col items-center gap-2">
                      {currentSessionConfig.user_avatar ? (
                        <img src={currentSessionConfig.user_avatar} alt="USER" className="w-20 h-20 rounded-full" />
                      ) : (
                        <div 
                          className="w-20 h-20 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5',
                            color: currentTheme.textSecondary
                          }}
                        >
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
                        className="px-3 py-1 rounded text-sm transition-colors"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: currentTheme.text
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                      >
                        上传头像
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 背景图设置 */}
              <div>
                <label className="block text-sm mb-3" style={{ color: currentTheme.text }}>聊天背景</label>
                <div className="flex flex-col items-center gap-2">
                  {currentSessionConfig.background_image ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden">
                      <img src={currentSessionConfig.background_image} alt="背景" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setCurrentSessionConfig({...currentSessionConfig, background_image: null})}
                        className="absolute top-2 right-2 p-1 rounded bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-32 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5',
                        color: currentTheme.textSecondary
                      }}
                    >
                      暂无背景图
                    </div>
                  )}
                  <input
                    ref={backgroundImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'background')}
                    className="hidden"
                  />
                  <button
                    onClick={() => backgroundImageInputRef.current?.click()}
                    className="px-4 py-2 rounded transition-colors"
                    style={{
                      backgroundColor: currentTheme.accent,
                      color: theme === 'dark' ? '#FFFFFF' : '#FFFFFF'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.accentHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.accent}
                  >
                    上传背景图
                  </button>
                </div>
              </div>

              {/* 昵称设置 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>CHAR NAME（AI昵称）</label>
                  <input
                    type="text"
                    value={currentSessionConfig.char_name || ''}
                    onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, char_name: e.target.value})}
                    placeholder="Claude"
                    className="w-full px-4 py-2 rounded-lg outline-none"
                    style={{
                      backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                      border: `1px solid ${currentTheme.border}`,
                      color: currentTheme.text
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>USER NAME（用户昵称）</label>
                  <input
                    type="text"
                    value={currentSessionConfig.user_name || ''}
                    onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, user_name: e.target.value})}
                    placeholder="我"
                    className="w-full px-4 py-2 rounded-lg outline-none"
                    style={{
                      backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                      border: `1px solid ${currentTheme.border}`,
                      color: currentTheme.text
                    }}
                  />
                </div>
              </div>

              {/* 角色回复模式 */}
              <div>
                <label className="block text-sm mb-3" style={{ color: currentTheme.text }}>角色回复模式</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg transition-colors hover:bg-white/5">
                    <input
                      type="radio"
                      name="reply_mode"
                      value="manual"
                      checked={currentSessionConfig.reply_mode === 'manual'}
                      onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, reply_mode: e.target.value})}
                      className="w-4 h-4"
                      style={{ accentColor: currentTheme.accent }}
                    />
                    <div>
                      <div className="text-sm" style={{ color: currentTheme.text }}>手动回复</div>
                      <div className="text-xs" style={{ color: currentTheme.textSecondary }}>用户发消息后不会自动回复，需点击回复按钮</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg transition-colors hover:bg-white/5">
                    <input
                      type="radio"
                      name="reply_mode"
                      value="auto"
                      checked={!currentSessionConfig.reply_mode || currentSessionConfig.reply_mode === 'auto'}
                      onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, reply_mode: e.target.value})}
                      className="w-4 h-4"
                      style={{ accentColor: currentTheme.accent }}
                    />
                    <div>
                      <div className="text-sm" style={{ color: currentTheme.text }}>自动回复（可打断）</div>
                      <div className="text-xs" style={{ color: currentTheme.textSecondary }}>用户发消息后立即自动回复，即使用户正在输入也会回复</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg transition-colors hover:bg-white/5">
                    <input
                      type="radio"
                      name="reply_mode"
                      value="auto_no_interrupt"
                      checked={currentSessionConfig.reply_mode === 'auto_no_interrupt'}
                      onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, reply_mode: e.target.value})}
                      className="w-4 h-4"
                      style={{ accentColor: currentTheme.accent }}
                    />
                    <div>
                      <div className="text-sm" style={{ color: currentTheme.text }}>自动回复（不打断）</div>
                      <div className="text-xs" style={{ color: currentTheme.textSecondary }}>用户发消息后会自动回复，但会等待用户停止输入</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 用户设定 */}
              <div>
                <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>用户设定 USER</label>
                <textarea
                  value={currentSessionConfig.user_setting || ''}
                  onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, user_setting: e.target.value})}
                  placeholder="描述用户的性格、喜好、背景等信息..."
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg outline-none resize-none"
                  style={{
                    backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text
                  }}
                />
              </div>

              {/* 人物设定 */}
              <div>
                <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>人物设定 PERSONAL</label>
                <textarea
                  value={currentSessionConfig.character_setting || ''}
                  onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, character_setting: e.target.value})}
                  placeholder="描述AI角色的性格、说话方式、行为习惯等..."
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg outline-none resize-none"
                  style={{
                    backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text
                  }}
                />
              </div>

              {/* 世界书 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm" style={{ color: currentTheme.text }}>世界书</label>
                  <button
                    onClick={addWorldBookEntry}
                    className="px-3 py-1 rounded text-sm transition-colors"
                    style={{
                      backgroundColor: currentTheme.accent,
                      color: theme === 'dark' ? '#FFFFFF' : '#FFFFFF'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.accentHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.accent}
                  >
                    + 添加
                  </button>
                </div>
                <div className="space-y-2">
                  {worldBook.map(entry => (
                    <div 
                      key={entry.id} 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5' }}
                    >
                      {editingWorldBook?.id === entry.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingWorldBook.name}
                            onChange={(e) => setEditingWorldBook({...editingWorldBook, name: e.target.value})}
                            placeholder="名称"
                            className="w-full px-3 py-2 rounded outline-none"
                            style={{
                              backgroundColor: currentTheme.secondaryBg,
                              border: `1px solid ${currentTheme.border}`,
                              color: currentTheme.text
                            }}
                          />
                          <textarea
                            value={editingWorldBook.content}
                            onChange={(e) => setEditingWorldBook({...editingWorldBook, content: e.target.value})}
                            placeholder="内容"
                            rows={3}
                            className="w-full px-3 py-2 rounded outline-none resize-none"
                            style={{
                              backgroundColor: currentTheme.secondaryBg,
                              border: `1px solid ${currentTheme.border}`,
                              color: currentTheme.text
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveWorldBookEntry(editingWorldBook)}
                              className="px-3 py-1 rounded text-sm transition-colors"
                              style={{
                                backgroundColor: currentTheme.accent,
                                color: theme === 'dark' ? '#FFFFFF' : '#FFFFFF'
                              }}
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingWorldBook(null)}
                              className="px-3 py-1 rounded text-sm transition-colors"
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: currentTheme.text
                              }}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium" style={{ color: currentTheme.text }}>{entry.name}</div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingWorldBook(entry)}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                <Edit size={14} style={{ color: currentTheme.textSecondary }} />
                              </button>
                              <button
                                onClick={() => deleteWorldBookEntry(entry.id)}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                <Trash size={14} style={{ color: currentTheme.textSecondary }} />
                              </button>
                            </div>
                          </div>
                          <div className="text-sm" style={{ color: currentTheme.textSecondary }}>{entry.content}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  {editingWorldBook?.isNew && (
                    <div 
                      className="p-3 rounded-lg space-y-2"
                      style={{ backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5' }}
                    >
                      <input
                        type="text"
                        value={editingWorldBook.name}
                        onChange={(e) => setEditingWorldBook({...editingWorldBook, name: e.target.value})}
                        placeholder="名称"
                        className="w-full px-3 py-2 rounded outline-none"
                        style={{
                          backgroundColor: currentTheme.secondaryBg,
                          border: `1px solid ${currentTheme.border}`,
                          color: currentTheme.text
                        }}
                      />
                      <textarea
                        value={editingWorldBook.content}
                        onChange={(e) => setEditingWorldBook({...editingWorldBook, content: e.target.value})}
                        placeholder="内容"
                        rows={3}
                        className="w-full px-3 py-2 rounded outline-none resize-none"
                        style={{
                          backgroundColor: currentTheme.secondaryBg,
                          border: `1px solid ${currentTheme.border}`,
                          color: currentTheme.text
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveWorldBookEntry(editingWorldBook)}
                          className="px-3 py-1 rounded text-sm transition-colors"
                          style={{
                            backgroundColor: currentTheme.accent,
                            color: theme === 'dark' ? '#FFFFFF' : '#FFFFFF'
                          }}
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingWorldBook(null)}
                          className="px-3 py-1 rounded text-sm transition-colors"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: currentTheme.text
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                  {worldBook.length === 0 && !editingWorldBook && (
                    <div className="text-center py-4" style={{ color: currentTheme.textSecondary }}>暂无世界书条目</div>
                  )}
                </div>
              </div>

              {/* 回复条数 */}
              <div>
                <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>回复条数</label>
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
                    className="w-20 px-3 py-2 rounded-lg outline-none"
                    style={{
                      backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                      border: `1px solid ${currentTheme.border}`,
                      color: currentTheme.text
                    }}
                  />
                  <span style={{ color: currentTheme.textSecondary }}>-</span>
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
                    className="w-20 px-3 py-2 rounded-lg outline-none"
                    style={{
                      backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                      border: `1px solid ${currentTheme.border}`,
                      color: currentTheme.text
                    }}
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
                    className="w-4 h-4 rounded"
                    style={{ accentColor: currentTheme.accent }}
                  />
                  <span className="text-sm" style={{ color: currentTheme.text }}>时间感知 TIME</span>
                </label>
                <div className="text-xs mt-1 ml-6" style={{ color: currentTheme.textSecondary }}>
                  勾选后，AI 将感知系统时间并据此调整回复逻辑
                </div>
              </div>

              {/* 记忆条数 */}
              <div>
                <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>记忆条数 MEMORY COUNT</label>
                <input
                  type="number"
                  min="1"
                  value={currentSessionConfig.memory_count || ''}
                  onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, memory_count: e.target.value ? parseInt(e.target.value) : null})}
                  placeholder="留空表示记忆全部对话"
                  className="w-full px-4 py-2 rounded-lg outline-none"
                  style={{
                    backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text
                  }}
                />
                <div className="text-xs mt-1" style={{ color: currentTheme.textSecondary }}>
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
                    className="w-4 h-4 rounded"
                    style={{ accentColor: currentTheme.accent }}
                  />
                  <span className="text-sm" style={{ color: currentTheme.text }}>记忆总结 MEMORY CORE</span>
                </label>
                
                {currentSessionConfig.memory_summary_enabled && (
                  <div className="space-y-3 ml-6">
                    <div className="flex items-center gap-2 text-sm" style={{ color: currentTheme.textSecondary }}>
                      <span>每</span>
                      <input
                        type="number"
                        min="1"
                        value={currentSessionConfig.memory_summary_interval || 10}
                        onChange={(e) => setCurrentSessionConfig({...currentSessionConfig, memory_summary_interval: parseInt(e.target.value)})}
                        className="w-16 px-2 py-1 rounded outline-none"
                        style={{
                          backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                          border: `1px solid ${currentTheme.border}`,
                          color: currentTheme.text
                        }}
                      />
                      <span>轮对话自动总结一次</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm" style={{ color: currentTheme.textSecondary }}>已有总结</div>
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
                          <div 
                            key={summary.id} 
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5' }}
                          >
                            {editingSummary?.id === summary.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingSummary.summary}
                                  onChange={(e) => setEditingSummary({...editingSummary, summary: e.target.value})}
                                  rows={3}
                                  className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
                                  style={{
                                    backgroundColor: currentTheme.secondaryBg,
                                    border: `1px solid ${currentTheme.border}`,
                                    color: currentTheme.text
                                  }}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveSummary(editingSummary)}
                                    className="px-3 py-1 rounded text-xs transition-colors"
                                    style={{
                                      backgroundColor: currentTheme.accent,
                                      color: theme === 'dark' ? '#FFFFFF' : '#FFFFFF'
                                    }}
                                  >
                                    保存
                                  </button>
                                  <button
                                    onClick={() => setEditingSummary(null)}
                                    className="px-3 py-1 rounded text-xs transition-colors"
                                    style={{
                                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                      color: currentTheme.text
                                    }}
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="text-xs" style={{ color: currentTheme.textSecondary }}>
                                    {new Date(summary.created_at).toLocaleString('zh-CN')}
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => setEditingSummary(summary)}
                                      className="p-1 hover:bg-white/10 rounded"
                                    >
                                      <Edit size={12} style={{ color: currentTheme.textSecondary }} />
                                    </button>
                                    <button
                                      onClick={() => deleteSummary(summary.id)}
                                      className="p-1 hover:bg-white/10 rounded"
                                    >
                                      <Trash size={12} style={{ color: currentTheme.textSecondary }} />
                                    </button>
                                  </div>
                                </div>
                                <div className="text-sm" style={{ color: currentTheme.text }}>{summary.summary}</div>
                              </div>
                            )}
                          </div>
                        ))}
                        {memorySummaries.length === 0 && (
                          <div className="text-center py-4 text-sm" style={{ color: currentTheme.textSecondary }}>暂无记忆总结</div>
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
                  className="w-full px-4 py-3 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                >
                  清除所有聊天记录
                </button>
                <div className="text-xs text-center mt-1" style={{ color: currentTheme.textSecondary }}>
                  此操作不可恢复，请谨慎操作
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div 
              className="p-6 flex gap-3 sticky bottom-0"
              style={{ 
                backgroundColor: currentTheme.secondaryBg,
                borderTop: `1px solid ${currentTheme.border}`
              }}
            >
              <button
                onClick={() => setShowSessionConfig(false)}
                className="flex-1 px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: currentTheme.text
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
              >
                取消
              </button>
              <button
                onClick={saveSessionConfig}
                className="flex-1 px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: currentTheme.accent,
                  color: theme === 'dark' ? '#FFFFFF' : '#FFFFFF'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.accentHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.accent}
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
          <div 
            className="rounded-xl w-full max-w-md"
            style={{
              backgroundColor: currentTheme.secondaryBg,
              border: `1px solid ${currentTheme.border}`
            }}
          >
            <div 
              className="flex items-center justify-between p-6"
              style={{ borderBottom: `1px solid ${currentTheme.border}` }}
            >
              <h2 className="text-xl" style={{ color: currentTheme.text }}>应用</h2>
              <button 
                onClick={() => setShowApps(false)}
                className="p-1 rounded-lg transition-colors hover:bg-white/5"
              >
                <X size={20} style={{ color: currentTheme.textSecondary }} />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center py-8" style={{ color: currentTheme.textSecondary }}>
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
          <div 
            className="rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            style={{
              backgroundColor: currentTheme.secondaryBg,
              border: `1px solid ${currentTheme.border}`
            }}
          >
            <div 
              className="flex items-center justify-between p-6"
              style={{ borderBottom: `1px solid ${currentTheme.border}` }}
            >
              <h2 className="text-xl" style={{ color: currentTheme.text }}>设置</h2>
              <button 
                onClick={() => {
                  setShowSettings(false);
                  setTestResult(null);
                }}
                className="p-1 rounded-lg transition-colors hover:bg-white/5"
              >
                <X size={20} style={{ color: currentTheme.textSecondary }} />
              </button>
            </div>

            <div className="flex" style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
              <button
                onClick={() => setSettingsTab('api')}
                className={`flex-1 px-4 py-3 text-sm transition-colors`}
                style={{
                  color: settingsTab === 'api' ? currentTheme.accent : currentTheme.textSecondary,
                  borderBottom: settingsTab === 'api' ? `2px solid ${currentTheme.accent}` : 'none'
                }}
              >
                API 配置
              </button>
              <button
                onClick={() => {
                  setSettingsTab('system');
                  if (!systemSettings) loadSystemSettings();
                }}
                className={`flex-1 px-4 py-3 text-sm transition-colors`}
                style={{
                  color: settingsTab === 'system' ? currentTheme.accent : currentTheme.textSecondary,
                  borderBottom: settingsTab === 'system' ? `2px solid ${currentTheme.accent}` : 'none'
                }}
              >
                系统设置
              </button>
              <button
                onClick={() => setSettingsTab('appearance')}
                className={`flex-1 px-4 py-3 text-sm transition-colors`}
                style={{
                  color: settingsTab === 'appearance' ? currentTheme.accent : currentTheme.textSecondary,
                  borderBottom: settingsTab === 'appearance' ? `2px solid ${currentTheme.accent}` : 'none'
                }}
              >
                外观设置
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {settingsTab === 'api' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>API 地址</label>
                    <input
                      type="text"
                      value={apiConfig.baseUrl}
                      onChange={(e) => setApiConfig({...apiConfig, baseUrl: e.target.value})}
                      placeholder="https://api.example.com/v1"
                      className="w-full px-4 py-2 rounded-lg outline-none"
                      style={{
                        backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                        border: `1px solid ${currentTheme.border}`,
                        color: currentTheme.text
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>API Key</label>
                    <input
                      type="password"
                      value={apiConfig.apiKey}
                      onChange={(e) => setApiConfig({...apiConfig, apiKey: e.target.value})}
                      placeholder="sk-..."
                      className="w-full px-4 py-2 rounded-lg outline-none"
                      style={{
                        backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                        border: `1px solid ${currentTheme.border}`,
                        color: currentTheme.text
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm" style={{ color: currentTheme.text }}>模型</label>
                      <button
                        onClick={fetchModels}
                        disabled={isLoadingModels}
                        className="flex items-center gap-1 text-sm transition-colors disabled:opacity-50"
                        style={{ color: currentTheme.accent }}
                      >
                        <RefreshCw size={14} className={isLoadingModels ? 'animate-spin' : ''} />
                        <span>获取列表</span>
                      </button>
                    </div>
                    
                    {availableModels.length > 0 ? (
                      <select
                        value={apiConfig.model}
                        onChange={(e) => setApiConfig({...apiConfig, model: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg outline-none"
                        style={{
                          backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                          border: `1px solid ${currentTheme.border}`,
                          color: currentTheme.text
                        }}
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
                        className="w-full px-4 py-2 rounded-lg outline-none"
                        style={{
                          backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                          border: `1px solid ${currentTheme.border}`,
                          color: currentTheme.text
                        }}
                      />
                    )}
                  </div>

                  {testResult && (
                    <div 
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: testResult.success ? '#22C55E' : '#EF4444'
                      }}
                    >
                      {testResult.message}
                    </div>
                  )}
                </div>
              ) : settingsTab === 'system' ? (
                systemSettings ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>系统提示词</label>
                      <textarea
                        value={systemSettings.system_prompt}
                        onChange={(e) => setSystemSettings({...systemSettings, system_prompt: e.target.value})}
                        rows={6}
                        className="w-full px-4 py-2 rounded-lg outline-none resize-none"
                        style={{
                          backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                          border: `1px solid ${currentTheme.border}`,
                          color: currentTheme.text
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>温度 (0-1)</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={systemSettings.temperature}
                          onChange={(e) => setSystemSettings({...systemSettings, temperature: parseFloat(e.target.value)})}
                          className="w-full px-4 py-2 rounded-lg outline-none"
                          style={{
                            backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                            border: `1px solid ${currentTheme.border}`,
                            color: currentTheme.text
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>上下文轮数</label>
                        <input
                          type="number"
                          min="1"
                          value={systemSettings.max_context_rounds}
                          onChange={(e) => setSystemSettings({...systemSettings, max_context_rounds: parseInt(e.target.value)})}
                          className="w-full px-4 py-2 rounded-lg outline-none"
                          style={{
                            backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                            border: `1px solid ${currentTheme.border}`,
                            color: currentTheme.text
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>压缩阈值 (tokens)</label>
                        <input
                          type="number"
                          min="1000"
                          step="1000"
                          value={systemSettings.compress_threshold}
                          onChange={(e) => setSystemSettings({...systemSettings, compress_threshold: parseInt(e.target.value)})}
                          className="w-full px-4 py-2 rounded-lg outline-none"
                          style={{
                            backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                            border: `1px solid ${currentTheme.border}`,
                            color: currentTheme.text
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>压缩后保留轮数</label>
                        <input
                          type="number"
                          min="1"
                          value={systemSettings.compress_keep_rounds}
                          onChange={(e) => setSystemSettings({...systemSettings, compress_keep_rounds: parseInt(e.target.value)})}
                          className="w-full px-4 py-2 rounded-lg outline-none"
                          style={{
                            backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                            border: `1px solid ${currentTheme.border}`,
                            color: currentTheme.text
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm mb-2" style={{ color: currentTheme.text }}>最大回复 tokens</label>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={systemSettings.max_reply_tokens}
                        onChange={(e) => setSystemSettings({...systemSettings, max_reply_tokens: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 rounded-lg outline-none"
                        style={{
                          backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
                          border: `1px solid ${currentTheme.border}`,
                          color: currentTheme.text
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32" style={{ color: currentTheme.textSecondary }}>
                    加载中...
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-3" style={{ color: currentTheme.text }}>主题配色</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(themes).map(([key, themeConfig]) => (
                        <button
                          key={key}
                          onClick={() => changeTheme(key)}
                          className="p-4 rounded-lg transition-all"
                          style={{
                            backgroundColor: theme === key ? currentTheme.accent : 'rgba(255, 255, 255, 0.05)',
                            border: `2px solid ${theme === key ? currentTheme.accent : currentTheme.border}`,
                            color: theme === key ? (key === 'dark' ? '#FFFFFF' : '#FFFFFF') : currentTheme.text
                          }}
                        >
                          <div className="font-medium mb-2">{themeConfig.name}</div>
                          <div className="flex gap-2">
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: themeConfig.bg }}></div>
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: themeConfig.secondaryBg }}></div>
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: themeConfig.accent }}></div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div 
              className="p-6 flex gap-3"
              style={{ borderTop: `1px solid ${currentTheme.border}` }}
            >
              {settingsTab === 'api' ? (
                <>
                  <button
                    onClick={testConnection}
                    disabled={isTesting}
                    className="flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: currentTheme.text
                    }}
                    onMouseEnter={(e) => !isTesting && (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                  >
                    {isTesting ? '测试中...' : '测试连接'}
                  </button>
                  <button
                    onClick={saveApiConfig}
                    className="flex-1 px-4 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: currentTheme.accent,
                      color: theme === 'dark' ? '#FFFFFF' : '#FFFFFF'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.accentHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.accent}
                  >
                    保存 API 配置
                  </button>
                </>
              ) : settingsTab === 'system' ? (
                <button
                  onClick={saveSystemSettings}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: currentTheme.accent,
                    color: theme === 'dark' ? '#FFFFFF' : '#FFFFFF'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.accentHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.accent}
                >
                  保存系统设置
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
