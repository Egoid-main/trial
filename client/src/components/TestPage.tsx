import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Question {
  id: number;
  trait_id: number;
  question_text: string;
  trait_name: string;
}

interface Response {
  question_id: number;
  score: number;
}

const TestPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get('/api/questions');
      setQuestions(response.data);
      setLoading(false);
    } catch (err) {
      setError('질문을 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleScoreChange = (questionId: number, score: number) => {
    const existingResponseIndex = responses.findIndex(r => r.question_id === questionId);
    
    if (existingResponseIndex >= 0) {
      const newResponses = [...responses];
      newResponses[existingResponseIndex].score = score;
      setResponses(newResponses);
    } else {
      setResponses([...responses, { question_id: questionId, score }]);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (responses.length !== questions.length) {
      setError('모든 질문에 답변해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await axios.post('/api/submit-test', { responses });
      navigate(`/results/${response.data.responseId}`);
    } catch (err) {
      setError('검사 제출 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  };

  const getCurrentResponse = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return 0;
    
    const response = responses.find(r => r.question_id === currentQuestion.id);
    return response ? response.score : 0;
  };

  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading">질문을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="error">{error}</div>
          <button className="btn" onClick={() => window.location.reload()}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container">
      <div className="card">
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>성격 특질 검사</h2>
            <span style={{ color: '#666' }}>
              {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {currentQuestion && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ 
                background: '#e9ecef', 
                color: '#495057', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '14px' 
              }}>
                {currentQuestion.trait_name}
              </span>
            </div>
            
            <h3 style={{ marginBottom: '30px', fontSize: '20px', lineHeight: '1.5' }}>
              {currentQuestion.question_text}
            </h3>

            <div className="radio-group">
              {[1, 2, 3, 4, 5, 6, 7].map(score => (
                <div key={score} className="radio-item">
                  <input
                    type="radio"
                    id={`score-${score}`}
                    name="score"
                    value={score}
                    checked={getCurrentResponse() === score}
                    onChange={() => handleScoreChange(currentQuestion.id, score)}
                  />
                  <label htmlFor={`score-${score}`}>
                    {score}
                  </label>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                이전
              </button>
              
              {currentQuestionIndex === questions.length - 1 ? (
                <button 
                  className="btn" 
                  onClick={handleSubmit}
                  disabled={submitting || responses.length !== questions.length}
                >
                  {submitting ? '제출 중...' : '검사 완료'}
                </button>
              ) : (
                <button 
                  className="btn" 
                  onClick={handleNext}
                  disabled={getCurrentResponse() === 0}
                >
                  다음
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPage;
