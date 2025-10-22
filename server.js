const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// 데이터베이스 초기화
const db = new sqlite3.Database('./personality_test.db');

// 테이블 생성
db.serialize(() => {
  // 특질 테이블
  db.run(`CREATE TABLE IF NOT EXISTS traits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 질문 테이블
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trait_id INTEGER,
    question_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trait_id) REFERENCES traits (id)
  )`);

  // 결과 유형 테이블
  db.run(`CREATE TABLE IF NOT EXISTS result_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    min_percentage REAL NOT NULL,
    max_percentage REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 사용자 응답 테이블
  db.run(`CREATE TABLE IF NOT EXISTS user_responses (
    id TEXT PRIMARY KEY,
    responses TEXT NOT NULL,
    trait_scores TEXT NOT NULL,
    result_type_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (result_type_id) REFERENCES result_types (id)
  )`);

  // 기본 데이터 삽입
  db.run(`INSERT OR IGNORE INTO traits (id, name, description) VALUES 
    (1, '외향성', '사람들과의 상호작용을 즐기는 정도'),
    (2, '신경성', '감정적 안정성의 정도'),
    (3, '성실성', '계획적이고 체계적인 정도'),
    (4, '개방성', '새로운 경험에 대한 개방성'),
    (5, '친화성', '타인과의 협력과 신뢰의 정도')`);

  db.run(`INSERT OR IGNORE INTO result_types (id, name, description, min_percentage, max_percentage) VALUES 
    (1, '매우 낮음', '해당 특질이 매우 낮은 수준', 0, 20),
    (2, '낮음', '해당 특질이 낮은 수준', 20, 40),
    (3, '보통', '해당 특질이 보통 수준', 40, 60),
    (4, '높음', '해당 특질이 높은 수준', 60, 80),
    (5, '매우 높음', '해당 특질이 매우 높은 수준', 80, 100)`);

  // 기본 질문들 삽입
  const defaultQuestions = [
    { trait_id: 1, question_text: '나는 새로운 사람들과 만나는 것을 즐긴다.' },
    { trait_id: 1, question_text: '나는 큰 그룹에서 이야기하는 것을 좋아한다.' },
    { trait_id: 2, question_text: '나는 자주 걱정한다.' },
    { trait_id: 2, question_text: '나는 스트레스를 받으면 쉽게 화가 난다.' },
    { trait_id: 3, question_text: '나는 계획을 세우는 것을 좋아한다.' },
    { trait_id: 3, question_text: '나는 마감일을 잘 지킨다.' },
    { trait_id: 4, question_text: '나는 새로운 아이디어에 열려있다.' },
    { trait_id: 4, question_text: '나는 창의적인 활동을 즐긴다.' },
    { trait_id: 5, question_text: '나는 다른 사람들을 신뢰한다.' },
    { trait_id: 5, question_text: '나는 다른 사람들과 협력하는 것을 좋아한다.' }
  ];

  const stmt = db.prepare(`INSERT OR IGNORE INTO questions (trait_id, question_text) VALUES (?, ?)`);
  defaultQuestions.forEach(q => {
    stmt.run(q.trait_id, q.question_text);
  });
  stmt.finalize();
});

// API 라우트들

// 모든 특질 가져오기
app.get('/api/traits', (req, res) => {
  db.all('SELECT * FROM traits ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 활성 질문들 가져오기
app.get('/api/questions', (req, res) => {
  db.all(`
    SELECT q.*, t.name as trait_name 
    FROM questions q 
    JOIN traits t ON q.trait_id = t.id 
    WHERE q.is_active = 1 
    ORDER BY q.trait_id, q.id
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 모든 질문들 가져오기 (관리자용)
app.get('/api/admin/questions', (req, res) => {
  db.all(`
    SELECT q.*, t.name as trait_name 
    FROM questions q 
    JOIN traits t ON q.trait_id = t.id 
    ORDER BY q.trait_id, q.id
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 질문 추가
app.post('/api/admin/questions', (req, res) => {
  const { trait_id, question_text } = req.body;
  
  db.run(
    'INSERT INTO questions (trait_id, question_text) VALUES (?, ?)',
    [trait_id, question_text],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: '질문이 추가되었습니다.' });
    }
  );
});

// 질문 수정
app.put('/api/admin/questions/:id', (req, res) => {
  const { id } = req.params;
  const { trait_id, question_text, is_active } = req.body;
  
  db.run(
    'UPDATE questions SET trait_id = ?, question_text = ?, is_active = ? WHERE id = ?',
    [trait_id, question_text, is_active, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: '질문이 수정되었습니다.' });
    }
  );
});

// 질문 삭제
app.delete('/api/admin/questions/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM questions WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: '질문이 삭제되었습니다.' });
  });
});

// 결과 유형들 가져오기
app.get('/api/result-types', (req, res) => {
  db.all('SELECT * FROM result_types ORDER BY min_percentage', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 결과 유형 수정
app.put('/api/admin/result-types/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, min_percentage, max_percentage } = req.body;
  
  db.run(
    'UPDATE result_types SET name = ?, description = ?, min_percentage = ?, max_percentage = ? WHERE id = ?',
    [name, description, min_percentage, max_percentage, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: '결과 유형이 수정되었습니다.' });
    }
  );
});

// 검사 결과 제출
app.post('/api/submit-test', (req, res) => {
  const { responses } = req.body;
  const responseId = uuidv4();
  
  // 특질별 점수 계산
  const traitScores = {};
  const traitCounts = {};
  
  // 각 특질별로 점수 합계 계산
  responses.forEach(response => {
    const { question_id, score } = response;
    
    // 질문의 특질 ID 가져오기
    db.get('SELECT trait_id FROM questions WHERE id = ?', [question_id], (err, question) => {
      if (err) {
        console.error('Error getting trait_id:', err);
        return;
      }
      
      if (question) {
        const traitId = question.trait_id;
        traitScores[traitId] = (traitScores[traitId] || 0) + score;
        traitCounts[traitId] = (traitCounts[traitId] || 0) + 1;
      }
    });
  });
  
  // 모든 질문 처리 후 점수 계산
  setTimeout(() => {
    const finalTraitScores = {};
    const resultTypeId = 3; // 기본값: 보통
    
    Object.keys(traitScores).forEach(traitId => {
      const averageScore = traitScores[traitId] / traitCounts[traitId];
      const percentage = (averageScore / 7) * 100; // 7점 척도를 백분율로 변환
      finalTraitScores[traitId] = percentage;
    });
    
    // 결과 저장
    db.run(
      'INSERT INTO user_responses (id, responses, trait_scores, result_type_id) VALUES (?, ?, ?, ?)',
      [responseId, JSON.stringify(responses), JSON.stringify(finalTraitScores), resultTypeId],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ 
          responseId, 
          traitScores: finalTraitScores,
          message: '검사가 완료되었습니다.' 
        });
      }
    );
  }, 1000); // 1초 대기 후 처리
});

// 검사 결과 조회
app.get('/api/results/:responseId', (req, res) => {
  const { responseId } = req.params;
  
  db.get(
    'SELECT * FROM user_responses WHERE id = ?',
    [responseId],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (!row) {
        res.status(404).json({ error: '결과를 찾을 수 없습니다.' });
        return;
      }
      
      const traitScores = JSON.parse(row.trait_scores);
      const responses = JSON.parse(row.responses);
      
      // 특질 이름과 함께 결과 반환
      db.all('SELECT * FROM traits', (err, traits) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        const traitResults = traits.map(trait => ({
          ...trait,
          score: traitScores[trait.id] || 0
        }));
        
        res.json({
          responseId: row.id,
          traitResults,
          responses,
          createdAt: row.created_at
        });
      });
    }
  );
});

// React 앱 서빙
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
