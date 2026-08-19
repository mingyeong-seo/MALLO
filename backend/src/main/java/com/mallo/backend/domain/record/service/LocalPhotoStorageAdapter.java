package com.mallo.backend.domain.record.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.mallo.backend.domain.record.exception.RecordErrorCode;
import com.mallo.backend.global.exception.CustomException;

/**
 * 로컬 디스크에 파일로 저장하는 임시(야매) 구현체.
 * 해커톤 스코프에서 빠르게 붙이려고 쓰는 방식이고, 실제 서버(CI/CD)에 올라가면
 * {@code photo.storage.dir}을 리눅스 서버의 실제 경로로, {@code photo.storage.url-prefix}를
 * 그 경로를 서빙하는 정적 리소스 경로로 바꿔주면 된다 ({@link com.mallo.backend.global.config.PhotoStorageConfig} 참고).
 * 나중에 S3 등으로 옮기게 되면 이 클래스 대신 PhotoStorageAdapter 구현체를 새로 추가하면 된다.
 */
@Component
public class LocalPhotoStorageAdapter implements PhotoStorageAdapter {

	// storageKey에 쓸 확장자는 영숫자만 허용 — 업로드 파일명에 경로 조작 문자(../ 등)가 섞여 들어오는 걸 막기 위함
	private static final Pattern SAFE_EXTENSION = Pattern.compile("\\.[a-zA-Z0-9]{1,10}");

	private final Path storageDir;
	private final String urlPrefix;

	public LocalPhotoStorageAdapter(
			@Value("${photo.storage.dir}") String storageDir,
			@Value("${photo.storage.url-prefix}") String urlPrefix
	) {
		this.storageDir = Path.of(storageDir).toAbsolutePath().normalize();
		this.urlPrefix = urlPrefix;
	}

	@Override
	public String upload(String sessionId, MultipartFile photo) {
		try {
			// sessionId별로 폴더를 나눠서 저장 — 나중에 세션 단위로 찾아보거나 정리하기 쉽게
			Path sessionDir = storageDir.resolve(sessionId).normalize();
			if (!sessionDir.startsWith(storageDir)) {
				// sessionId에 "../" 같은 게 섞여 저장 경로를 벗어나려는 경우 방어
				throw new CustomException(RecordErrorCode.PHOTO_UPLOAD_FAILED);
			}
			Files.createDirectories(sessionDir);

			String filename = UUID.randomUUID() + extractSafeExtension(photo.getOriginalFilename());
			photo.transferTo(sessionDir.resolve(filename));

			return sessionId + "/" + filename;
		} catch (IOException e) {
			throw new CustomException(RecordErrorCode.PHOTO_UPLOAD_FAILED);
		}
	}

	@Override
	public String resolveUrl(String storageKey) {
		if (storageKey == null) {
			return null;
		}
		return urlPrefix + "/" + storageKey;
	}

	private String extractSafeExtension(String originalFilename) {
		if (originalFilename == null) {
			return "";
		}
		int dotIndex = originalFilename.lastIndexOf('.');
		if (dotIndex < 0) {
			return "";
		}
		String extension = originalFilename.substring(dotIndex);
		return SAFE_EXTENSION.matcher(extension).matches() ? extension : "";
	}
}
