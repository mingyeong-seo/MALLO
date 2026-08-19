package com.mallo.backend.domain.handoff.dto;

import com.mallo.backend.domain.handoff.entity.Handoff;

public record HandoffResponse(
		Long handoffId, //생성된 방 id
		String status  //방 요청됨
) {
	public static HandoffResponse from(Handoff handoff) {
		return new HandoffResponse(handoff.getId(), handoff.getStatus().name());
	}
}
