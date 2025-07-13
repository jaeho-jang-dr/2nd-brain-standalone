#!/bin/bash
# 2nd Brain 웹앱 실행 스크립트

echo "🧠 2nd Brain 웹앱을 실행합니다..."
echo ""
echo "실행 방법을 선택하세요:"
echo "1) 기본 브라우저로 열기"
echo "2) Chrome으로 열기"
echo "3) Safari로 열기"
echo "4) 로컬 웹서버 실행 (Python)"
echo ""
read -p "선택 (1-4): " choice

case $choice in
    1)
        open index.html
        echo "✅ 기본 브라우저로 열었습니다!"
        ;;
    2)
        open -a "Google Chrome" index.html
        echo "✅ Chrome으로 열었습니다!"
        ;;
    3)
        open -a Safari index.html
        echo "✅ Safari로 열었습니다!"
        ;;
    4)
        echo "🌐 로컬 웹서버를 시작합니다..."
        echo "브라우저에서 http://localhost:8000 으로 접속하세요"
        echo "종료하려면 Ctrl+C를 누르세요"
        python3 -m http.server 8000
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        ;;
esac