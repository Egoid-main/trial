@echo off
echo 🚀 빠른 AWS 배포 스크립트
echo ================================

REM 1. 프로덕션 빌드
echo 📦 클라이언트 빌드 중...
cd client
call npm run build
cd ..

REM 2. 프로덕션 서버 테스트
echo 🧪 프로덕션 서버 테스트 중...
set NODE_ENV=production
start /B node server.js

REM 3초 대기
timeout /t 3 /nobreak > nul

REM 헬스체크
curl -f http://localhost:5000/api/traits > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 서버가 정상적으로 실행 중입니다!
    taskkill /f /im node.exe > nul 2>&1
) else (
    echo ❌ 서버 실행에 문제가 있습니다.
    taskkill /f /im node.exe > nul 2>&1
    pause
    exit /b 1
)

echo.
echo 🎯 배포 준비 완료!
echo.
echo 다음 단계 중 하나를 선택하세요:
echo.
echo 1️⃣  EC2 + PM2 배포:
echo    - EC2 인스턴스에 파일 업로드
echo    - PM2로 서비스 시작
echo.
echo 2️⃣  Docker + ECS 배포:
echo    - Docker 이미지 빌드
echo    - ECR에 푸시
echo    - ECS 서비스 생성
echo.
echo 3️⃣  Vercel + AWS Lambda 배포:
echo    - 프론트엔드: Vercel
echo    - 백엔드: AWS Lambda
echo.
echo 📋 상세 가이드: AWS_DEPLOYMENT_GUIDE.md 파일을 참고하세요
pause
