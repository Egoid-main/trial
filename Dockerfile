# Node.js 18 Alpine 이미지 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일들 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 클라이언트 의존성 설치를 위한 package.json 복사
COPY client/package*.json ./client/

# 클라이언트 의존성 설치
RUN cd client && npm ci --only=production

# 소스 코드 복사
COPY . .

# 클라이언트 빌드
RUN cd client && npm run build

# 포트 노출
EXPOSE 5000

# 환경변수 설정
ENV NODE_ENV=production
ENV PORT=5000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/traits', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 애플리케이션 실행
CMD ["node", "server.js"]
