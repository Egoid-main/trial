# 🎉 AWS 배포 완료 가이드

## ✅ 준비 완료된 파일들

### 📁 프로덕션 빌드 파일
- `client/build/` - React 앱 빌드 결과물
- `server.js` - 프로덕션 최적화된 서버
- `personality_test.db` - SQLite 데이터베이스

### 🐳 Docker 파일
- `Dockerfile` - 컨테이너 이미지 정의
- `.dockerignore` - 빌드 제외 파일
- `task-definition.json` - ECS 태스크 정의

### ⚙️ 설정 파일
- `ecosystem.config.js` - PM2 설정
- `env.example` - 환경변수 템플릿
- `deploy.sh` - 배포 스크립트

---

## 🚀 추천 배포 방법

### 🥇 **1순위: EC2 + PM2 (가장 간단)**

#### 장점:
- ✅ 빠른 설정 (30분 내)
- ✅ 월 비용: ~$30-60
- ✅ 직접 제어 가능
- ✅ 도메인 연결 쉬움

#### 단계:
```bash
# 1. EC2 인스턴스 생성 (Ubuntu 20.04, t3.medium)
# 2. 보안 그룹 설정 (HTTP 80, HTTPS 443, SSH 22)
# 3. 프로젝트 업로드
scp -r . ubuntu@your-ec2-ip:/home/ubuntu/

# 4. 서버 설정
ssh ubuntu@your-ec2-ip
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2

# 5. 프로젝트 설정
cd personality-test-app
npm install
cd client && npm install && npm run build
cd ..

# 6. 환경변수 설정
cp env.example .env
nano .env  # GEMINI_API_KEY 설정

# 7. PM2로 서비스 시작
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save

# 8. Nginx 설정 (선택사항)
sudo nano /etc/nginx/sites-available/personality-test
# 설정 내용은 AWS_DEPLOYMENT_GUIDE.md 참고
```

### 🥈 **2순위: ECS + Fargate (확장성 좋음)**

#### 장점:
- ✅ 서버 관리 불필요
- ✅ 자동 스케일링
- ✅ 컨테이너 기반
- ✅ 월 비용: ~$15-30

#### 단계:
```bash
# 1. ECR 리포지토리 생성
aws ecr create-repository --repository-name personality-test-app

# 2. Docker 이미지 빌드 및 푸시
docker build -t personality-test-app .
docker tag personality-test-app:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/personality-test-app:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/personality-test-app:latest

# 3. ECS 클러스터 및 서비스 생성
# AWS 콘솔에서 또는 AWS CLI 사용
```

### 🥉 **3순위: Vercel + Lambda (비용 최적화)**

#### 장점:
- ✅ 매우 저렴 (월 $1-5)
- ✅ 서버리스
- ✅ 자동 배포

#### 단계:
```bash
# 1. Vercel에 프론트엔드 배포
npm install -g vercel
vercel --prod

# 2. AWS Lambda에 백엔드 배포
# serverless framework 사용
```

---

## 🌐 도메인 연결 (egoid.net)

### 서브도메인 제안:
- `test.egoid.net` - 심리 검사 서비스
- `personality.egoid.net` - 성격 검사 전용
- `ai.egoid.net` - AI 검사 전용

### 연결 방법:
1. **Route 53에서 서브도메인 생성**
2. **CloudFront 배포 생성** (SSL 인증서 포함)
3. **Origin을 EC2/ECS 엔드포인트로 설정**

---

## 🔧 환경변수 설정

### 필수 환경변수:
```bash
NODE_ENV=production
PORT=5000
GEMINI_API_KEY=AIzaSyBJ0aqBSYIvRtfpAi29ZG2lStbo6KcC1LU
```

### 보안 권장사항:
- AWS Secrets Manager 사용
- 환경변수 파일은 .gitignore에 추가
- API 키는 하드코딩하지 말고 환경변수로 관리

---

## 📊 모니터링 설정

### CloudWatch 로그:
```bash
# PM2 로그를 CloudWatch로 전송
npm install -g pm2-cloudwatch
pm2-cloudwatch
```

### 헬스체크:
```bash
# 애플리케이션 상태 확인
curl http://your-domain.com/api/traits
```

---

## 💰 비용 예상

### EC2 + PM2:
- **t3.medium**: 월 ~$30
- **t3.large**: 월 ~$60
- **데이터 전송**: 월 ~$5-10

### ECS + Fargate:
- **0.5 vCPU, 1GB RAM**: 월 ~$15
- **1 vCPU, 2GB RAM**: 월 ~$30

### Lambda + API Gateway:
- **요청 기반**: 월 ~$1-5 (사용량에 따라)

---

## 🎯 다음 단계

1. **EC2 인스턴스 생성** (가장 빠른 방법)
2. **프로젝트 업로드 및 설정**
3. **도메인 연결**
4. **SSL 인증서 설정**
5. **모니터링 설정**

---

## 🆘 문제 해결

### 일반적인 문제:
- **포트 충돌**: `lsof -i :5000`
- **권한 문제**: `sudo chown -R ubuntu:ubuntu /home/ubuntu/`
- **메모리 부족**: EC2 인스턴스 크기 증가
- **도메인 연결 안됨**: DNS 설정 확인

### 로그 확인:
```bash
pm2 logs personality-test-app
sudo tail -f /var/log/nginx/error.log
```

---

## 🎉 완료!

이제 AWS에 배포할 준비가 완료되었습니다! 

**추천**: EC2 + PM2 방법으로 시작해서 나중에 필요에 따라 ECS로 마이그레이션하는 것을 권장합니다.

질문이 있으시면 언제든지 말씀해주세요! 🚀
