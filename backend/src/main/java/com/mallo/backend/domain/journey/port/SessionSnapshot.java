package com.mallo.backend.domain.journey.port;

/**
 * journey 도메인이 Quick Check 판단에 필요로 하는, sessionInfo 도메인 소유 값의 스냅샷.
 */
public record SessionSnapshot(String procedure, int elapsedDay) {
}
