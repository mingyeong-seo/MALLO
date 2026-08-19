package com.mallo.backend.domain.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.notification.entity.NotificationPreference;

/**
 * session_id가 그대로 PK라서 조회는 기본 제공되는 findById(sessionId)만으로 충분하다.
 */
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, String> {
}
