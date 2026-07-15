import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { loadPreferences, savePreferences } from '../../utils/storage';
import LegalModal from '../../components/legal-modal';
import { PRIVACY_SECTIONS, TERMS_SECTIONS } from '../../components/legal-content';
import useInterviewStore from '../../store/interviewStore';
import { Colors, Gradients } from '../../constants/theme';

const LANGUAGES=['English','Urdu','Hindi','Arabic','Spanish','French','German'];
const p={ink:Colors.textPrimary,muted:Colors.textMuted,purple:Colors.primary,dark:Colors.primaryDark,lavender:Colors.primaryBg,line:Colors.border,bg:Colors.bgPrimary,card:Colors.bgCard,elevated:Colors.bgElevated};

function Row({icon,title,subtitle,onPress,danger}) { return <Pressable onPress={onPress} style={({pressed})=>[styles.row,pressed&&styles.pressed]}><View style={[styles.icon,{backgroundColor:danger?'#FFF0F2':p.lavender}]}><Ionicons name={icon} size={20} color={danger?'#C83F52':p.dark}/></View><View style={styles.copy}><Text style={[styles.rowTitle,danger&&{color:'#B83346'}]}>{title}</Text>{subtitle?<Text style={styles.rowSub}>{subtitle}</Text>:null}</View><Ionicons name="chevron-forward" size={19} color={p.muted}/></Pressable> }

export default function SettingsScreen(){
 const [prefs,setPrefs]=React.useState(null); const [legal,setLegal]=React.useState(null);
 const clearHistory=useInterviewStore(state=>state.clearHistory);
 React.useEffect(()=>{loadPreferences().then(setPrefs)},[]);
 const update=async(patch)=>{const next=await savePreferences({...prefs,...patch});setPrefs(next)};
 if(!prefs)return <View style={styles.loading}><Text style={styles.rowSub}>Loading settings…</Text></View>;
 return <View style={styles.screen}><ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
  <Text style={styles.intro}>Personalize your Hirely experience and manage your account data.</Text>
  <Text style={styles.label}>DEFAULT INTERVIEW LANGUAGE</Text><View style={styles.card}><View style={styles.chips}>{LANGUAGES.map(language=><Pressable key={language} onPress={()=>update({language})} style={[styles.chip,prefs.language===language&&styles.chipActive]}><Text style={[styles.chipText,prefs.language===language&&styles.chipTextActive]}>{language}</Text></Pressable>)}</View><Text style={styles.helper}>Used automatically when you do not choose a language before an interview.</Text></View>
  <Text style={styles.label}>LEGAL & SUPPORT</Text><View style={styles.cardNoPad}><Row icon="shield-checkmark-outline" title="Privacy Policy" subtitle="How Hirely handles your information" onPress={()=>setLegal('privacy')}/><Row icon="document-text-outline" title="Terms & Conditions" subtitle="Rules for using Hirely" onPress={()=>setLegal('terms')}/><View style={styles.consentSetting}><View style={styles.copy}><Text style={styles.rowTitle}>Terms accepted</Text><Text style={styles.rowSub}>Required to use your Hirely account</Text></View><Switch value={prefs.acceptedTerms} onValueChange={value=>update({acceptedTerms:value})} trackColor={{false:'#D8D8E1',true:'#A995FF'}} thumbColor={prefs.acceptedTerms?p.purple:'#FFF'}/></View><Row icon="information-circle-outline" title="About Hirely" subtitle="Version, mission, and contact" onPress={()=>router.push('/settings/about')}/></View>
  <Text style={styles.label}>ACCOUNT & DATA</Text><View style={styles.cardNoPad}><Row icon="refresh-outline" title="Clear interview history" subtitle="Remove saved sessions from this device" onPress={()=>clearHistory()}/><Row icon="trash-outline" title="Delete account" subtitle="Permanently remove your Firebase account" danger onPress={()=>router.push('/settings/delete-account')}/></View>
 </ScrollView><LegalModal visible={legal==='privacy'} title="Hirely Privacy Policy" sections={PRIVACY_SECTIONS} onClose={()=>setLegal(null)}/><LegalModal visible={legal==='terms'} title="Terms & Conditions" sections={TERMS_SECTIONS} onClose={()=>setLegal(null)}/></View>
}
const styles=StyleSheet.create({screen:{flex:1,...Gradients.screen},loading:{flex:1,alignItems:'center',justifyContent:'center',...Gradients.screen},content:{padding:22,paddingBottom:50,gap:14},intro:{color:p.muted,fontSize:14,lineHeight:21},label:{color:p.dark,fontSize:10,fontWeight:'900',letterSpacing:1,paddingTop:6},card:{gap:14,borderRadius:18,borderWidth:1,borderColor:p.line,backgroundColor:p.card,padding:16},cardNoPad:{borderRadius:18,borderWidth:1,borderColor:p.line,backgroundColor:p.card,overflow:'hidden'},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{paddingHorizontal:12,paddingVertical:9,borderRadius:12,borderWidth:1,borderColor:p.line,backgroundColor:p.elevated},chipActive:{borderColor:p.purple,backgroundColor:p.lavender},chipText:{color:p.muted,fontSize:12,fontWeight:'700'},chipTextActive:{color:p.dark},helper:{color:p.muted,fontSize:11,lineHeight:17},switchRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},consentSetting:{minHeight:70,flexDirection:'row',alignItems:'center',paddingHorizontal:15,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:p.line},row:{minHeight:72,flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:15,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:p.line},icon:{width:40,height:40,borderRadius:13,alignItems:'center',justifyContent:'center'},copy:{flex:1,gap:3},rowTitle:{color:p.ink,fontSize:14,fontWeight:'800'},rowSub:{color:p.muted,fontSize:11,lineHeight:16},pressed:{opacity:.7}});
