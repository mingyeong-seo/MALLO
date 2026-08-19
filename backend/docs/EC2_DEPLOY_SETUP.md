# EC2 배포 셋업 가이드

`.github/workflows/backend-deploy.yml`이 자동으로 하는 건 "jar 빌드 → EC2로 전송 → 재시작"뿐이다.
EC2 인스턴스 자체를 띄우고, 그 위에 Java/systemd 서비스를 준비하는 건 **1회성 수동 작업**이라 여기 정리한다.
(2026-08-19 기준: 아직 실제 EC2를 만들지 않은 상태 — 이 문서는 만들 때 그대로 따라 하면 되는 체크리스트.)

---

## 1. EC2 인스턴스 준비 (콘솔 또는 CLI로 직접)

- AMI: Amazon Linux 2023 (또는 Ubuntu 22.04) 권장
- 인스턴스 타입: 해커톤 스코프면 `t3.micro`로 충분
- 보안 그룹 인바운드: `22`(SSH, 내 IP만), `8080`(API, 필요 범위만 — 프론트가 붙는 곳)
- 키페어 새로 생성하고 `.pem` 안전하게 보관 (GitHub Secret `EC2_SSH_KEY`에 들어갈 값)

## 2. 서버 안에서 최초 1회 설정

```bash
# Java 21 설치 (Amazon Linux 2023 기준)
sudo dnf install -y java-21-amazon-corretto

# 배포용 디렉토리 준비
mkdir -p ~/mallo
# 사진 저장 경로는 mallo/ 배포 디렉토리 밖에 따로 둔다 — 배포할 때 mallo/ 안의 jar만 교체되고
# 이 디렉토리는 절대 안 건드려지게 하려는 목적 (remote-deploy.sh 주석 참고)
mkdir -p ~/mallo-uploads/photos
```

`~/mallo/.env` 파일을 만들고 운영 값 채우기 (git에 안 올라가는 파일, 서버에 직접 생성):

```bash
DB_HOST=<RDS 또는 EC2 안 MySQL 주소>
DB_PORT=3306
DB_NAME=mallo
DB_USERNAME=mallo
DB_PASSWORD=<운영용 비밀번호>
CORS_ALLOWED_ORIGINS=<실제 배포된 프론트 주소>
PHOTO_STORAGE_DIR=/home/ec2-user/mallo-uploads/photos
PHOTO_STORAGE_URL_PREFIX=/uploads/photos
```

systemd 유닛 등록 (템플릿: `backend/scripts/deploy/mallo-backend.service`):

```bash
# 로컬에서 서버로 복사 (또는 서버에서 직접 파일 내용 붙여넣기)
scp backend/scripts/deploy/mallo-backend.service ec2-user@<EC2_HOST>:~/mallo-backend.service

# 서버 안에서
sudo mv ~/mallo-backend.service /etc/systemd/system/mallo-backend.service
sudo systemctl daemon-reload
sudo systemctl enable mallo-backend
```

첫 배포 전까지는 `~/mallo/app.jar`가 없어서 서비스가 못 뜨는 게 정상이다 — 아래 3번(첫 수동 배포)까지 하고 나면 뜬다.

## 3. 첫 배포는 수동으로 한 번

GitHub Actions가 붙기 전에, 로컬에서 빌드한 jar를 한 번 직접 올려서 서비스가 정상 기동하는지 먼저 확인한다.

```bash
cd backend
./gradlew bootJar
scp build/libs/backend-0.0.1-SNAPSHOT.jar ec2-user@<EC2_HOST>:~/mallo/app.jar.new
ssh ec2-user@<EC2_HOST> 'cd ~/mallo && bash remote-deploy.sh'
# remote-deploy.sh가 서버에 없으면 backend/scripts/deploy/remote-deploy.sh를 먼저 scp로 올려둘 것
```

`sudo systemctl status mallo-backend`로 active(running) 확인, `curl http://localhost:8080/v3/api-docs`로 응답 확인.

## 4. GitHub Secrets 등록

리포지토리 Settings → Secrets and variables → Actions 에 등록:

| Secret | 값 |
|---|---|
| `EC2_HOST` | EC2 퍼블릭 IP 또는 도메인 |
| `EC2_USER` | `ec2-user` (또는 만든 배포 계정) |
| `EC2_SSH_KEY` | 1번에서 만든 `.pem` 파일 내용 통째로 |

## 5. 자동 배포로 전환

여기까지 되면 `.github/workflows/backend-deploy.yml`의 `on:` 블록에 push 트리거를 추가한다 (지금은 의도적으로 `workflow_dispatch`만 있음 — EC2 없이 워크플로만 먼저 준비해둔 상태였기 때문):

```yaml
on:
  workflow_dispatch: {}
  push:
    branches: [main]
    paths: ["backend/**"]
```

그 전까지는 Actions 탭에서 `Backend Deploy (EC2)` 워크플로를 수동으로(Run workflow) 실행해서 테스트하면 된다.

---

## 되돌아보기 — 코드에서 이미 준비돼 있던 것

`PHOTO_STORAGE_DIR`/`PHOTO_STORAGE_URL_PREFIX`는 애초에 환경변수로 외부화돼 있어서
(`LocalPhotoStorageAdapter`, `PhotoStorageConfig`) 코드 수정 없이 `.env` 값만 바꾸면 됐다.
이번에 실제로 준비한 건: GitHub Actions 워크플로 2개(`backend-ci.yml`, `backend-deploy.yml`),
systemd 유닛 템플릿, 원격 배포 스크립트(`remote-deploy.sh`), 그리고 이 셋업 가이드.
