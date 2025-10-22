import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center', padding: '60px 30px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#333' }}>
          심리 검사 플랫폼
        </h1>
        <p style={{ fontSize: '20px', color: '#666', marginBottom: '40px' }}>
          성격 특질과 내적욕망을 탐구하는 두 가지 검사 방식
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/test" className="btn" style={{ fontSize: '18px', padding: '15px 30px' }}>
            성격 특질 검사
          </Link>
          <Link to="/ai-chat" className="btn" style={{ 
            fontSize: '18px', 
            padding: '15px 30px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none'
          }}>
            AI 내적욕망 검사
          </Link>
          <Link to="/admin" className="btn btn-secondary" style={{ fontSize: '18px', padding: '15px 30px' }}>
            관리자 페이지
          </Link>
        </div>
        <div style={{ marginTop: '40px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>검사 안내</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', textAlign: 'left' }}>
            <div>
              <h4 style={{ color: '#333', marginBottom: '10px' }}>📊 성격 특질 검사</h4>
              <ul style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                <li style={{ marginBottom: '6px' }}>총 10개 질문, 7점 척도 응답</li>
                <li style={{ marginBottom: '6px' }}>5가지 성격 특질 측정</li>
                <li style={{ marginBottom: '6px' }}>검사 시간: 5-10분</li>
                <li style={{ marginBottom: '6px' }}>과학적 성격 분석</li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ color: '#333', marginBottom: '10px' }}>🤖 AI 내적욕망 검사</h4>
              <ul style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                <li style={{ marginBottom: '6px' }}>AI와의 대화형 검사</li>
                <li style={{ marginBottom: '6px' }}>내적 동기와 욕망 탐색</li>
                <li style={{ marginBottom: '6px' }}>검사 시간: 10-15분</li>
                <li style={{ marginBottom: '6px' }}>개인화된 결과 문장</li>
              </ul>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
            <p style={{ color: '#1976d2', margin: 0, fontSize: '14px' }}>
              💡 정확한 결과를 위해 솔직하고 진정성 있게 답변해주세요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;


