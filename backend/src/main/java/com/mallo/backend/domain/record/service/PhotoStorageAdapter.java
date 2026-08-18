package com.mallo.backend.domain.record.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * 사진 원본 파일 저장 어댑터. 지금은 로컬 디스크(야매)에 저장하는 {@link LocalPhotoStorageAdapter}뿐이고,
 * 나중에 S3 등으로 옮기면 이 인터페이스의 구현체만 새로 추가하면 된다
 * (PhotoObservationAdapter와 동일한 "Mock/임시 → 실제 교체" 패턴).
 */
public interface PhotoStorageAdapter {

	/**
	 * 사진을 저장하고, PhotoRecord.storageKey에 영구히 남길 식별자를 반환한다.
	 * 구현체마다 의미가 다를 수 있다 (로컬 파일 상대 경로, S3 object key 등).
	 */
	String upload(String sessionId, MultipartFile photo);

	/**
	 * storageKey로부터 클라이언트가 직접 접근 가능한 URL을 만든다.
	 * storageKey가 null이면(사진 미저장) null을 반환한다.
	 */
	String resolveUrl(String storageKey);
}
