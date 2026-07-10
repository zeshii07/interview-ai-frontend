// import React from 'react';
// import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
// import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
// import useInterviewStore from '../../store/interviewStore';

// const HistoryScreen = () => {
//   const { interviewHistory, clearHistory } = useInterviewStore();

//   const getScoreColor = (score) => {
//     if (score >= 7.5) return Colors.success;
//     if (score >= 5) return Colors.warning;
//     return Colors.error;
//   };

//   const getGradeLabel = (score) => {
//     if (score >= 9) return 'OUTSTANDING';
//     if (score >= 7.5) return 'STRONG';
//     if (score >= 5) return 'NEEDS WORK';
//     return 'WEAK';
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   const renderHistoryItem = ({ item, index }) => {
//     const scoreColor = getScoreColor(item.feedback.rating);
    
//     return (
//       <View style={styles.cardWrapper}>
//         {/* Left accent border */}
//         <View style={[styles.accentBorder, { backgroundColor: scoreColor }]} />
        
//         <View style={styles.cardInner}>
//           {/* Top Row: Meta Data */}
//           <View style={styles.metaRow}>
//             <View style={styles.badgesRow}>
//               <View style={styles.roleBadge}>
//                 <Text style={styles.roleText}>{item.role}</Text>
//               </View>
//               <View style={[styles.diffBadge, { backgroundColor: Colors.bgElevated }]}>
//                 <Text style={styles.diffText}>{item.difficulty}</Text>
//               </View>
//             </View>
//             <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
//           </View>

//           {/* Question */}
//           <Text style={styles.questionText} numberOfLines={2}>
//             "{item.question}"
//           </Text>

//           {/* Bottom Row: Score & Grade */}
//           <View style={styles.scoreRow}>
//             <View style={styles.scoreContainer}>
//               <Text style={[styles.scoreNumber, { color: scoreColor }]}>
//                 {item.feedback.rating}
//               </Text>
//               <Text style={styles.scoreMax}>/ {item.feedback.rating_max}</Text>
//             </View>
//             <View style={[styles.gradePill, { backgroundColor: scoreColor + '20' }]}>
//               <Text style={[styles.gradeText, { color: scoreColor }]}>
//                 {getGradeLabel(item.feedback.rating)}
//               </Text>
//             </View>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <View style={styles.screen}>
//       {interviewHistory.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <View style={styles.emptyIconBg}>
//             <Text style={styles.emptyIcon}>📊</Text>
//           </View>
//           <Text style={styles.emptyTitle}>No Sessions Yet</Text>
//           <Text style={styles.emptyDesc}>
//             Complete a mock interview to see your performance history and track your progress over time.
//           </Text>
//         </View>
//       ) : (
//         <>
//           {/* Header Stats */}
//           <View style={styles.header}>
//             <View>
//               <Text style={styles.headerTitle}>Interview History</Text>
//               <Text style={styles.headerSub}>Your performance analytics</Text>
//             </View>
//             <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
//               <Text style={styles.clearBtnText}>Clear All</Text>
//             </TouchableOpacity>
//           </View>

//           <FlatList
//             data={interviewHistory}
//             renderItem={renderHistoryItem}
//             keyExtractor={(item) => item.id.toString()}
//             contentContainerStyle={styles.list}
//             showsVerticalScrollIndicator={false}
//           />
//         </>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: Colors.bgPrimary },
//   header: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     alignItems: 'center',
//     padding: Spacing.lg,
//     paddingBottom: 0,
//     marginBottom: Spacing.md
//   },
//   headerTitle: { color: Colors.textPrimary, fontSize: FontSizes.xxl, fontWeight: '800' },
//   headerSub: { color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: 2 },
//   clearBtn: { backgroundColor: Colors.error + '15', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full },
//   clearBtnText: { color: Colors.error, fontSize: FontSizes.xs, fontWeight: '700' },
  
//   list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },

//   // Card Design (The magic happens here)
//   cardWrapper: {
//     flexDirection: 'row',
//     backgroundColor: Colors.bgCard,
//     borderRadius: Radius.lg,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: Colors.border,
//     ...Shadows.small
//   },
//   accentBorder: { width: 4 }, // Left side color strip
//   cardInner: { flex: 1, padding: Spacing.md, justifyContent: 'space-between' },

//   metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
//   badgesRow: { flexDirection: 'row', gap: Spacing.sm },
//   roleBadge: { backgroundColor: Colors.primaryBg, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
//   roleText: { color: Colors.primaryLight, fontSize: FontSizes.xs, fontWeight: '700' },
//   diffBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
//   diffText: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '600', textTransform: 'uppercase' },
//   dateText: { color: Colors.textMuted, fontSize: FontSizes.xs },

//   questionText: { 
//     color: Colors.textSecondary, 
//     fontSize: FontSizes.sm, 
//     lineHeight: 20, 
//     marginBottom: Spacing.md,
//     fontStyle: 'italic'
//   },

//   scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   scoreContainer: { flexDirection: 'row', alignItems: 'flex-end' },
//   scoreNumber: { fontSize: FontSizes.xxl, fontWeight: '800', lineHeight: 28 },
//   scoreMax: { color: Colors.textMuted, fontSize: FontSizes.sm, marginBottom: 4, marginLeft: 2 },
//   gradePill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
//   gradeText: { fontSize: FontSizes.xs, fontWeight: '800', letterSpacing: 0.5 },

//   // Empty State
//   emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
//   emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
//   emptyIcon: { fontSize: 36 },
//   emptyTitle: { color: Colors.textPrimary, fontSize: FontSizes.lg, fontWeight: '700', marginBottom: Spacing.sm },
//   emptyDesc: { color: Colors.textMuted, fontSize: FontSizes.sm, textAlign: 'center', lineHeight: 22 },
// });

// export default HistoryScreen;

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useInterviewStore from '../../store/interviewStore';

const HistoryScreen = () => {
  const { interviewHistory, clearHistory } = useInterviewStore();

  const handleClearHistory = () => {
    Alert.alert(
      'Clear all history?',
      'This deletes every recorded interview session. This can\u2019t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearHistory },
      ]
    );
  };

  const getScoreColor = (score) => {
    if (score >= 7.5) return Colors.success;
    if (score >= 5) return Colors.warning;
    return Colors.error;
  };

  const getGradeLabel = (score) => {
    if (score >= 9) return 'OUTSTANDING';
    if (score >= 7.5) return 'STRONG';
    if (score >= 5) return 'NEEDS WORK';
    return 'WEAK';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryItem = ({ item, index }) => {
    const scoreColor = getScoreColor(item.feedback.rating);
    
    return (
      <View
        style={styles.cardWrapper}
        accessible
        accessibilityLabel={`${item.role}, ${item.difficulty} difficulty, scored ${item.feedback.rating} out of ${item.feedback.rating_max}, ${getGradeLabel(item.feedback.rating)}, on ${formatDate(item.timestamp)}`}
      >
        {/* Left accent border */}
        <View style={[styles.accentBorder, { backgroundColor: scoreColor }]} />
        
        <View style={styles.cardInner}>
          {/* Top Row: Meta Data */}
          <View style={styles.metaRow}>
            <View style={styles.badgesRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{item.role}</Text>
              </View>
              <View style={[styles.diffBadge, { backgroundColor: Colors.bgElevated }]}>
                <Text style={styles.diffText}>{item.difficulty}</Text>
              </View>
            </View>
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          </View>

          {/* Question */}
          <Text style={styles.questionText} numberOfLines={2}>
            "{item.question}"
          </Text>

          {/* Bottom Row: Score & Grade */}
          <View style={styles.scoreRow}>
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreNumber, { color: scoreColor }]}>
                {item.feedback.rating}
              </Text>
              <Text style={styles.scoreMax}>/ {item.feedback.rating_max}</Text>
            </View>
            <View style={[styles.gradePill, { backgroundColor: scoreColor + '20' }]}>
              <Text style={[styles.gradeText, { color: scoreColor }]}>
                {getGradeLabel(item.feedback.rating)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {interviewHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <Text style={styles.emptyIcon}>📊</Text>
          </View>
          <Text style={styles.emptyTitle}>No Sessions Yet</Text>
          <Text style={styles.emptyDesc}>
            Complete a mock interview to see your performance history and track your progress over time.
          </Text>
        </View>
      ) : (
        <>
          {/* Header Stats */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Interview History</Text>
              <Text style={styles.headerSub}>Your performance analytics</Text>
            </View>
            <TouchableOpacity
              onPress={handleClearHistory}
              style={styles.clearBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Clear all history"
            >
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={interviewHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: 0,
    marginBottom: Spacing.md
  },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSizes.xxl, fontWeight: '800' },
  headerSub: { color: Colors.textMuted, fontSize: FontSizes.sm, marginTop: 2 },
  clearBtn: { backgroundColor: Colors.error + '15', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full },
  clearBtnText: { color: Colors.error, fontSize: FontSizes.xs, fontWeight: '700' },
  
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },

  // Card Design (The magic happens here)
  cardWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small
  },
  accentBorder: { width: 4 }, // Left side color strip
  cardInner: { flex: 1, padding: Spacing.md, justifyContent: 'space-between' },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  badgesRow: { flexDirection: 'row', gap: Spacing.sm },
  roleBadge: { backgroundColor: Colors.primaryBg, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
  roleText: { color: Colors.primaryLight, fontSize: FontSizes.xs, fontWeight: '700' },
  diffBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
  diffText: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '600', textTransform: 'uppercase' },
  dateText: { color: Colors.textMuted, fontSize: FontSizes.xs },

  questionText: { 
    color: Colors.textSecondary, 
    fontSize: FontSizes.sm, 
    lineHeight: 20, 
    marginBottom: Spacing.md,
    fontStyle: 'italic'
  },

  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreContainer: { flexDirection: 'row', alignItems: 'flex-end' },
  scoreNumber: { fontSize: FontSizes.xxl, fontWeight: '800', lineHeight: 28 },
  scoreMax: { color: Colors.textMuted, fontSize: FontSizes.sm, marginBottom: 4, marginLeft: 2 },
  gradePill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  gradeText: { fontSize: FontSizes.xs, fontWeight: '800', letterSpacing: 0.5 },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSizes.lg, fontWeight: '700', marginBottom: Spacing.sm },
  emptyDesc: { color: Colors.textMuted, fontSize: FontSizes.sm, textAlign: 'center', lineHeight: 22 },
});

export default HistoryScreen;