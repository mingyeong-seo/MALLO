import { StackActions } from '@react-navigation/native';
import { useEffect } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';

import { ConsultationScreen } from '@/features/consultation/ConsultationScreen';

export default function TabConsultationRoute() {
  const { question, source } = useLocalSearchParams<{
    question?: string | string[];
    source?: string | string[];
  }>();
  const rootNavigation = useNavigation('/');
  const consultationQuestion = Array.isArray(question) ? question[0] : question;
  const consultationSource = Array.isArray(source) ? source[0] : source;
  const isJourneyEntry = consultationSource === 'journey-home';

  useEffect(() => {
    if (isJourneyEntry) {
      return;
    }

    rootNavigation.dispatch(
      StackActions.replace('consultation', {
        ...(consultationQuestion ? { question: consultationQuestion } : {}),
        source: 'ask-mallo',
      }),
    );
  }, [consultationQuestion, isJourneyEntry, rootNavigation]);

  if (!isJourneyEntry) {
    return null;
  }

  return (
    <ConsultationScreen
      mode="journey-home"
      question={consultationQuestion}
    />
  );
}
