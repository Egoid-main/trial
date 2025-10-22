# 🚀 AWS 배포 가이드

## 📋 배포 옵션

### 옵션 1: EC2 + PM2 (간단한 방법)
### 옵션 2: ECS + Fargate (컨테이너 기반)
### 옵션 3: Lambda + API Gateway (서버리스)

---

## 🖥️ 옵션 1: EC2 + PM2 배포

### 1단계: EC2 인스턴스 준비
```bash
# Ubuntu 20.04 LTS 인스턴스 생성
# t3.medium 이상 권장 (2GB RAM, 2 vCPU)
```

### 2단계: 서버 설정
```bash
# Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 설치
sudo npm install -g pm2

# Git 설치
sudo apt-get install git

# 프로젝트 클론
git clone <your-repo-url>
cd personality-test-app

# 의존성 설치
npm install
cd client && npm install && npm run build
cd ..

# 환경변수 설정
cp env.example .env
nano .env  # GEMINI_API_KEY 설정
```

### 3단계: PM2로 서비스 시작
```bash
# PM2로 앱 시작
pm2 start ecosystem.config.js --env production

# PM2 자동 시작 설정
pm2 startup
pm2 save

# 상태 확인
pm2 status
pm2 logs personality-test-app
```

### 4단계: Nginx 설정 (선택사항)
```bash
# Nginx 설치
sudo apt-get install nginx

# 설정 파일 생성
sudo nano /etc/nginx/sites-available/personality-test

# 설정 내용
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/personality-test /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🐳 옵션 2: ECS + Fargate 배포

### 1단계: ECR 리포지토리 생성
```bash
# ECR 리포지토리 생성
aws ecr create-repository --repository-name personality-test-app --region ap-northeast-2

# 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com
```

### 2단계: Docker 이미지 빌드 및 푸시
```bash
# 이미지 빌드
docker build -t personality-test-app .

# 태깅
docker tag personality-test-app:latest <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/personality-test-app:latest

# 푸시
docker push <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/personality-test-app:latest
```

### 3단계: ECS 클러스터 및 서비스 생성
```bash
# ECS 클러스터 생성
aws ecs create-cluster --cluster-name personality-test-cluster

# 태스크 정의 생성 (task-definition.json 필요)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 서비스 생성
aws ecs create-service --cluster personality-test-cluster --service-name personality-test-service --task-definition personality-test-app:1 --desired-count 1
```

---

## ⚡ 옵션 3: Lambda + API Gateway (서버리스)

### 1단계: Serverless Framework 설치
```bash
npm install -g serverless
npm install serverless-http
```

### 2단계: serverless.yml 생성
```yaml
service: personality-test-app

provider:
  name: aws
  runtime: nodejs18.x
  region: ap-northeast-2
  environment:
    GEMINI_API_KEY: ${env:GEMINI_API_KEY}

functions:
  app:
    handler: server.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
      - http:
          path: /
          method: ANY

plugins:
  - serverless-offline
```

### 3단계: 서버 핸들러 수정
```javascript
// serverless.js
const serverless = require('serverless-http');
const app = require('./server');

module.exports.handler = serverless(app);
```

---

## 🌐 도메인 연결 (egoid.net)

### CloudFront + Route 53 설정
1. **Route 53에서 서브도메인 생성**
   - `test.egoid.net` 또는 `personality.egoid.net`

2. **CloudFront 배포 생성**
   - Origin: EC2/ECS 엔드포인트
   - Custom Domain: 선택한 서브도메인

3. **SSL 인증서 설정**
   - AWS Certificate Manager에서 인증서 요청
   - CloudFront에 인증서 연결

---

## 🔧 환경변수 설정

### 필수 환경변수
```bash
NODE_ENV=production
PORT=5000
GEMINI_API_KEY=AIzaSyBJ0aqBSYIvRtfpAi29ZG2lStbo6KcC1LU
```

### 보안 그룹 설정 (EC2)
- **인바운드 규칙**
  - HTTP (80) - 0.0.0.0/0
  - HTTPS (443) - 0.0.0.0/0
  - SSH (22) - Your IP

---

## 📊 모니터링 설정

### CloudWatch 로그
```bash
# PM2 로그를 CloudWatch로 전송
npm install -g pm2-cloudwatch
pm2-cloudwatch
```

### 헬스체크
```bash
# 애플리케이션 헬스체크 엔드포인트
curl http://your-domain.com/api/traits
```

---

## 🚀 배포 명령어

### EC2 배포
```bash
# 프로젝트 업로드
scp -r . ubuntu@your-ec2-ip:/home/ubuntu/

# 서버에서 실행
ssh ubuntu@your-ec2-ip
cd personality-test-app
npm install
cd client && npm install && npm run build
pm2 start ecosystem.config.js --env production
```

### ECS 배포
```bash
# Docker 이미지 빌드 및 푸시
./deploy.sh

# ECS 서비스 업데이트
aws ecs update-service --cluster personality-test-cluster --service personality-test-service --force-new-deployment
```

---

## 🔍 문제 해결

### 일반적인 문제들
1. **포트 충돌**: `lsof -i :5000`으로 포트 사용 확인
2. **권한 문제**: `sudo chown -R ubuntu:ubuntu /home/ubuntu/`
3. **메모리 부족**: EC2 인스턴스 크기 증가
4. **도메인 연결 안됨**: DNS 설정 확인

### 로그 확인
```bash
# PM2 로그
pm2 logs personality-test-app

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 시스템 로그
sudo journalctl -u nginx -f
```

---

## 💰 비용 최적화

### EC2 인스턴스
- **t3.medium**: 월 ~$30
- **t3.large**: 월 ~$60

### ECS Fargate
- **0.5 vCPU, 1GB RAM**: 월 ~$15
- **1 vCPU, 2GB RAM**: 월 ~$30

### Lambda
- **요청 기반**: 매우 저렴 (월 $1-5)

---

## 🎯 추천 배포 방법

**초기 테스트**: EC2 + PM2
**프로덕션**: ECS + Fargate + CloudFront
**비용 최적화**: Lambda + API Gateway

어떤 방법을 선택하시겠나요? 구체적인 설정을 도와드릴게요! 🚀
