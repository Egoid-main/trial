import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center', padding: '60px 30px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#333' }}>
          성격 특질 검사
        </h1>
        <p style={{ fontSize: '20px', color: '#666', marginBottom: '40px' }}>
          당신의 성격 특질을 알아보는 과학적인 검사입니다
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/test" className="btn" style={{ fontSize: '18px', padding: '15px 30px' }}>
            검사 시작하기
          </Link>
          <Link to="/admin" className="btn btn-secondary" style={{ fontSize: '18px', padding: '15px 30px' }}>
            관리자 페이지
          </Link>
        </div>
        <div style={{ marginTop: '40px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>검사 안내</h3>
          <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto', color: '#666' }}>
            <li style={{ marginBottom: '8px' }}>총 10개의 질문에 대해 7점 척도로 응답해주세요</li>
            <li style={{ marginBottom: '8px' }}>각 질문은 5가지 성격 특질 중 하나를 측정합니다</li>
            <li style={{ marginBottom: '8px' }}>검사 시간은 약 5-10분 소요됩니다</li>
            <li style={{ marginBottom: '8px' }}>정확한 결과를 위해 솔직하게 답변해주세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
