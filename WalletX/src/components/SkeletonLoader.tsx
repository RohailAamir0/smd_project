// ─── SkeletonLoader ───────────────────────────────────────────────────────────
// Animated shimmer placeholder shown while transactions are loading.

import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  DimensionValue,
  StyleProp,
  ViewStyle,
} from "react-native";
import Colors from "../constants/colors";
import { Spacing, Radius } from "../constants/theme";

interface SkeletonBoxProps {
  width: DimensionValue;
  height: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

function SkeletonBox({ width, height, style }: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  });

  return (
    <Animated.View style={[styles.box, { width, height, opacity }, style]} />
  );
}

interface SkeletonLoaderProps {
  count?: number;
}

/** Renders N skeleton rows that mimic TransactionItem */
export default function SkeletonLoader({ count = 4 }: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <SkeletonBox
            width={44}
            height={44}
            style={{ borderRadius: Radius.md }}
          />
          <View style={styles.lines}>
            <SkeletonBox
              width="60%"
              height={14}
              style={{ borderRadius: Radius.sm, marginBottom: 6 }}
            />
            <SkeletonBox
              width="40%"
              height={10}
              style={{ borderRadius: Radius.sm }}
            />
          </View>
          <SkeletonBox
            width={60}
            height={14}
            style={{ borderRadius: Radius.sm }}
          />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: Colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  lines: { flex: 1 },
});
