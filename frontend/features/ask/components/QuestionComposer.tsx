import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';

import { MALLO_COLORS } from '@/constants/colors';
import { styles } from '@/features/ask/styles';

type QuestionComposerProps = {
  attachments: readonly string[];
  bottomClearance: number;
  notice: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  onFocusChange?: (focused: boolean) => void;
  onAddAttachment: () => void;
  onRemoveAttachment: (attachment: string) => void;
  suggestions: readonly string[];
  value: string;
};

type WebKeyPressNativeEvent = TextInputKeyPressEventData & {
  shiftKey?: boolean;
};

export function QuestionComposer({
  attachments,
  bottomClearance,
  notice,
  onChangeText,
  onSubmit,
  onFocusChange,
  onAddAttachment,
  onRemoveAttachment,
  suggestions,
  value,
}: QuestionComposerProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
  });

  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSubmit = value.trim().length > 0;

  const handleFocus = () => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
    }

    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    blurTimerRef.current = setTimeout(() => {
      setIsFocused(false);
      onFocusChange?.(false);
    }, 150);
  };

  const handleInputChange = (text: string) => {
    onChangeText(text);

    setSelection({
      start: text.length,
      end: text.length,
    });
  };

  const handleSuggestionPress = (suggestion: string) => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
    }

    onChangeText(suggestion);

    setSelection({
      start: suggestion.length,
      end: suggestion.length,
    });

    setIsFocused(true);
    onFocusChange?.(true);

    requestAnimationFrame(() => {
      inputRef.current?.focus();

      if (Platform.OS === 'web') {
        const input = inputRef.current as unknown as HTMLTextAreaElement;

        input?.setSelectionRange?.(suggestion.length, suggestion.length);
      }
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    setIsFocused(false);
    onFocusChange?.(false);

    inputRef.current?.blur();
    onSubmit();
  };

  const handleAddAttachment = () => {
    onAddAttachment();
  };

  const handleKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (Platform.OS !== 'web') {
      return;
    }

    const nativeEvent = event.nativeEvent as WebKeyPressNativeEvent;

    if (nativeEvent.key === 'Enter' && !nativeEvent.shiftKey) {
      event.preventDefault?.();
      handleSubmit();
    }
  };

  return (
    <>
      {Platform.OS === 'web' ? (
        <style>
          {`
            textarea {
              scrollbar-width: none;
              -ms-overflow-style: none;
              resize: none;
              outline: none;
              border: none;
            }

            textarea::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
      ) : null}

      <View
        style={[
          styles.composerArea,
          {
            paddingBottom: bottomClearance,
          },
        ]}
      >
        {isFocused ? (
          <View style={styles.suggestionPanel}>
            <View style={styles.suggestionHeader}>
              <Ionicons
                name="sparkles-outline"
                size={15}
                color={MALLO_COLORS.core.red}
              />

              <View style={styles.suggestionHeaderCopy}>
                <Text style={styles.suggestionTitle}>이런 질문은 어때요?</Text>

                <Text style={styles.suggestionHint}>
                  선택한 질문은 입력창에서 자유롭게 수정할 수 있어요.
                </Text>
              </View>
            </View>

            <View style={styles.suggestionList}>
              {suggestions.map((suggestion, index) => (
                <Pressable
                  accessibilityRole="button"
                  key={suggestion}
                  onPress={() => handleSuggestionPress(suggestion)}
                  style={({ pressed }) => [
                    styles.suggestionRow,
                    index < suggestions.length - 1 && styles.suggestionDivider,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>

                  <Ionicons
                    name="add"
                    size={17}
                    color={MALLO_COLORS.support.secondaryTextGray}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {notice ? (
          <Text accessibilityLiveRegion="polite" style={styles.inputNotice}>
            {notice}
          </Text>
        ) : null}

        <View style={styles.composerShell}>
          {attachments.length ? (
            <View style={styles.attachmentPreviewRow}>
              {attachments.map((attachment, index) => (
                <Pressable
                  accessibilityLabel={`Mock 첨부 사진 ${index + 1} 제거`}
                  accessibilityRole="button"
                  key={attachment}
                  onPress={() => onRemoveAttachment(attachment)}
                  style={styles.attachmentPreview}
                >
                  <Ionicons
                    name="image-outline"
                    size={20}
                    color={MALLO_COLORS.core.red}
                  />

                  <Ionicons
                    name="close-circle"
                    size={15}
                    color={MALLO_COLORS.support.secondaryTextGray}
                    style={styles.attachmentRemoveIcon}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.composerInputRow}>
            <Pressable
              accessibilityLabel="사진 첨부"
              accessibilityRole="button"
              hitSlop={6}
              onPress={handleAddAttachment}
              style={({ pressed }) => [
                styles.attachmentButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="add"
                size={21}
                color={MALLO_COLORS.core.red}
              />
            </Pressable>

            <TextInput
              accessibilityLabel="ASK MALLO 질문 입력"
              maxLength={160}
              multiline
              onBlur={handleBlur}
              onChangeText={handleInputChange}
              onFocus={handleFocus}
              onKeyPress={handleKeyPress}
              onSubmitEditing={handleSubmit}
              placeholder="오늘은 무엇이 궁금한가요?"
              placeholderTextColor={MALLO_COLORS.support.secondaryTextGray}
              ref={inputRef}
              returnKeyType="send"
              scrollEnabled
              selection={selection}
              style={styles.input}
              value={value}
            />

            <Pressable
              accessibilityLabel="질문 보내기"
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.sendButton,
                !canSubmit && styles.sendButtonDisabled,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={Platform.OS === 'web' ? 19 : 17}
                color={MALLO_COLORS.core.white}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}
