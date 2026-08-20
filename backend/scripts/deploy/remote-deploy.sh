#!/usr/bin/env bash
# EC2 안에서(SSH로 접속된 상태에서) 실행되는 배포 스크립트.
# GitHub Actions(backend-deploy.yml)가 새 jar를 app.jar.new로 올려둔 뒤 이 스크립트를 호출한다.
# 로컬 디스크 사진 저장(PHOTO_STORAGE_DIR)은 이 스크립트가 건드리는 mallo/ 디렉토리 밖의
# 별도 경로를 가리키게 .env에 설정해둬야 한다 — 안 그러면 배포 스크립트가 디렉토리를 정리할 때
# 사진까지 같이 날아갈 위험이 있음 (docs/EC2_DEPLOY_SETUP.md 참고).
set -euo pipefail

APP_DIR="/home/${USER}/mallo"
cd "$APP_DIR"

if [ ! -f app.jar.new ]; then
	echo "app.jar.new가 없습니다. 배포 중단." >&2
	exit 1
fi

echo "[1/4] 기존 서비스 중지"
sudo systemctl stop mallo-backend

echo "[2/4] jar 교체 (이전 버전은 app.jar.bak으로 백업)"
if [ -f app.jar ]; then
	mv app.jar app.jar.bak
fi
mv app.jar.new app.jar

echo "[3/4] 서비스 재시작"
sudo systemctl start mallo-backend

echo "[4/4] 기동 확인 (최대 30초 대기)"
for i in $(seq 1 6); do
	sleep 5
	if systemctl is-active --quiet mallo-backend; then
		echo "정상 기동 확인됨"
		exit 0
	fi
	echo "  대기 중... ($((i * 5))s)"
done

echo "서비스가 30초 안에 기동하지 못했습니다. 롤백합니다." >&2
sudo systemctl stop mallo-backend || true
mv app.jar app.jar.failed
if [ -f app.jar.bak ]; then
	mv app.jar.bak app.jar
	sudo systemctl start mallo-backend
fi
exit 1
