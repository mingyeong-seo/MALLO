import { useLocalSearchParams } from 'expo-router';

import { ConsultationScreen } from '@/features/consultation/ConsultationScreen';

export default function RootConsultationRoute() {
  const { question } = useLocalSearchParams<{
    question?: string | string[];
  }>();
  const consultationQuestion = Array.isArray(question) ? question[0] : question;

  return (
    <ConsultationScreen
      mode="ask-mallo"
      question={consultationQuestion}
    />
  );
}
