package com.mallo.backend.domain.record.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import com.mallo.backend.domain.record.exception.RecordErrorCode;
import com.mallo.backend.global.exception.CustomException;

class LocalPhotoStorageAdapterTest {

	private static final String SESSION_ID = "11111111-1111-1111-1111-111111111111";

	@TempDir
	private Path tempDir;

	@Test
	void 사진을_세션별_폴더에_저장하고_storageKey를_반환한다() throws IOException {
		LocalPhotoStorageAdapter adapter = new LocalPhotoStorageAdapter(tempDir.toString(), "/uploads/photos");
		MockMultipartFile photo = new MockMultipartFile("photo", "wound.jpg", "image/jpeg", new byte[] {1, 2, 3});

		String storageKey = adapter.upload(SESSION_ID, photo);

		assertThat(storageKey).startsWith(SESSION_ID + "/").endsWith(".jpg");
		Path savedFile = tempDir.resolve(storageKey);
		assertThat(Files.exists(savedFile)).isTrue();
		assertThat(Files.readAllBytes(savedFile)).containsExactly(1, 2, 3);
	}

	@Test
	void 확장자가_없는_파일도_저장된다() {
		LocalPhotoStorageAdapter adapter = new LocalPhotoStorageAdapter(tempDir.toString(), "/uploads/photos");
		MockMultipartFile photo = new MockMultipartFile("photo", "noext", "application/octet-stream", new byte[] {1});

		String storageKey = adapter.upload(SESSION_ID, photo);

		assertThat(storageKey).doesNotContain(".");
	}

	@Test
	void storageKey로_URL을_만든다() {
		LocalPhotoStorageAdapter adapter = new LocalPhotoStorageAdapter(tempDir.toString(), "/uploads/photos");

		String url = adapter.resolveUrl(SESSION_ID + "/abc.jpg");

		assertThat(url).isEqualTo("/uploads/photos/" + SESSION_ID + "/abc.jpg");
	}

	@Test
	void storageKey가_없으면_URL도_없다() {
		LocalPhotoStorageAdapter adapter = new LocalPhotoStorageAdapter(tempDir.toString(), "/uploads/photos");

		assertThat(adapter.resolveUrl(null)).isNull();
	}

	@Test
	void sessionId에_경로_조작_문자가_있으면_저장을_거부한다() {
		LocalPhotoStorageAdapter adapter = new LocalPhotoStorageAdapter(tempDir.toString(), "/uploads/photos");
		MockMultipartFile photo = new MockMultipartFile("photo", "wound.jpg", "image/jpeg", new byte[] {1});

		assertThatThrownBy(() -> adapter.upload("../../etc", photo))
				.isInstanceOf(CustomException.class)
				.extracting(e -> ((CustomException) e).getErrorCode())
				.isEqualTo(RecordErrorCode.PHOTO_UPLOAD_FAILED);
	}
}
