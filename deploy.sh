#!/bin/bash
# 2nd Brain GitHub 배포 및 접속 스크립트

echo "🚀 2nd Brain GitHub 배포 중..."
echo ""

# Git 상태 확인
echo "📋 Git 상태 확인..."
git status

echo ""
echo "📤 GitHub로 푸시 중..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ GitHub 푸시 완료!"
    echo ""
    echo "🌐 배포 URL:"
    echo "https://jaeho-jang-dr.github.io/2nd-brain-standalone/"
    echo ""
    echo "📱 휴대폰에서 접속하려면:"
    echo "1. Safari에서 위 URL 접속"
    echo "2. 공유 버튼(□↑) 탭"
    echo "3. '홈 화면에 추가' 선택"
    echo "4. PWA 앱으로 설치 완료!"
    echo ""
    read -p "브라우저에서 열까요? (y/n): " open_browser
    
    if [ "$open_browser" = "y" ] || [ "$open_browser" = "Y" ]; then
        open "https://jaeho-jang-dr.github.io/2nd-brain-standalone/"
        echo "🎉 브라우저에서 열었습니다!"
    fi
else
    echo "❌ GitHub 푸시 실패. 수동으로 다시 시도해주세요:"
    echo "git push origin main"
fi