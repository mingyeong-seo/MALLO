import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { MALLO_COLORS } from '@/constants/colors';
import { styles } from '@/features/check/result-styles';

export function ProtocolEvidenceCard() {
  return (
    <View style={styles.protocolCard}>
      <View style={styles.protocolRow}>
        <View style={styles.protocolIndex}>
          <Ionicons
            name="checkmark"
            size={15}
            color={MALLO_COLORS.core.red}
          />
        </View>
        <View style={styles.protocolCopy}>
          <Text style={styles.protocolTitle}>병원 검수 Recovery Protocol</Text>
          <Text style={styles.protocolText}>
            현재 DAY와 행동 조건을 기준으로 매칭된 안내예요.
          </Text>
        </View>
      </View>
    </View>
  );
}
