package com.mallo.backend.global.config;

import java.util.Arrays;

import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.method.HandlerMethod;

import com.mallo.backend.domain.sessionInfo.security.SessionAuthenticationFilter;

import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.parameters.Parameter;

/**
 * X-Session-Id는 대부분의 endpoint에서 SecurityConfig의 SessionAuthenticationFilter가
 * 강제하는데, Record/Photo/Notification 컨트롤러는 그 값을 @RequestHeader로 직접 받지 않고
 * (경로의 {sessionId}만 씀) 필터가 SecurityContext만 채우고 끝나서 springdoc이 이 헤더의
 * 존재를 몰라 Swagger에 파라미터로 안 나왔다 (실제 서버는 헤더 없으면 401, Swagger는 조용히 누락).
 *
 * Session/Journey 컨트롤러처럼 이미 @RequestHeader로 명시한 곳은 springdoc이 알아서 문서화하므로
 * 건드리지 않고, 그 외 인증이 필요한 모든 endpoint에만 이 헤더 파라미터를 추가한다.
 */
@Component
public class SessionHeaderOpenApiCustomizer implements OperationCustomizer {

	private static final String HEADER = SessionAuthenticationFilter.SESSION_HEADER;

	@Override
	public Operation customize(Operation operation, HandlerMethod handlerMethod) {
		if (alreadyDocumented(operation) || isPubliclyPermitted(handlerMethod)) {
			return operation;
		}

		Parameter header = new Parameter()
				.in("header")
				.name(HEADER)
				.required(true)
				.description("발급받은 Recovery Session id")
				.schema(new Schema<String>().type("string").format("uuid"));
		operation.addParametersItem(header);
		return operation;
	}

	private boolean alreadyDocumented(Operation operation) {
		return operation.getParameters() != null
				&& operation.getParameters().stream().anyMatch(p -> HEADER.equalsIgnoreCase(p.getName()));
	}

	/**
	 * SecurityConfig에서 헤더 없이 열어둔 두 endpoint(POST/GET /v1/sessions)만 예외.
	 * findMergedAnnotation은 메서드 애노테이션만 보고 클래스 레벨 @RequestMapping("/v1/sessions")은
	 * 안 합쳐주므로, 클래스/메서드 경로를 직접 이어붙여서 최종 경로를 만든다.
	 */
	private boolean isPubliclyPermitted(HandlerMethod handlerMethod) {
		String classPath = firstPath(AnnotatedElementUtils.findMergedAnnotation(handlerMethod.getBeanType(), RequestMapping.class));
		RequestMapping methodMapping = AnnotatedElementUtils.findMergedAnnotation(handlerMethod.getMethod(), RequestMapping.class);
		if (methodMapping == null) {
			return false;
		}
		String fullPath = classPath + firstPath(methodMapping);
		if (!"/v1/sessions".equals(fullPath)) {
			return false;
		}
		return Arrays.asList(methodMapping.method()).stream()
				.anyMatch(m -> m == RequestMethod.POST || m == RequestMethod.GET);
	}

	private String firstPath(RequestMapping mapping) {
		if (mapping == null) {
			return "";
		}
		String[] paths = mapping.path().length > 0 ? mapping.path() : mapping.value();
		return paths.length > 0 ? paths[0] : "";
	}
}
