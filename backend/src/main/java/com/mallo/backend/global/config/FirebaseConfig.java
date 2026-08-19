package com.mallo.backend.global.config;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;

import lombok.extern.slf4j.Slf4j;

/**
 * 서비스 계정 키를 두 가지 방식 중 아무거나로 받는다 — 로컬 개발은 파일 경로가 편하고,
 * 배포 플랫폼(Railway/Render 등)은 파일 업로드 없이 환경변수에 JSON 통째로 넣는 쪽이 편해서 둘 다 지원.
 * 둘 다 설정 안 하면 FirebaseMessaging 빈을 null로 반환 — FCM 담당자가 아닌 다른 팀원도
 * 앱을 정상적으로 띄울 수 있어야 하기 때문 (FirebaseNotificationSender가 ObjectProvider로 이 부재를 안전하게 처리).
 */
@Configuration
@Slf4j
public class FirebaseConfig {

	@Value("${fcm.credentials-json:}")
	private String credentialsJson;

	@Value("${fcm.credentials-path:}")
	private String credentialsPath;

	@Bean
	public FirebaseMessaging firebaseMessaging() {
		try (InputStream credentialsStream = resolveCredentialsStream()) {
			if (credentialsStream == null) {
				log.warn("fcm.credentials-json / fcm.credentials-path 둘 다 설정되지 않았습니다 "
						+ "— FCM 없이 기동합니다 (실제 푸시는 발송되지 않음)");
				return null;
			}

			FirebaseOptions options = FirebaseOptions.builder()
					.setCredentials(GoogleCredentials.fromStream(credentialsStream))
					.build();
			FirebaseApp app = FirebaseApp.getApps().isEmpty()
					? FirebaseApp.initializeApp(options)
					: FirebaseApp.getInstance();
			return FirebaseMessaging.getInstance(app);
		} catch (IOException e) {
			log.error("FCM 서비스 계정 키를 읽지 못했습니다: {}", e.getMessage());
			return null;
		}
	}

	private InputStream resolveCredentialsStream() throws IOException {
		if (credentialsJson != null && !credentialsJson.isBlank()) {
			return new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8));
		}
		if (credentialsPath != null && !credentialsPath.isBlank()) {
			return new FileInputStream(credentialsPath);
		}
		return null;
	}
}
