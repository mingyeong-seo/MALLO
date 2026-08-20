package com.mallo.backend.domain.chatmessage.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mallo.backend.domain.chatmessage.entity.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

	List<ChatMessage> findByHandoffIdOrderByCreatedAtAsc(Long handoffId);
}
