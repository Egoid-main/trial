# 🌐 egoid.net/mvp/ 배포 가이드

## 🎯 **배포 구조**

```
egoid.net (기존 홈페이지)
├── / (홈페이지 - 기존)
└── /mvp/ (심리 검사 서비스 - 새로 추가)
```

## 🚀 **배포 방법 3가지**

### 1️⃣ **Nginx 리버스 프록시 (추천)**

#### 장점:
- ✅ 기존 홈페이지 그대로 유지
- ✅ 서브디렉토리로 완전 분리
- ✅ 비용 절약 (도메인 재사용)
- ✅ SSL 인증서 공유

#### 설정:
```nginx
# /etc/nginx/sites-available/egoid.net
server {
    listen 80;
    server_name egoid.net;
    
    # 기존 홈페이지 (루트)
    location / {
        root /var/www/html;
        try_files $uri $uri/ =404;
    }
    
    # 심리 검사 서비스 (/mvp/)
    location /mvp/ {
        proxy_pass http://localhost:5000/mvp/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # React Router 지원
        proxy_intercept_errors on;
        error_page 404 = @fallback;
    }
    
    location @fallback {
        proxy_pass http://localhost:5000/mvp/;
    }
}
```

### 2️⃣ **CloudFront + S3 + Lambda**

#### 구조:
```
egoid.net (S3 정적 사이트)
├── / (홈페이지)
└── /mvp/ (CloudFront → Lambda)
```

#### 설정:
1. **S3 버킷**: `egoid.net` (기존 홈페이지)
2. **CloudFront**: `/mvp/*` → Lambda 함수
3. **Lambda**: Express.js 서버

### 3️⃣ **단일 Express 서버**

#### 구조:
```
egoid.net (Express 서버)
├── / (홈페이지 라우트)
└── /mvp/ (심리 검사 앱)
```

## 🔧 **React 앱 설정**

### package.json 수정:
```json
{
  "homepage": "/mvp"
}
```

### 빌드 후 결과:
```
client/build/
├── index.html
├── static/
│   ├── js/
│   └── css/
└── manifest.json
```

## 🌐 **도메인 설정**

### DNS 설정:
```
egoid.net A → 서버 IP
www.egoid.net CNAME → egoid.net
```

### SSL 인증서:
- Let's Encrypt 사용 (무료)
- 와일드카드 인증서: `*.egoid.net`

## 📁 **디렉토리 구조**

```
/var/www/
├── html/ (기존 홈페이지)
│   ├── index.html
│   ├── css/
│   └── js/
└── mvp/ (심리 검사 서비스)
    ├── server.js
    ├── client/build/
    └── personality_test.db
```

## 🚀 **배포 단계**

### 1단계: 서버 준비
```bash
# 기존 홈페이지 백업
sudo cp -r /var/www/html /var/www/html_backup

# 심리 검사 서비스 디렉토리 생성
sudo mkdir -p /var/www/mvp
```

### 2단계: 프로젝트 업로드
```bash
# 프로젝트 파일 업로드
scp -r . ubuntu@your-server:/home/ubuntu/mvp/

# 서버에서 설정
ssh ubuntu@your-server
sudo mv /home/ubuntu/mvp/* /var/www/mvp/
cd /var/www/mvp
npm install
cd client && npm install && npm run build
```

### 3단계: Nginx 설정
```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/egoid.net

# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/egoid.net /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4단계: PM2로 서비스 시작
```bash
cd /var/www/mvp
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

## 🔍 **테스트**

### URL 테스트:
- `https://egoid.net/` → 기존 홈페이지
- `https://egoid.net/mvp/` → 심리 검사 서비스
- `https://egoid.net/mvp/test` → 성격 특질 검사
- `https://egoid.net/mvp/ai-chat` → AI 내적욕망 검사

### API 테스트:
```bash
curl https://egoid.net/mvp/api/traits
curl https://egoid.net/mvp/api/ai-chat/start
```

## 💰 **비용 분석**

### 기존 방식:
- 도메인: 월 $0 (이미 보유)
- 호스팅: 월 $0 (기존 서버 활용)
- SSL: 월 $0 (Let's Encrypt)

### 추가 비용:
- 서버 리소스: 월 $0 (기존 서버 활용)
- **총 비용: $0** 🎉

## 🎯 **장점 요약**

1. **비용 절약**: 도메인 재사용, 서버 재사용
2. **브랜드 일관성**: egoid.net 도메인 유지
3. **사용자 경험**: 직관적인 URL 구조
4. **SEO 친화적**: 서브디렉토리 구조
5. **확장성**: 추가 서비스도 `/service/` 형태로 확장 가능

## 🚀 **다음 단계**

1. **기존 홈페이지 백업**
2. **서버에 프로젝트 업로드**
3. **Nginx 설정 수정**
4. **PM2로 서비스 시작**
5. **도메인 연결 테스트**

이 방식이 가장 효율적이고 비용 절약 효과가 큽니다! 🎯
