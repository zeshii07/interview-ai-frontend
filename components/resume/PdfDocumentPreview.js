import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';

import { Colors, Radius, Shadows, Spacing } from '../../constants/theme';

/**
 * PdfDocumentPreview
 *
 * Renders a document layout produced by buildResumePdfLayout() (the exact
 * draw operations the PDF generator emits) as React Native views, one A4
 * page after another. Because the layout comes from the generator itself —
 * same Helvetica metrics, same wrapping, same page breaks — this is a
 * faithful "what you will download" preview.
 *
 * PDF coordinates are bottom-up (y = 0 at the page bottom); React Native
 * is top-down. Every op converts here, then scales by
 * `scale = cardWidth / pageWidth`.
 */

// Helvetica ascent as a fraction of the font size — used to convert the
// PDF text baseline into a top edge for RN's <Text>.
const FONT_ASCENT = 0.78;

function TextOp({ op, scale, pageHeight }) {
  if (!op.text) return null;
  const fontSize = Math.max(4, op.size * scale);
  return (
    <Text
      style={[
        styles.abs,
        styles.text,
        {
          left: op.x * scale,
          top: (pageHeight - op.y - op.size * FONT_ASCENT) * scale,
          fontSize,
          lineHeight: fontSize * 1.12,
          fontWeight: op.bold ? '700' : '400',
          color: op.color,
        },
      ]}
    >
      {op.text}
    </Text>
  );
}

function RectOp({ op, scale, pageHeight }) {
  if (op.width <= 0 || op.height <= 0) return null;
  return (
    <View
      style={[
        styles.abs,
        {
          left: op.x * scale,
          top: (pageHeight - op.y - op.height) * scale,
          width: op.width * scale,
          height: op.height * scale,
          backgroundColor: op.color || 'transparent',
          borderWidth: op.borderColor ? Math.max(0.5, (op.borderWidth || 1) * scale) : 0,
          borderColor: op.borderColor || 'transparent',
        },
      ]}
    />
  );
}

function CircleOp({ op, scale, pageHeight }) {
  const diameter = Math.max(1, op.r * 2 * scale);
  return (
    <View
      style={[
        styles.abs,
        {
          left: (op.cx - op.r) * scale,
          top: (pageHeight - op.cy - op.r) * scale,
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: op.color || 'transparent',
          borderWidth: op.borderColor ? Math.max(0.5, (op.borderWidth || 1) * scale) : 0,
          borderColor: op.borderColor || 'transparent',
        },
      ]}
    />
  );
}

function LineOp({ op, scale, pageHeight }) {
  const dx = op.x2 - op.x1;
  const dy = op.y2 - op.y1;
  const length = Math.sqrt(dx * dx + dy * dy) * scale;
  if (length <= 0) return null;

  const thickness = Math.max(1, (op.thickness || 1) * scale);
  // PDF y grows upward, RN y grows downward -> negate the angle.
  const angleDeg = -(Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: length,
        height: thickness,
        backgroundColor: op.color,
        // Translate to the start point, rotate, then slide half the length
        // along the rotated x-axis so the view extends FROM (x1, y1).
        transform: [
          { translateX: op.x1 * scale },
          { translateY: (pageHeight - op.y1) * scale - thickness / 2 },
          { rotate: `${angleDeg}deg` },
          { translateX: length / 2 },
        ],
      }}
    />
  );
}

function ImageOp({ op, scale, pageHeight }) {
  if (!op.base64) return null;
  return (
    <Image
      source={{ uri: `data:${op.mime};base64,${op.base64}` }}
      style={[
        styles.abs,
        {
          left: op.x * scale,
          top: (pageHeight - op.y - op.height) * scale,
          width: op.width * scale,
          height: op.height * scale,
        },
      ]}
      resizeMode="cover"
    />
  );
}

function PageView({ page, scale }) {
  return (
    <View
      style={[
        styles.page,
        { width: page.width * scale, height: page.height * scale },
      ]}
    >
      {page.ops.map((op, index) => {
        switch (op.type) {
          case 'text':
            return <TextOp key={index} op={op} scale={scale} pageHeight={page.height} />;
          case 'rect':
            return <RectOp key={index} op={op} scale={scale} pageHeight={page.height} />;
          case 'circle':
            return <CircleOp key={index} op={op} scale={scale} pageHeight={page.height} />;
          case 'line':
            return <LineOp key={index} op={op} scale={scale} pageHeight={page.height} />;
          case 'image':
            return <ImageOp key={index} op={op} scale={scale} pageHeight={page.height} />;
          default:
            return null;
        }
      })}
    </View>
  );
}

/**
 * Props:
 *   layout — { pages: [{ width, height, ops }] } from buildResumePdfLayout()
 */
export default function PdfDocumentPreview({ layout }) {
  const { width: windowWidth } = useWindowDimensions();

  if (!layout || !layout.pages || !layout.pages.length) return null;

  // Page card width: full width minus screen gutters and card padding.
  const cardWidth = Math.min(windowWidth - 32, 560);
  const scale = cardWidth / layout.pages[0].width;

  return (
    <View style={styles.stack}>
      {layout.pages.map((page, index) => (
        <View key={`page-${index}`} style={styles.pageWrap}>
          <PageView page={page} scale={scale} />
          <Text style={styles.pageLabel}>
            {index + 1} of {layout.pages.length}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.md,
  },
  pageWrap: {
    alignItems: 'center',
    gap: 6,
  },
  page: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.small,
  },
  pageLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  abs: {
    position: 'absolute',
  },
  text: {
    // Android adds extra top/bottom padding around text glyphs; turning it
    // off keeps the preview's vertical placement close to the PDF.
    includeFontPadding: false,
  },
});
