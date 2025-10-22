const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Gemini AI 초기화
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBJ0aqBSYIvRtfpAi29ZG2lStbo6KcC1LU';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 미들웨어
app.use(cors());
app.use(bodyParser.json());

// 프로덕션에서만 정적 파일 서빙
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
}

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

  // AI 채팅 검사 결과 테이블
  db.run(`CREATE TABLE IF NOT EXISTS ai_chat_responses (
    id TEXT PRIMARY KEY,
    chat_responses TEXT NOT NULL,
    backend_analysis TEXT NOT NULL,
    desire_sentence TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

// AI 채팅 검사 시작
app.post('/api/ai-chat/start', async (req, res) => {
  try {
    const responseId = uuidv4();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const systemPrompt = `당신은 "내적욕망(자아실현욕망) 검사-챗봇"이다.

◼︎ 목적
  · 사용자가 성취지향이든 안전지향이든 누구도 배제되지 않도록 내적욕망(=매슬로우 5단계 '자아실현적 욕구'를 달성하고도 다시 추구하게 만드는 내부 동기)을 탐색한다.

◼︎ 흐름
  1. Q1–Q4는 '워밍업(미끼)' 질문 – 답변은 저장만 하고 결과 산출에는 직접 사용하지 않는다.
  2. Q5·Q6·Q7의 답변과 백엔드 분석을 종합하여 *각 요소별 분석 요약내용*과 **"내적욕망 문장"** 한 개만 생성·제시한다.

◼︎ 톤
  · 따뜻하고 대화식. 판단·비판·훈수 NO.

◼︎ 대화 규칙
  · 검사가 시작되면 반가운 인사로 시작한다.
  · "Q1", "Q2"처럼 질문을 하고 있다는 직접적인 표현은 지양한다.
  · 각 질문마다 예시를 제공하지 않으며, 대화 흐름에 방해되지 않는 대화를 유지하면서 질문 문항은 제공된 질문을 문자 그대로 질문한다.
  · 각 질문에 대한 답변이 제시되면 해당 답변에 대한 부드러운 공감적 반응을 해준 다음 질문을 이어간다.

지금 검사를 시작하겠습니다.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      responseId,
      message: text,
      currentQuestion: 'Q1'
    });
  } catch (error) {
    console.error('AI 채팅 시작 오류:', error);
    res.status(500).json({ error: 'AI 채팅을 시작하는 중 오류가 발생했습니다.' });
  }
});

// AI 채팅 질문 진행
app.post('/api/ai-chat/continue', async (req, res) => {
  try {
    const { responseId, userMessage, currentQuestion, chatHistory } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    let nextQuestion = '';
    let questionText = '';
    
    // 질문별 텍스트 정의
    const questions = {
      'Q1': '먼저, 마음속에 간직한 꿈이나 꼭 이루고 싶은 목표가 있다면 편하게 들려주세요. 활동이든 성과든 상태든 상관없어요',
      'Q2': '당신이 미래에 하고 싶은 것을 하고자 할 때, 경제적인 부분에서 걱정되거나 걸림돌이 될 것 같은 점이 있을까요?',
      'Q3': '직업선택을 고민할 때, 부모님이나 지인 혹은 사회로부터 부담이나 압박감을 느끼실 수도 있을텐데요. 만약 그렇다면, 그것은 어떤 부담 혹은 압박일까요?',
      'Q4': '그 외에도 진로를 고민하게 만드는 다른 요인들이 있다면 말씀해 주세요. 신체적, 환경적, 개인적 상황 등 어떤 것이든 괜찮습니다.',
      'Q5': '자, 잠시 숨을 한번 쉬어 볼까? 중요한 질문을 하기 위해서 그래. 좋아, 그렇다면 이제 한번 상상해 보자. 이제부터 내가 요정가루를 뿌릴 테니까, 그 모든 현실적 제약들이 다 해결되었다고 생각해보자. (뾰로롱 하는 효과) 자 지금 너는 돈을 위해 일하지 않아도 생계가 보장되고, 주변 사람들의 기대나 사회적 규범에 얽매이지 않아도 되는 상태가 되었어. 그렇다면 너는 어떤걸 하거나 이루고 싶어? 그 목표를 달성하더라도 다시 하고 싶은 그런거를 생각해줘. 아니면 어떤 상태를 유지하고 싶다고 해도 괜찮아. 이유도 함께 적어주면 더 좋을거야',
      'Q6': '그렇다면 그것과 가장 잘 맞는 가치 단어를 하나 골라 줘. (9개 중 택 1) ➊ 완전한   ➋ 사랑받는   ➌ 성취하는   ➍ 독특한   ➎ 유능한   ➏ 안정적인   ➐ 흥미로운   ➑ 장악하는   ➒ 평온한',
      'Q7': '살면서 완전히 몰입했던 순간이 있었을 거야. 시간이 사라지고 주변이 안 보일 만큼 빠져들었던 그때를 떠올려서 적어 줄래? 그때가 어떤 상황이었는지, 너가 어떤 빠져들게된 이유는 무엇일지도 적어주면 더 좋아'
    };

    // 다음 질문 결정
    const questionOrder = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'];
    const currentIndex = questionOrder.indexOf(currentQuestion);
    
    if (currentIndex < questionOrder.length - 1) {
      nextQuestion = questionOrder[currentIndex + 1];
      questionText = questions[nextQuestion];
    }

    // 채팅 히스토리 구성
    let chatContext = chatHistory || [];
    chatContext.push({ role: 'user', content: userMessage });

    if (nextQuestion) {
      // 다음 질문이 있는 경우
      const prompt = `사용자가 "${userMessage}"라고 답변했습니다. 
      
이에 대해 부드러운 공감적 반응을 해주고, 다음 질문을 자연스럽게 이어가세요:
"${questionText}"

대화가 자연스럽게 흘러가도록 하되, 질문의 핵심은 유지해주세요.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      chatContext.push({ role: 'assistant', content: text });

      res.json({
        responseId,
        message: text,
        currentQuestion: nextQuestion,
        chatHistory: chatContext,
        isComplete: false
      });
    } else {
      // 마지막 질문 완료 - 분석 및 결과 생성
      const analysisPrompt = `사용자의 모든 답변을 분석하여 내적욕망을 파악해주세요.

사용자 답변들:
${JSON.stringify(chatContext, null, 2)}

다음 형식으로 분석 결과를 JSON으로 제공해주세요:
{
  "backend_analysis": {
    "value": "선택한 가치 단어",
    "autonomy": "자율성 분석",
    "competence": "유능감 분석", 
    "relatedness": "관계성 분석",
    "self_actualization": "자아실현 욕구 분석",
    "flow_keywords": ["몰입 키워드들"],
    "abstract_motivation": "추상적 동기"
  },
  "desire_sentence": "사용자의 내적욕망을 한 문장으로 표현한 결과"
}

내적욕망 문장 작성 규칙:
- 사용자 원문과 50% 이상 일치하는 어구는 반복 사용하지 않는다
- 단순 정리 대신 해석적으로 재구성하여 숨겨진 무의식적 동기를 드러낸다
- 표현은 직관적이나 함축적 서술을 통해 감정적 정수를 포착한다
- 동사-형용사는 상위 개념으로 치환하여 새로운 서술 구조로 변환한다
- 핵심 키워드는 드러내되 동일 형태의 반복을 피한다`;

      const analysisResult = await model.generateContent(analysisPrompt);
      const analysisResponse = await analysisResult.response;
      const analysisText = analysisResponse.text();

      try {
        const analysis = JSON.parse(analysisText);
        
        // 결과 저장
        db.run(
          'INSERT INTO ai_chat_responses (id, chat_responses, backend_analysis, desire_sentence) VALUES (?, ?, ?, ?)',
          [responseId, JSON.stringify(chatContext), JSON.stringify(analysis.backend_analysis), analysis.desire_sentence],
          function(err) {
            if (err) {
              console.error('결과 저장 오류:', err);
            }
          }
        );

        res.json({
          responseId,
          message: `검사가 완료되었습니다! 당신의 내적욕망을 분석한 결과를 확인해보세요.`,
          currentQuestion: 'COMPLETE',
          chatHistory: chatContext,
          isComplete: true,
          analysis: analysis.backend_analysis,
          desireSentence: analysis.desire_sentence
        });
      } catch (parseError) {
        console.error('분석 결과 파싱 오류:', parseError);
        res.status(500).json({ error: '분석 결과를 처리하는 중 오류가 발생했습니다.' });
      }
    }
  } catch (error) {
    console.error('AI 채팅 진행 오류:', error);
    res.status(500).json({ error: 'AI 채팅을 진행하는 중 오류가 발생했습니다.' });
  }
});

// AI 채팅 검사 결과 조회
app.get('/api/ai-chat/results/:responseId', (req, res) => {
  const { responseId } = req.params;
  
  db.get(
    'SELECT * FROM ai_chat_responses WHERE id = ?',
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
      
      const chatResponses = JSON.parse(row.chat_responses);
      const backendAnalysis = JSON.parse(row.backend_analysis);
      
      res.json({
        responseId: row.id,
        chatResponses,
        backendAnalysis,
        desireSentence: row.desire_sentence,
        createdAt: row.created_at
      });
    }
  );
});

// React 앱 서빙 (프로덕션에서만)
if (NODE_ENV === 'production') {
  // /mvp/ 경로로 시작하는 모든 요청을 React 앱으로 라우팅
  app.get('/mvp/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
  
  // /mvp/ 경로로 시작하지 않는 요청은 404 (기존 홈페이지에서 처리)
  app.get('*', (req, res) => {
    res.status(404).send('Not Found');
  });
}

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});


