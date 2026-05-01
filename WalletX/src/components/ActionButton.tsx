// ─── ActionButton ─────────────────────────────────────────────────────────────
// One of the 4 quick-action buttons on the Home screen (Top Up, Transfer, etc.)

import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";

interface ActionButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  gradient?: boolean;
}

export default function ActionButton({
  icon,
  label,
  onPress,
  gradient = false,
}: ActionButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const IconContainer = gradient ? LinearGradient : View;
  const iconProps = gradient
    ? {
        colors: Colors.gradientPrimary,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
      }
    : { style: styles.iconBg };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.touchable}
      >
        <IconContainer
          {...iconProps}
          style={[styles.iconCircle, gradient && styles.gradientCircle] as any}
        >
          <MaterialCommunityIcons name={icon} size={24} color={Colors.white} />
        </IconContainer>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", flex: 1 },
  touchable: { alignItems: "center", gap: Spacing.xs },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBg: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gradientCircle: {
    shadowColor: Colors.accent1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.xs,
  },
});
