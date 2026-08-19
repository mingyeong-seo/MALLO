import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MALLO_COLORS } from '@/constants/colors';

// ─── Screen ───────────────────────────────────────────────────

export default function ConsentScreen() {
  const router = useRouter();

  // 구현용 상태 관리 (가이드 문서 스펙 일치)
  const [serviceConsent, setServiceConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [notificationConsent, setNotificationConsent] = useState(false);

  // 모달(자세히 보기) 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{ title: string; content: string }>({
    title: '',
    content: '',
  });

  // 전체 동의 여부
  const isAllConsentComplete = serviceConsent && dataConsent && notificationConsent;

  // 필수 항목 완료 여부 (CTA 활성화 판단)
  const isRequiredConsentComplete = serviceConsent && dataConsent;

  // 전체 동의 토글 핸들러
  const handleToggleAll = () => {
    const nextState = !isAllConsentComplete;
    setServiceConsent(nextState);
    setDataConsent(nextState);
    setNotificationConsent(nextState);
  };

  // 자세히 보기 핸들러
  const handleOpenDetail = (title: string) => {
    setSelectedDetail({
      title,
      content: `${title}에 대한 상세 내용입니다. (추후 확정 전문 반영 예정)`,
    });
    setModalVisible(true);
  };

  // S03 화면 이동
  const handleContinue = () => {
    if (!isRequiredConsentComplete) return;
    router.push('/procedure-confirm');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ─── 상단 네비게이션 ────────────────────────── */}
      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>← 이전</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 헤더 ──────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Recovery Journey{'\n'}시작하기</Text>
          <Text style={styles.subtitle}>
            Recovery Journey 제공을 위해{'\n'}아래 내용을 확인해주세요.
          </Text>
        </View>

        {/* ─── 개별 동의 리스트 ──────────────────────── */}
        <View style={styles.consentList}>
          {/* 1. [필수] 서비스 이용 동의 */}
          <View style={styles.cardItem}>
            <View style={styles.consentLeft}>
              <View style={styles.textColumn}>
                <Text style={styles.consentLabel}>
                  <Text style={styles.consentTag}>[필수]</Text> 서비스 이용 동의
                </Text>
                <TouchableOpacity
                  onPress={() => handleOpenDetail('서비스 이용 동의')}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.detailButton}
                >
                  <Text style={styles.detailLink}>자세히 보기</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setServiceConsent(!serviceConsent)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.checkbox, serviceConsent && styles.checkboxChecked]}>
                {serviceConsent ? <Text style={styles.checkIcon}>✓</Text> : null}
              </View>
            </TouchableOpacity>
          </View>

          {/* 2. [필수] 데이터 처리 동의 */}
          <View style={styles.cardItem}>
            <View style={styles.consentLeft}>
              <View style={styles.textColumn}>
                <Text style={styles.consentLabel}>
                  <Text style={styles.consentTag}>[필수]</Text> 데이터 처리 동의
                </Text>
                <TouchableOpacity
                  onPress={() => handleOpenDetail('데이터 처리 동의')}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.detailButton}
                >
                  <Text style={styles.detailLink}>자세히 보기</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setDataConsent(!dataConsent)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.checkbox, dataConsent && styles.checkboxChecked]}>
                {dataConsent ? <Text style={styles.checkIcon}>✓</Text> : null}
              </View>
            </TouchableOpacity>
          </View>

          {/* 3. [선택] 알림 수신 동의 */}
          <View style={styles.cardItem}>
            <View style={styles.consentLeft}>
              <View style={styles.textColumn}>
                <Text style={styles.consentLabel}>
                  <Text style={styles.consentTag}>[선택]</Text> 알림 수신 동의
                </Text>
                <TouchableOpacity
                  onPress={() => handleOpenDetail('알림 수신 동의')}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.detailButton}
                >
                  <Text style={styles.detailLink}>자세히 보기</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setNotificationConsent(!notificationConsent)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.checkbox, notificationConsent && styles.checkboxChecked]}>
                {notificationConsent ? <Text style={styles.checkIcon}>✓</Text> : null}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── 전체 동의 카드 ────────────────────────── */}
        <TouchableOpacity
          style={[styles.cardItem, styles.allAgreeCard]}
          onPress={handleToggleAll}
          activeOpacity={0.7}
        >
          <Text style={styles.allAgreeText}>전체 동의</Text>
          <View style={[styles.checkbox, isAllConsentComplete && styles.checkboxChecked]}>
            {isAllConsentComplete ? <Text style={styles.checkIcon}>✓</Text> : null}
          </View>
        </TouchableOpacity>

        {/* ─── 하단 안내 문구 ────────────────────────── */}
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeText}>
            사진/카메라/앨범 권한 및 사진 수집 동의는{'\n'}추후 Recovery Record에서
            사진 추가 시 요청됩니다.
          </Text>
        </View>
      </ScrollView>

      {/* ─── 하단 CTA 버튼 ──────────────────────────── */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            isRequiredConsentComplete ? styles.ctaButtonActive : styles.ctaButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isRequiredConsentComplete}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.ctaButtonText,
              isRequiredConsentComplete
                ? styles.ctaButtonTextActive
                : styles.ctaButtonTextDisabled,
            ]}
          >
            동의하고 계속하기
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── 자세히 보기 모달 ───────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedDetail.title}</Text>
            <Text style={styles.modalBody}>{selectedDetail.content}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MALLO_COLORS.core.white,
  },
  navigation: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: MALLO_COLORS.core.ink,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Header
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: MALLO_COLORS.core.ink,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    color: MALLO_COLORS.support.secondaryTextGray,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Consent List
  consentList: {
    gap: 12,
    marginBottom: 12,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: MALLO_COLORS.support.mistGray,
    backgroundColor: MALLO_COLORS.core.white,
  },
  allAgreeCard: {
    backgroundColor: MALLO_COLORS.support.warmGray,
    borderColor: MALLO_COLORS.support.mistGray,
  },
  allAgreeText: {
    fontSize: 16,
    fontWeight: '700',
    color: MALLO_COLORS.core.ink,
  },
  consentLeft: {
    flex: 1,
  },
  textColumn: {
    gap: 4,
  },
  detailButton: {
    alignSelf: 'flex-start',
  },
  consentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: MALLO_COLORS.core.ink,
  },
  consentTag: {
    fontSize: 14,
    fontWeight: '600',
    color: MALLO_COLORS.support.secondaryTextGray,
  },
  detailLink: {
    fontSize: 12,
    color: MALLO_COLORS.support.secondaryTextGray,
    textDecorationLine: 'underline',
  },

  // Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: MALLO_COLORS.support.mistGray,
    backgroundColor: MALLO_COLORS.core.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: MALLO_COLORS.core.ink,
    borderColor: MALLO_COLORS.core.ink,
  },
  checkIcon: {
    fontSize: 13,
    fontWeight: '700',
    color: MALLO_COLORS.core.white,
  },

  // Notice
  noticeContainer: {
    marginTop: 20,
    paddingHorizontal: 4,
  },
  noticeText: {
    fontSize: 12,
    color: MALLO_COLORS.support.secondaryTextGray,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Bottom CTA
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: MALLO_COLORS.support.mistGray,
    backgroundColor: MALLO_COLORS.core.white,
  },
  ctaButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonActive: {
    backgroundColor: MALLO_COLORS.core.ink,
  },
  ctaButtonDisabled: {
    backgroundColor: MALLO_COLORS.support.mistGray,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ctaButtonTextActive: {
    color: MALLO_COLORS.core.white,
  },
  ctaButtonTextDisabled: {
    color: MALLO_COLORS.support.secondaryTextGray,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: MALLO_COLORS.core.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MALLO_COLORS.core.ink,
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    color: MALLO_COLORS.support.secondaryTextGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalCloseButton: {
    width: '100%',
    height: 46,
    borderRadius: 10,
    backgroundColor: MALLO_COLORS.core.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: MALLO_COLORS.core.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
