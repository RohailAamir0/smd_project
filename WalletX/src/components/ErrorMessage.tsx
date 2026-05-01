import React from "react";
import { Text, StyleSheet } from "react-native";
import Colors from "../constants/colors";
import { FontSize } from "../constants/theme";

interface ErrorMessageProps {
  message: string;
  style?: any;
}

export default function ErrorMessage({ message, style }: ErrorMessageProps) {
  if (!message) return null;
  return <Text style={[styles.error, style]}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: {
    color: Colors.expense,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});
