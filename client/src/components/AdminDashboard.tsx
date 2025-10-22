import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Question {
  id: number;
  trait_id: number;
  question_text: string;
  trait_name: string;
  is_active: boolean;
}

interface Trait {
  id: number;
  name: string;
  description: string;
}

interface ResultType {
  id: number;
  name: string;
  description: string;
  min_percentage: number;
  max_percentage: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'questions' | 'result-types'>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [resultTypes, setResultTypes] = useState<ResultType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 질문 관리 상태
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState({ trait_id: 1, question_text: '' });

  // 결과 유형 관리 상태
  const [editingResultType, setEditingResultType] = useState<ResultType | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [questionsRes, traitsRes, resultTypesRes] = await Promise.all([
        axios.get('/api/admin/questions'),
        axios.get('/api/traits'),
        axios.get('/api/result-types')
      ]);
      
      setQuestions(questionsRes.data);
      setTraits(traitsRes.data);
      setResultTypes(resultTypesRes.data);
      setLoading(false);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/questions', newQuestion);
      setSuccess('질문이 추가되었습니다.');
      setNewQuestion({ trait_id: 1, question_text: '' });
      setShowAddQuestion(false);
      fetchData();
    } catch (err) {
      setError('질문 추가 중 오류가 발생했습니다.');
    }
  };

  const handleEditQuestion = async (question: Question) => {
    try {
      await axios.put(`/api/admin/questions/${question.id}`, question);
      setSuccess('질문이 수정되었습니다.');
      setEditingQuestion(null);
      fetchData();
    } catch (err) {
      setError('질문 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (window.confirm('정말로 이 질문을 삭제하시겠습니까?')) {
      try {
        await axios.delete(`/api/admin/questions/${id}`);
        setSuccess('질문이 삭제되었습니다.');
        fetchData();
      } catch (err) {
        setError('질문 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleEditResultType = async (resultType: ResultType) => {
    try {
      await axios.put(`/api/admin/result-types/${resultType.id}`, resultType);
      setSuccess('결과 유형이 수정되었습니다.');
      setEditingResultType(null);
      fetchData();
    } catch (err) {
      setError('결과 유형 수정 중 오류가 발생했습니다.');
    }
  };

  const toggleQuestionActive = async (question: Question) => {
    const updatedQuestion = { ...question, is_active: !question.is_active };
    await handleEditQuestion(updatedQuestion);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading">데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>관리자 대시보드</h1>
        <p>성격 특질 검사 관리 시스템</p>
        <div className="admin-nav">
          <Link to="/" className="btn btn-secondary">홈으로</Link>
          <button 
            className={`btn ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            질문 관리
          </button>
          <button 
            className={`btn ${activeTab === 'result-types' ? 'active' : ''}`}
            onClick={() => setActiveTab('result-types')}
          >
            결과 유형 관리
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {activeTab === 'questions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>질문 관리</h2>
            <button 
              className="btn" 
              onClick={() => setShowAddQuestion(!showAddQuestion)}
            >
              {showAddQuestion ? '취소' : '새 질문 추가'}
            </button>
          </div>

          {showAddQuestion && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3>새 질문 추가</h3>
              <form onSubmit={handleAddQuestion}>
                <div className="form-group">
                  <label className="form-label">특질 선택</label>
                  <select 
                    className="form-control"
                    value={newQuestion.trait_id}
                    onChange={(e) => setNewQuestion({...newQuestion, trait_id: parseInt(e.target.value)})}
                  >
                    {traits.map(trait => (
                      <option key={trait.id} value={trait.id}>
                        {trait.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">질문 내용</label>
                  <textarea 
                    className="form-control"
                    value={newQuestion.question_text}
                    onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                    rows={3}
                    placeholder="질문을 입력하세요..."
                    required
                  />
                </div>
                <button type="submit" className="btn">질문 추가</button>
              </form>
            </div>
          )}

          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>특질</th>
                  <th>질문 내용</th>
                  <th>상태</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(question => (
                  <tr key={question.id}>
                    <td>{question.id}</td>
                    <td>
                      <span className="question-trait">{question.trait_name}</span>
                    </td>
                    <td>
                      {editingQuestion?.id === question.id ? (
                        <div>
                          <textarea 
                            className="form-control"
                            value={editingQuestion.question_text}
                            onChange={(e) => setEditingQuestion({...editingQuestion, question_text: e.target.value})}
                            rows={2}
                          />
                          <select 
                            className="form-control"
                            style={{ marginTop: '10px' }}
                            value={editingQuestion.trait_id}
                            onChange={(e) => setEditingQuestion({...editingQuestion, trait_id: parseInt(e.target.value)})}
                          >
                            {traits.map(trait => (
                              <option key={trait.id} value={trait.id}>
                                {trait.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="question-text">{question.question_text}</div>
                      )}
                    </td>
                    <td>
                      <span style={{ 
                        color: question.is_active ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        {question.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>
                      <div className="question-actions">
                        {editingQuestion?.id === question.id ? (
                          <>
                            <button 
                              className="btn"
                              onClick={() => handleEditQuestion(editingQuestion)}
                            >
                              저장
                            </button>
                            <button 
                              className="btn btn-secondary"
                              onClick={() => setEditingQuestion(null)}
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn"
                              onClick={() => setEditingQuestion(question)}
                            >
                              수정
                            </button>
                            <button 
                              className="btn btn-secondary"
                              onClick={() => toggleQuestionActive(question)}
                            >
                              {question.is_active ? '비활성화' : '활성화'}
                            </button>
                            <button 
                              className="btn btn-danger"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'result-types' && (
        <div>
          <h2>결과 유형 관리</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            각 결과 유형의 범위와 설명을 수정할 수 있습니다.
          </p>

          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>유형</th>
                  <th>범위</th>
                  <th>설명</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {resultTypes.map(resultType => (
                  <tr key={resultType.id}>
                    <td>
                      {editingResultType?.id === resultType.id ? (
                        <input 
                          className="form-control"
                          value={editingResultType.name}
                          onChange={(e) => setEditingResultType({...editingResultType, name: e.target.value})}
                        />
                      ) : (
                        <strong>{resultType.name}</strong>
                      )}
                    </td>
                    <td>
                      {editingResultType?.id === resultType.id ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="number"
                            className="form-control"
                            value={editingResultType.min_percentage}
                            onChange={(e) => setEditingResultType({...editingResultType, min_percentage: parseFloat(e.target.value)})}
                            style={{ width: '80px' }}
                          />
                          <span>~</span>
                          <input 
                            type="number"
                            className="form-control"
                            value={editingResultType.max_percentage}
                            onChange={(e) => setEditingResultType({...editingResultType, max_percentage: parseFloat(e.target.value)})}
                            style={{ width: '80px' }}
                          />
                          <span>%</span>
                        </div>
                      ) : (
                        <span>{resultType.min_percentage}% ~ {resultType.max_percentage}%</span>
                      )}
                    </td>
                    <td>
                      {editingResultType?.id === resultType.id ? (
                        <textarea 
                          className="form-control"
                          value={editingResultType.description}
                          onChange={(e) => setEditingResultType({...editingResultType, description: e.target.value})}
                          rows={2}
                        />
                      ) : (
                        resultType.description
                      )}
                    </td>
                    <td>
                      {editingResultType?.id === resultType.id ? (
                        <>
                          <button 
                            className="btn"
                            onClick={() => handleEditResultType(editingResultType)}
                          >
                            저장
                          </button>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => setEditingResultType(null)}
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <button 
                          className="btn"
                          onClick={() => setEditingResultType(resultType)}
                        >
                          수정
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
