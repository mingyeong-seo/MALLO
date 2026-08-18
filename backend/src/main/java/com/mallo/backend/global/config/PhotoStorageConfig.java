package com.mallo.backend.global.config;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 로컬 디스크에 저장된 사진(LocalPhotoStorageAdapter)을 정적 리소스로 그대로 내려준다.
 * 예: photo.storage.dir=./uploads/photos, url-prefix=/uploads/photos 이면
 *     GET /uploads/photos/{sessionId}/{filename} 로 원본 파일에 바로 접근 가능.
 *
 * 이것도 로컬 저장 방식과 마찬가지로 임시(야매) 설정이라, 실제 서버에 CDN/오브젝트 스토리지가 붙으면
 * 이 설정 자체를 통째로 걷어내면 된다.
 */
@Configuration
public class PhotoStorageConfig implements WebMvcConfigurer {

	@Value("${photo.storage.dir}")
	private String storageDir;

	@Value("${photo.storage.url-prefix}")
	private String urlPrefix;

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		String absoluteDir = Path.of(storageDir).toAbsolutePath().normalize().toString();
		registry.addResourceHandler(urlPrefix + "/**")
				.addResourceLocations("file:" + absoluteDir + "/");
	}
}
