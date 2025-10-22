import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

interface TraitResult {
  id: number;
  name: string;
  description: string;
  score: number;
}

interface ResultsData {
  responseId: string;
  traitResults: TraitResult[];
  responses: any[];
  createdAt: string;
}

const ResultsPage: React.FC = () => {
  const { responseId } = useParams<{ responseId: string }>();
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (responseId) {
      fetchResults(responseId);
    }
  }, [responseId]);

  const fetchResults = async (id: string) => {
    try {
      const response = await axios.get(`/api/results/${id}`);
      setResults(response.data);
      setLoading(false);
    } catch (err) {
      setError('결과를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#17a2b8';
    if (score >= 40) return '#ffc107';
    if (score >= 20) return '#fd7e14';
    return '#dc3545';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '매우 높음';
    if (score >= 60) return '높음';
    if (score >= 40) return '보통';
    if (score >= 20) return '낮음';
    return '매우 낮음';
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
      <div className="card" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '20px', color: '#333' }}>
          검사 결과
        </h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          당신의 성격 특질 분석 결과입니다
        </p>
      </div>

      <div className="result-card">
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>
          종합 결과
        </h2>
        <p style={{ fontSize: '16px', opacity: 0.9 }}>
          검사 완료일: {new Date(results.createdAt).toLocaleDateString('ko-KR')}
        </p>
      </div>

      <div style={{ display: 'grid', gap: '20px', marginTop: '30px' }}>
        {results.traitResults.map((trait) => (
          <div key={trait.id} className="trait-result">
            <div className="trait-name">{trait.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div 
                className="trait-score"
                style={{ color: getScoreColor(trait.score) }}
              >
                {trait.score.toFixed(1)}%
              </div>
              <div 
                style={{ 
                  background: getScoreColor(trait.score), 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {getScoreLabel(trait.score)}
              </div>
            </div>
            
            <div style={{ 
              width: '100%', 
              height: '8px', 
              background: '#e9ecef', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div 
                style={{ 
                  width: `${trait.score}%`, 
                  height: '100%', 
                  background: getScoreColor(trait.score),
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
            
            {trait.description && (
              <div className="trait-description">
                {trait.description}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link to="/" className="btn" style={{ marginRight: '10px' }}>
          다시 검사하기
        </Link>
        <Link to="/admin" className="btn btn-secondary">
          관리자 페이지
        </Link>
      </div>
    </div>
  );
};

export default ResultsPage;


