# MALLO Backend

## 요구 사항

- JDK 21
- Docker / Docker Compose (로컬 MySQL 실행용)

## 처음 세팅

```bash
cd backend
cp .env.example .env      # 기본값 그대로 써도 됨. 포트 등이 겹치면 값만 수정
docker compose up -d      # 로컬 MySQL 컨테이너 실행
./gradlew bootRun         # 애플리케이션 실행
```

- `.env`는 git에 올라가지 않습니다. 각자 로컬 환경에 맞게 값을 채워서 사용하세요.
- `application.yml`에는 접속 정보 기본값을 두지 않았습니다. `.env`가 없으면 `./gradlew bootRun`이 바로 실패합니다 (연결정보가 커밋되는 걸 막기 위한 의도적인 동작).
- `.env`는 `bootRun` 태스크가 자동으로 읽어서 환경변수로 주입합니다(`build.gradle` 참고). 터미널에서 직접 `export` 안 해도 됩니다.
- **IntelliJ에서 초록색 Run 버튼으로 실행하는 경우**: Gradle의 `bootRun`을 거치지 않기 때문에 `.env`가 자동 적용되지 않고 `${DB_HOST}` 같은 값이 그대로 남아 에러가 납니다.
  - `Run > Edit Configurations > BackendApplication > Modify options > Environment variables` 에서 `.env`에 있는 값들을 직접 넣어주세요 (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `CORS_ALLOWED_ORIGINS`).
  - `.idea/`는 git에 안 올라가므로 이 설정은 각자 한 번씩 해줘야 합니다.
  - 아니면 그냥 터미널에서 `./gradlew bootRun`으로 실행하면 `.env`가 자동으로 적용됩니다.

## 환경변수

`.env.example` 참고 (예시 값이며 실제 값은 각자 `.env`에서 채웁니다):

| 변수 | 설명 | 예시 값 |
| --- | --- | --- |
| `DB_HOST` | MySQL 호스트 | `localhost` |
| `DB_PORT` | MySQL 포트 | `3306` |
| `DB_NAME` | 데이터베이스 이름 | `mallo` |
| `DB_USERNAME` | 접속 계정 | `mallo` |
| `DB_PASSWORD` | 접속 계정 비밀번호 | `mallo1234` |
| `DB_ROOT_PASSWORD` | MySQL root 비밀번호 (컨테이너 초기화용) | `root1234` |
| `CORS_ALLOWED_ORIGINS` | 허용할 프론트 오리진 (콤마 구분) | `http://localhost:8081,http://localhost:19006` |

## 패키지 구조

`global` / `domain` 두 축으로 나눠서 씁니다.

```
com.mallo.backend
├── BackendApplication.java
├── global                 # 특정 도메인에 속하지 않는 공통 코드
│   ├── config              # CorsConfig 등 설정 클래스
│   ├── exception            # CustomException, ErrorCode, GlobalExceptionHandler
│   └── response              # ApiResponse 공통 응답 포맷
└── domain                  # 여기 아래로 도메인별 패키지 추가
    └── {도메인명}
        ├── controller
        ├── service
        ├── repository
        ├── entity
        └── dto
```

- **에러 처리**: 도메인 로직에서는 `throw new CustomException(에러코드)` 로 던지면 `GlobalExceptionHandler`가 잡아서 공통 포맷으로 응답합니다. 도메인별 에러코드는 `ErrorCode`를 구현하는 enum을 만들어 추가하세요 (`CommonErrorCode` 참고).
- **응답 포맷**: 컨트롤러는 `ApiResponse.success(data)` / `ApiResponse.error(errorCode)` 로 감싸서 반환합니다.

```java
@GetMapping("/{id}")
public ApiResponse<UserResponse> getUser(@PathVariable Long id) {
    return ApiResponse.success(userService.getUser(id));
}
```

## CORS

`CorsConfig`가 `cors.allowed-origins`(= `CORS_ALLOWED_ORIGINS` env) 값을 읽어서 허용 오리진으로 등록합니다. 웹으로 접속하는 프론트 주소가 기본값과 다르면 `.env`에서 값만 바꾸면 됩니다.

## Swagger / OpenAPI

앱 실행 후 아래 주소로 확인할 수 있습니다.

- Swagger UI: http://localhost:8080/swagger-ui/index.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

컨트롤러/DTO에 `@Tag`, `@Operation`, `@Schema` 등 springdoc 어노테이션을 붙이면 문서에 자동 반영됩니다. 기본 정보(제목/설명/버전)는 `global/config/OpenApiConfig.java`에서 관리합니다.

## Docker MySQL

```bash
docker compose up -d       # MySQL 컨테이너 기동 (백그라운드)
docker compose ps          # 상태 확인
docker compose down        # 컨테이너 종료 (데이터는 볼륨에 유지됨)
docker compose down -v     # 컨테이너 종료 + 데이터 볼륨까지 삭제
docker compose logs -f mysql   # MySQL 로그 확인
```

## 자주 쓰는 명령어

```bash
./gradlew bootRun          # 애플리케이션 실행
./gradlew test             # 테스트 실행 (Docker 없이도 동작 - H2 인메모리 DB 사용)
./gradlew build            # 빌드
```

## 스택

- Java 21 / Spring Boot 4.1.0
- Spring Data JPA, MySQL
- Gradle
