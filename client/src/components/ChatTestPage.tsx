import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatTestPageProps {}

const ChatTestPage: React.FC<ChatTestPageProps> = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [responseId, setResponseId] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startChat = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/ai-chat/start');
      setResponseId(response.data.responseId);
      setCurrentQuestion(response.data.currentQuestion);
      setMessages([{ role: 'assistant', content: response.data.message }]);
    } catch (err) {
      setError('AI 채팅을 시작하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isComplete) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    // 사용자 메시지 추가
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await axios.post('/api/ai-chat/continue', {
        responseId,
        userMessage,
        currentQuestion,
        chatHistory: newMessages
      });

      setCurrentQuestion(response.data.currentQuestion);
      setMessages(response.data.chatHistory);
      setIsComplete(response.data.isComplete);

      if (response.data.isComplete) {
        // 검사 완료 시 결과 페이지로 이동
        setTimeout(() => {
          navigate(`/ai-results/${responseId}`);
        }, 2000);
      }
    } catch (err) {
      setError('메시지를 전송하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getQuestionNumber = (question: string) => {
    const questionMap: { [key: string]: number } = {
      'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4, 
      'Q5': 5, 'Q6': 6, 'Q7': 7
    };
    return questionMap[question] || 0;
  };

  const progress = currentQuestion ? (getQuestionNumber(currentQuestion) / 7) * 100 : 0;

  return (
    <div className="container">
      <div className="card" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* 헤더 */}
        <div style={{ 
          borderBottom: '1px solid #eee', 
          paddingBottom: '20px', 
          marginBottom: '20px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>AI 내적욕망 검사</h2>
            {currentQuestion && !isComplete && (
              <span style={{ color: '#666', fontSize: '14px' }}>
                {getQuestionNumber(currentQuestion)}/7
              </span>
            )}
          </div>
          
          {!isComplete && (
            <div className="progress-bar" style={{ marginTop: '15px' }}>
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* 채팅 메시지 영역 */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '20px 0',
          border: '1px solid #eee',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: '#fafafa'
        }}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '15px',
                padding: '0 20px'
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  backgroundColor: message.role === 'user' ? '#007bff' : '#fff',
                  color: message.role === 'user' ? '#fff' : '#333',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-start', 
              padding: '0 20px',
              marginBottom: '15px'
            }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                color: '#666'
              }}>
                AI가 답변을 준비하고 있습니다...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* 완료 메시지 */}
        {isComplete && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            검사가 완료되었습니다! 결과를 분석하고 있습니다...
          </div>
        )}

        {/* 입력 영역 */}
        {!isComplete && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="답변을 입력하세요..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                resize: 'none',
                fontSize: '16px',
                minHeight: '50px',
                maxHeight: '120px'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="btn"
              style={{
                padding: '12px 24px',
                borderRadius: '20px',
                minWidth: '80px'
              }}
            >
              {isLoading ? '전송중...' : '전송'}
            </button>
          </div>
        )}

        {/* 홈으로 돌아가기 버튼 */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-secondary"
            style={{ padding: '10px 20px' }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTestPage;
