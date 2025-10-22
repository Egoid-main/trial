import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BackendAnalysis {
  value: string;
  autonomy: string;
  competence: string;
  relatedness: string;
  self_actualization: string;
  flow_keywords: string[];
  abstract_motivation: string;
}

interface ChatResultsData {
  responseId: string;
  chatResponses: ChatMessage[];
  backendAnalysis: BackendAnalysis;
  desireSentence: string;
  createdAt: string;
}

const ChatResultsPage: React.FC = () => {
  const { responseId } = useParams<{ responseId: string }>();
  const [results, setResults] = useState<ChatResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    if (responseId) {
      fetchResults(responseId);
    }
  }, [responseId]);

  const fetchResults = async (id: string) => {
    try {
      const response = await axios.get(`/api/ai-chat/results/${id}`);
      setResults(response.data);
      setLoading(false);
    } catch (err) {
      setError('결과를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const getValueColor = (value: string) => {
    const colorMap: { [key: string]: string } = {
      '완전한': '#e74c3c',
      '사랑받는': '#e91e63',
      '성취하는': '#9c27b0',
      '독특한': '#673ab7',
      '유능한': '#3f51b5',
      '안정적인': '#2196f3',
      '흥미로운': '#00bcd4',
      '장악하는': '#009688',
      '평온한': '#4caf50'
    };
    return colorMap[value] || '#666';
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading">결과를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="container">
        <div className="card">
          <div className="error">{error || '결과를 찾을 수 없습니다.'}</div>
          <Link to="/" className="btn">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* 메인 결과 카드 */}
      <div className="result-card" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '20px', color: 'white' }}>
          내적욕망 검사 결과
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px' }}>
          당신의 진정한 내적 욕망을 발견했습니다
        </p>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '10px' }}>
          검사 완료일: {new Date(results.createdAt).toLocaleDateString('ko-KR')}
        </p>
      </div>

      {/* 내적욕망 문장 */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>
          당신의 내적욕망
        </h2>
        <div style={{
          fontSize: '20px',
          lineHeight: '1.6',
          fontStyle: 'italic',
          padding: '20px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          border: '2px solid rgba(255,255,255,0.2)'
        }}>
          "{results.desireSentence}"
        </div>
      </div>

      {/* 상세 분석 */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>상세 분석</h2>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowAnalysis(!showAnalysis)}
            style={{ padding: '8px 16px' }}
          >
            {showAnalysis ? '숨기기' : '자세히 보기'}
          </button>
        </div>

        {showAnalysis && (
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* 가치 */}
            <div className="trait-result">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <div 
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: getValueColor(results.backendAnalysis.value),
                    marginRight: '10px'
                  }}
                />
                <h3 style={{ margin: 0, color: '#333' }}>핵심 가치</h3>
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                color: getValueColor(results.backendAnalysis.value)
              }}>
                {results.backendAnalysis.value}
              </div>
            </div>

            {/* 자율성 */}
            <div className="trait-result">
              <h3 style={{ marginBottom: '15px', color: '#333' }}>자율성</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                {results.backendAnalysis.autonomy}
              </p>
            </div>

            {/* 유능감 */}
            <div className="trait-result">
              <h3 style={{ marginBottom: '15px', color: '#333' }}>유능감</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                {results.backendAnalysis.competence}
              </p>
            </div>

            {/* 관계성 */}
            <div className="trait-result">
              <h3 style={{ marginBottom: '15px', color: '#333' }}>관계성</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                {results.backendAnalysis.relatedness}
              </p>
            </div>

            {/* 자아실현 */}
            <div className="trait-result">
              <h3 style={{ marginBottom: '15px', color: '#333' }}>자아실현 욕구</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                {results.backendAnalysis.self_actualization}
              </p>
            </div>

            {/* 몰입 키워드 */}
            <div className="trait-result">
              <h3 style={{ marginBottom: '15px', color: '#333' }}>몰입 경험</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {results.backendAnalysis.flow_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    style={{
                      background: '#e9ecef',
                      color: '#495057',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '14px'
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* 추상적 동기 */}
            <div className="trait-result">
              <h3 style={{ marginBottom: '15px', color: '#333' }}>추상적 동기</h3>
              <p style={{ 
                color: '#666', 
                lineHeight: '1.6',
                fontStyle: 'italic',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                {results.backendAnalysis.abstract_motivation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 채팅 히스토리 */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px' }}>검사 대화 기록</h2>
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          border: '1px solid #eee',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fafafa'
        }}>
          {results.chatResponses.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '15px'
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
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link to="/ai-chat" className="btn" style={{ marginRight: '10px' }}>
          다시 검사하기
        </Link>
        <Link to="/" className="btn btn-secondary" style={{ marginRight: '10px' }}>
          홈으로
        </Link>
        <Link to="/admin" className="btn btn-secondary">
          관리자 페이지
        </Link>
      </div>
    </div>
  );
};

export default ChatResultsPage;
