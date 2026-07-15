import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LegalModal({ visible, title, sections, onClose }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.overlay}><View style={styles.sheet}><View style={styles.header}><Text style={styles.title}>{title}</Text><Pressable onPress={onClose} style={styles.close}><Ionicons name="close" size={24} color="#68697A" /></Pressable></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>{sections.map(([heading, body]) => <View key={heading} style={styles.section}><Text style={styles.heading}>{heading}</Text><Text selectable style={styles.body}>{body}</Text></View>)}<Text style={styles.updated}>Last updated: July 14, 2026</Text></ScrollView><Pressable onPress={onClose} style={styles.button}><Text style={styles.buttonText}>Close</Text></Pressable></View></View></Modal>;
}

const styles = StyleSheet.create({ overlay:{flex:1,justifyContent:'flex-end',backgroundColor:Colors.overlay},sheet:{maxHeight:'88%',backgroundColor:Colors.bgPrimary,borderTopLeftRadius:28,borderTopRightRadius:28,padding:20,gap:12},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{color:Colors.textPrimary,fontSize:23,fontWeight:'800'},close:{width:44,height:44,alignItems:'center',justifyContent:'center'},content:{gap:18,paddingBottom:12},section:{gap:5},heading:{color:'#7C5CFF',fontSize:15,fontWeight:'800'},body:{color:Colors.textSecondary,fontSize:13,lineHeight:21},updated:{color:Colors.textMuted,fontSize:11},button:{height:54,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:'#7047F5'},buttonText:{color:'#FFF',fontSize:16,fontWeight:'800'} });
