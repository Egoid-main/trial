#!/bin/bash

# AWS 배포 스크립트
echo "🚀 AWS 배포를 시작합니다..."

# 1. 프로덕션 빌드
echo "📦 클라이언트 빌드 중..."
cd client
npm run build
cd ..

# 2. Docker 이미지 빌드
echo "🐳 Docker 이미지 빌드 중..."
docker build -t personality-test-app .

# 3. Docker 이미지 태그
echo "🏷️ Docker 이미지 태깅 중..."
docker tag personality-test-app:latest your-ecr-repo/personality-test-app:latest

# 4. ECR에 푸시
echo "📤 ECR에 이미지 푸시 중..."
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.ap-northeast-2.amazonaws.com
docker push your-ecr-repo/personality-test-app:latest

echo "✅ 배포가 완료되었습니다!"
echo "🌐 서비스 URL: https://your-domain.com"
