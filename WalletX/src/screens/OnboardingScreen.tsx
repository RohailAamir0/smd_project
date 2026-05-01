// ─── Onboarding Screen ────────────────────────────────────────────────────────
// 3-slide carousel with pagination dots and a Get Started button.

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";
import GradientButton from "../components/GradientButton";
import { StackScreenProps } from "@react-navigation/stack";
import type { AuthStackParamList } from "../types";

const { width } = Dimensions.get("window");

type SlideData = {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  gradient: [string, string];
};

const SLIDES: SlideData[] = [
  {
    id: "1",
    icon: "wallet-outline",
    title: "Track Your Money",
    subtitle:
      "See every income and expense in one place. Know exactly where your money goes.",
    gradient: ["#7C3AED", "#4F46E5"],
  },
  {
    id: "2",
    icon: "chart-arc",
    title: "Smart Statistics",
    subtitle:
      "Beautiful charts and category breakdowns help you understand your spending habits.",
    gradient: ["#3B82F6", "#06B6D4"],
  },
  {
    id: "3",
    icon: "shield-check-outline",
    title: "Secure & Private",
    subtitle:
      "Your financial data is encrypted and securely stored. Only you have access.",
    gradient: ["#10B981", "#3B82F6"],
  },
];

type Props = StackScreenProps<AuthStackParamList, "Onboarding">;

export default function OnboardingScreen({ navigation }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    }
  };

  const handleGetStarted = () => navigation.replace("Login");

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Skip button */}
        <TouchableOpacity style={styles.skip} onPress={handleGetStarted}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(s) => s.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => <Slide slide={item} />}
        />

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* CTA */}
        <View style={styles.footer}>
          {isLast ? (
            <GradientButton
              label="Get Started"
              onPress={handleGetStarted}
              style={styles.btn}
            />
          ) : (
            <GradientButton
              label="Next"
              onPress={handleNext}
              style={styles.btn}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Slide({ slide }: { slide: SlideData }) {
  return (
    <View style={styles.slide}>
      <LinearGradient
        colors={slide.gradient}
        style={styles.iconCircle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons
          name={slide.icon}
          size={64}
          color={Colors.white}
        />
      </LinearGradient>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.subtitle}>{slide.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  skip: {
    alignSelf: "flex-end",
    padding: Spacing.md,
    marginRight: Spacing.sm,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  slide: {
    width,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    shadowColor: Colors.accent1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 14,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: "center",
    lineHeight: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.accent1,
  },
  footer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  btn: {},
});
