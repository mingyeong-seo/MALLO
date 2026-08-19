# EC2 배포 셋업 가이드

`.github/workflows/backend-deploy.yml`이 자동으로 하는 건 "jar 빌드 → EC2로 전송 → 재시작"뿐이다.
EC2 인스턴스 자체를 띄우고, 그 위에 Java/systemd 서비스를 준비하는 건 **1회성 수동 작업**이라 여기 정리한다.

> **2026-08-19: 실제로 완료함.** EC2(`3.34.181.218`, t3.micro 추정 1GB RAM) + RDS(MySQL, `mallo.cpowmae00sqh.ap-northeast-2.rds.amazonaws.com`)로 첫 배포까지 성공.
> **교훈**: 1GB짜리 인스턴스에 MySQL 컨테이너 + JVM 앱을 같이 돌리려다 메모리 부족으로 SSH까지 먹통되는 걸 겪었음(스왑 0이라 완충 없이 바로 죽음). 그래서 **DB는 RDS로 분리하는 걸 기본값으로 하고, EC2 로컬에 MySQL을 같이 띄우는 건 권장 안 함**(아래 2번에서 RDS 선택).

---

## 1. EC2 인스턴스 준비 (콘솔 또는 CLI로 직접)

- AMI: Amazon Linux 2023 (또는 Ubuntu 22.04) 권장
- 인스턴스 타입: `t3.micro`(1GB RAM)는 앱 혼자 돌리기엔 빠듯하게 버티는 수준 — DB를 RDS로 분리하는 게 전제. 여유 있게 가려면 `t3.small`(2GB) 고려
- 보안 그룹 인바운드: `22`(SSH, 내 IP만), `8080`(API, `0.0.0.0/0` — 프론트/누구든 접근해야 하는 공개 API라 SSH처럼 제한할 필요 없음)
- 키페어 새로 생성하고 `.pem` 안전하게 보관 (GitHub Secret `EC2_SSH_KEY`에 들어갈 값)
- **DB는 EC2에 같이 설치하지 말고 RDS로 분리할 것** (위 교훈 참고) — RDS 생성 시 "초기 데이터베이스 이름"에 `mallo`를 넣거나, 안 넣었으면 나중에 직접 `CREATE DATABASE mallo;` 실행해야 함 (안 하면 앱이 `Unknown database 'mallo'`로 계속 크래시함)

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
DB_HOST=<RDS 엔드포인트>
DB_PORT=3306
DB_NAME=mallo
DB_USERNAME=<RDS 마스터 유저명>
DB_PASSWORD=<RDS 마스터 비밀번호>
CORS_ALLOWED_ORIGINS=<실제 배포된 프론트 주소>
PHOTO_STORAGE_DIR=/home/ec2-user/mallo-uploads/photos
PHOTO_STORAGE_URL_PREFIX=/uploads/photos
```

`mallo` 스키마가 RDS에 없으면 앱이 계속 크래시하니, 없으면 먼저 만들어둔다 (mysql 클라이언트 안 깔려있으면 docker로 1회성 실행):

```bash
docker run --rm mysql:8.0 mysql -h <RDS 엔드포인트> -u <마스터유저> -p'<마스터비밀번호>' \
  -e "CREATE DATABASE IF NOT EXISTS mallo CHARACTER SET utf8mb4;"
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

## 5. 자동 배포로 전환 — 완료 (2026-08-19)

시크릿 등록 끝나서 `backend-deploy.yml`에 `push: branches: [dev]` 트리거 추가함. 지금부턴 `backend/**` 변경분이 `dev`에 머지되면 자동 배포된다.

**단, GitHub Actions가 워크플로를 인식하려면 그 워크플로 파일이 저장소 기본 브랜치(`main`)에 있어야 한다** — `workflow_dispatch` 수동 실행 버튼도, API 목록 조회도 전부 이 조건이 있어야 뜬다 (겪어본 이슈, `docs/EC2_DEPLOY_SETUP.md` 참고용으로 남김). `dev`에만 있고 `main`엔 아직 없으면 push 자동 트리거는 동작하지만 수동 실행 버튼은 안 보일 수 있음 — `main`까지 머지되면 완전히 해결됨.

---

## 되돌아보기 — 코드에서 이미 준비돼 있던 것

`PHOTO_STORAGE_DIR`/`PHOTO_STORAGE_URL_PREFIX`는 애초에 환경변수로 외부화돼 있어서
(`LocalPhotoStorageAdapter`, `PhotoStorageConfig`) 코드 수정 없이 `.env` 값만 바꾸면 됐다.
이번에 실제로 준비한 건: GitHub Actions 워크플로 2개(`backend-ci.yml`, `backend-deploy.yml`),
systemd 유닛 템플릿, 원격 배포 스크립트(`remote-deploy.sh`), 그리고 이 셋업 가이드.
