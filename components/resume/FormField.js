import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

import { Colors, Spacing, FontSizes, Radius, Elevation } from '../../constants/theme';

/**
 * FormField
 *
 * Compact labeled text input used across the resume wizard steps.
 *
 * Props:
 *   label          : string
 *   value          : string
 *   onChangeText   : (text) => void
 *   placeholder    : string?
 *   multiline      : boolean?
 *   keyboardType   : 'default' | 'email-address' | 'phone-pad' | 'url'?
 *   autoCapitalize : 'none' | 'sentences' | 'words' | 'characters'?
 *   required       : boolean?  — shows a red asterisk next to the label
 *   helperText     : string?
 *   maxLength      : number?
 */
export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  required = false,
  helperText,
  maxLength,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required ? <Text style={styles.required}>*</Text> : null}
        </View>
      ) : null}
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          focused && styles.inputFocused,
        ]}
        value={value || ''}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 6,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  required: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: Spacing.sm + 2,
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    // soft brand glow while typing — the "alive input" feel of premium kits
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  helperText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
});
