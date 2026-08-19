package com.mallo.backend.domain.record.port;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mallo.backend.domain.journey.service.JourneyService;

@ExtendWith(MockitoExtension.class)
class JourneyCheckQueryAdapterTest {

	@Mock
	private JourneyService journeyService;

	private JourneyCheckQueryAdapter adapter;

	@Test
	void existsForSession은_JourneyService_결과를_그대로_위임한다() {
		adapter = new JourneyCheckQueryAdapter(journeyService);
		UUID checkId = UUID.randomUUID();
		UUID sessionId = UUID.randomUUID();
		when(journeyService.existsForSession(checkId, sessionId)).thenReturn(true);

		boolean result = adapter.existsForSession(checkId, sessionId);

		assertThat(result).isTrue();
	}
}
