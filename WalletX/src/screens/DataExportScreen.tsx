import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../constants/colors";
import {
  Spacing,
  Radius,
  FontSize,
  FontWeight,
  Shadow,
} from "../constants/theme";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import GradientButton from "../components/GradientButton";
import ErrorMessage from "../components/ErrorMessage";
import { formatDate, formatTime } from "../utils/formatDate";
import { formatCurrency } from "../utils/formatCurrency";
import {
  getTransactionsBeforeDate,
  getTransactionsInRange,
} from "../services/firestore";
import type {
  AppStackParamList,
  DateLike,
  Transaction,
  Wallet,
} from "../types";
import { StackScreenProps } from "@react-navigation/stack";

type Props = StackScreenProps<AppStackParamList, "DataExport">;

type ExportFormat = "csv" | "json" | "pdf";

type ExportRow = {
  rowType: "Summary" | "Transaction";
  date: Date;
  time: string;
  type: string;
  note: string;
  amount: number;
  category: string;
  walletName: string;
  walletBalance: number;
};

type WalletExportSummary = {
  wallet: Wallet;
  openingBalance: number;
  closingBalance: number;
  currentBalance: number;
};

const DAY_MS = 86_400_000;
const EXPORT_DIR_KEY = "walletx-export-dir";

function toJsDate(date: DateLike): Date {
  if (date && typeof (date as { toDate?: () => Date }).toDate === "function") {
    return (date as { toDate: () => Date }).toDate();
  }
  return date as Date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function formatFileDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function csvValue(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function sumTransactionEffects(transactions: Transaction[]): number {
  return transactions.reduce(
    (sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount),
    0,
  );
}

function buildTransactionRows(
  transactions: Transaction[],
  walletMap: Map<string, Wallet>,
): ExportRow[] {
  return transactions
    .slice()
    .sort((a, b) => toJsDate(a.date).getTime() - toJsDate(b.date).getTime())
    .map((tx) => {
      const wallet = walletMap.get(tx.walletId);
      const walletBalance = wallet ? wallet.initialBalance + wallet.balance : 0;
      return {
        rowType: "Transaction",
        date: toJsDate(tx.date),
        time: formatTime(tx.date),
        type: tx.type,
        note: tx.note ?? "",
        amount: tx.amount,
        category: tx.category ?? "",
        walletName: wallet?.name ?? "Unknown",
        walletBalance,
      };
    });
}

function buildOpeningRows(
  summaries: WalletExportSummary[],
  rangeStart: Date,
): ExportRow[] {
  return summaries.map((summary) => ({
    rowType: "Summary",
    date: rangeStart,
    time: "",
    type: "opening",
    note: "Opening Balance",
    amount: summary.openingBalance,
    category: "",
    walletName: summary.wallet.name,
    walletBalance: summary.currentBalance,
  }));
}

function buildClosingRows(
  summaries: WalletExportSummary[],
  rangeEnd: Date,
): ExportRow[] {
  return summaries.map((summary) => ({
    rowType: "Summary",
    date: rangeEnd,
    time: "",
    type: "closing",
    note: "Closing Balance",
    amount: summary.closingBalance,
    category: "",
    walletName: summary.wallet.name,
    walletBalance: summary.currentBalance,
  }));
}

function buildCsvContent(rows: ExportRow[]): string {
  const headers = [
    "Row Type",
    "Transaction Date",
    "Transaction Time",
    "Transaction Type",
    "Transaction Note",
    "Transaction Amount",
    "Category",
    "Wallet Name",
    "Current Wallet Balance",
  ];
  const lines = rows.map((row) =>
    [
      row.rowType,
      formatDate(row.date),
      row.time,
      row.type,
      row.note,
      formatNumber(row.amount),
      row.category,
      row.walletName,
      formatNumber(row.walletBalance),
    ]
      .map((value) => csvValue(String(value)))
      .join(","),
  );
  return [headers.join(","), ...lines].join("\n");
}

function buildPdfHtml(
  rangeStart: Date,
  rangeEnd: Date,
  walletNames: string[],
  totalIncome: number,
  totalExpenses: number,
  rows: ExportRow[],
): string {
  const summaryLine = `${formatDate(rangeStart)} - ${formatDate(rangeEnd)}`;
  const walletsLine = walletNames.join(", ") || "All wallets";
  const tableRows = rows
    .map((row) => {
      const cells = [
        row.rowType,
        formatDate(row.date),
        row.time,
        row.type,
        row.note,
        formatCurrency(row.amount),
        row.category,
        row.walletName,
        formatCurrency(row.walletBalance),
      ]
        .map((value) => `<td>${escapeHtml(String(value))}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
      h1 { font-size: 20px; margin-bottom: 6px; }
      .meta { font-size: 12px; margin-bottom: 16px; color: #444; }
      .summary { margin-bottom: 18px; }
      .summary div { margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
      th { background: #f4f4f4; }
      tr:nth-child(even) { background: #fafafa; }
    </style>
  </head>
  <body>
    <h1>WalletX Data Export</h1>
    <div class="meta">Generated ${escapeHtml(new Date().toLocaleString())}</div>
    <div class="summary">
      <div><strong>Date Range:</strong> ${escapeHtml(summaryLine)}</div>
      <div><strong>Wallets:</strong> ${escapeHtml(walletsLine)}</div>
      <div><strong>Total Income:</strong> ${escapeHtml(formatCurrency(totalIncome))}</div>
      <div><strong>Total Expenses:</strong> ${escapeHtml(formatCurrency(totalExpenses))}</div>
      <div><strong>Net:</strong> ${escapeHtml(formatCurrency(totalIncome - totalExpenses))}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Row Type</th>
          <th>Transaction Date</th>
          <th>Transaction Time</th>
          <th>Transaction Type</th>
          <th>Transaction Note</th>
          <th>Transaction Amount</th>
          <th>Category</th>
          <th>Wallet Name</th>
          <th>Current Wallet Balance</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </body>
</html>
  `.trim();
}

async function ensureAndroidExportDirectory(): Promise<string> {
  if (!FileSystem.StorageAccessFramework) {
    throw new Error("Storage Access Framework is not available.");
  }
  const stored = await AsyncStorage.getItem(EXPORT_DIR_KEY);
  if (stored) return stored;

  const permissions =
    await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    throw new Error("Storage permission is required to save to Documents.");
  }

  await AsyncStorage.setItem(EXPORT_DIR_KEY, permissions.directoryUri);
  return permissions.directoryUri;
}

async function saveWithSaf(
  fileName: string,
  mimeType: string,
  content: string | { uri: string; isBinary: boolean },
): Promise<string> {
  if (!FileSystem.StorageAccessFramework) {
    throw new Error("Storage Access Framework is not available.");
  }
  let directoryUri = await ensureAndroidExportDirectory();
  try {
    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      directoryUri,
      fileName,
      mimeType,
    );
    if (typeof content === "string") {
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } else if (content.isBinary) {
      await FileSystem.copyAsync({ from: content.uri, to: fileUri });
    } else {
      await FileSystem.writeAsStringAsync(fileUri, content.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
    return fileUri;
  } catch {
    await AsyncStorage.removeItem(EXPORT_DIR_KEY);
    directoryUri = await ensureAndroidExportDirectory();
    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      directoryUri,
      fileName,
      mimeType,
    );
    if (typeof content === "string") {
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } else if (content.isBinary) {
      await FileSystem.copyAsync({ from: content.uri, to: fileUri });
    } else {
      await FileSystem.writeAsStringAsync(fileUri, content.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
    return fileUri;
  }
}

async function saveWithAndroidFallback(
  fileName: string,
  mimeType: string,
  content: string | { uri: string; isBinary: boolean },
  exportDirectory: string,
): Promise<{ uri: string; usedSaf: boolean }> {
  try {
    const uri = await saveWithSaf(fileName, mimeType, content);
    return { uri, usedSaf: true };
  } catch {
    if (typeof content === "string") {
      const fileUri = `${exportDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await shareFileToDocuments(fileUri, mimeType, "public.data");
      return { uri: fileUri, usedSaf: false };
    }
    const fileUri = `${exportDirectory}${fileName}`;
    await FileSystem.copyAsync({ from: content.uri, to: fileUri });
    await shareFileToDocuments(fileUri, mimeType, "public.data");
    return { uri: fileUri, usedSaf: false };
  }
}

async function shareFileToDocuments(
  fileUri: string,
  mimeType: string,
  uti: string,
): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Sharing is not available on this device.");
  }
  await Sharing.shareAsync(fileUri, { mimeType, UTI: uti });
}

export default function DataExportScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { wallets } = useWallet();
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(() => new Date());
  const [activePicker, setActivePicker] = useState<"start" | "end" | null>(
    null,
  );
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [selectedWalletIds, setSelectedWalletIds] = useState<Set<string>>(
    new Set(),
  );
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [generalError, setGeneralError] = useState("");
  const [exporting, setExporting] = useState(false);
  const didInitWallets = useRef(false);

  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets],
  );

  useEffect(() => {
    if (!didInitWallets.current && wallets.length > 0) {
      didInitWallets.current = true;
      setSelectedWalletIds(new Set(wallets.map((wallet) => wallet.id)));
      return;
    }
    if (wallets.length === 0) {
      setSelectedWalletIds(new Set());
      return;
    }
    setSelectedWalletIds((prev) => {
      const next = new Set<string>();
      const currentIds = new Set(wallets.map((wallet) => wallet.id));
      prev.forEach((id) => {
        if (currentIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [wallets]);

  const selectedWallets = useMemo(
    () => wallets.filter((wallet) => selectedWalletIds.has(wallet.id)),
    [wallets, selectedWalletIds],
  );

  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (_event.type === "dismissed") {
      if (Platform.OS !== "ios") setActivePicker(null);
      return;
    }
    if (!selected) return;
    if (activePicker === "start") {
      setStartDate(selected);
    }
    if (activePicker === "end") {
      setEndDate(selected);
    }
    if (Platform.OS !== "ios") setActivePicker(null);
  };

  const toggleWalletSelection = (walletId: string) => {
    setSelectedWalletIds((prev) => {
      const next = new Set(prev);
      if (next.has(walletId)) next.delete(walletId);
      else next.add(walletId);
      return next;
    });
  };

  const selectAllWallets = () => {
    setSelectedWalletIds(new Set(wallets.map((wallet) => wallet.id)));
  };

  const validateRange = () => {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);
    if (end.getTime() < start.getTime()) {
      return "End date must be after start date.";
    }
    if (end.getTime() - start.getTime() < DAY_MS) {
      return "Select at least a 1-day range (end date must be after start date).";
    }
    if (startOfDay(endDate).getTime() > startOfDay(new Date()).getTime()) {
      return "End date cannot be in the future.";
    }
    if (selectedWalletIds.size === 0) {
      return "Select at least one wallet to export.";
    }
    return "";
  };

  const handleExport = async () => {
    if (!user) {
      setGeneralError("No authenticated user found.");
      return;
    }

    const validation = validateRange();
    if (validation) {
      setGeneralError(validation);
      return;
    }

    setGeneralError("");
    setExporting(true);

    try {
      const rangeStart = startOfDay(startDate);
      const rangeEnd = endOfDay(endDate);
      const walletExports = await Promise.all(
        selectedWallets.map(async (wallet) => {
          const [beforeTxs, rangeTxs] = await Promise.all([
            getTransactionsBeforeDate(user.uid, wallet.id, rangeStart),
            getTransactionsInRange(user.uid, wallet.id, rangeStart, rangeEnd),
          ]);
          const openingBalance =
            wallet.initialBalance + sumTransactionEffects(beforeTxs);
          const closingBalance =
            openingBalance + sumTransactionEffects(rangeTxs);
          return {
            wallet,
            rangeTxs,
            openingBalance,
            closingBalance,
            currentBalance: wallet.initialBalance + wallet.balance,
          };
        }),
      );

      const allRangeTransactions = walletExports.flatMap(
        (entry) => entry.rangeTxs,
      );

      let totalIncome = 0;
      let totalExpenses = 0;
      allRangeTransactions.forEach((tx) => {
        if (tx.type === "income") totalIncome += tx.amount;
        else totalExpenses += tx.amount;
      });

      const summaries: WalletExportSummary[] = walletExports.map((entry) => ({
        wallet: entry.wallet,
        openingBalance: entry.openingBalance,
        closingBalance: entry.closingBalance,
        currentBalance: entry.currentBalance,
      }));

      const openingRows = buildOpeningRows(summaries, rangeStart);
      const transactionRows = buildTransactionRows(
        allRangeTransactions,
        walletMap,
      );
      const closingRows = buildClosingRows(summaries, rangeEnd);
      const exportRows = [...openingRows, ...transactionRows, ...closingRows];

      const baseName = `walletx-export-${formatFileDate(
        rangeStart,
      )}-to-${formatFileDate(rangeEnd)}`;
      const rootDirectory = FileSystem.documentDirectory ?? "";

      if (!rootDirectory) {
        throw new Error("Export directory is not available.");
      }

      const exportDirectory = `${rootDirectory}WalletX/`;
      const dirInfo = await FileSystem.getInfoAsync(exportDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(exportDirectory, {
          intermediates: true,
        });
      }

      if (exportFormat === "csv") {
        const csvContent = buildCsvContent(exportRows);
        const fileName = `${baseName}.csv`;
        if (Platform.OS === "android") {
          const result = await saveWithAndroidFallback(
            fileName,
            "text/csv",
            csvContent,
            exportDirectory,
          );
          Alert.alert(
            result.usedSaf ? "Export Saved" : "Export Ready",
            result.usedSaf
              ? `CSV saved to ${result.uri}`
              : "Choose Files to save the CSV.",
          );
        } else {
          const fileUri = `${exportDirectory}${fileName}`;
          await FileSystem.writeAsStringAsync(fileUri, csvContent, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          await shareFileToDocuments(
            fileUri,
            "text/csv",
            "public.comma-separated-values-text",
          );
          Alert.alert("Export Ready", "Choose Files to save the CSV.");
        }
      } else if (exportFormat === "json") {
        const payload = {
          summary: {
            generatedAt: new Date().toISOString(),
            dateRange: {
              start: rangeStart.toISOString(),
              end: rangeEnd.toISOString(),
            },
            wallets: summaries.map((entry) => ({
              id: entry.wallet.id,
              name: entry.wallet.name,
              openingBalance: entry.openingBalance,
              closingBalance: entry.closingBalance,
              currentBalance: entry.currentBalance,
            })),
            totals: {
              income: totalIncome,
              expenses: totalExpenses,
              net: totalIncome - totalExpenses,
            },
          },
          rows: exportRows.map((row) => ({
            rowType: row.rowType,
            transactionDate: row.date.toISOString(),
            transactionTime: row.time,
            transactionType: row.type,
            transactionNote: row.note,
            transactionAmount: row.amount,
            category: row.category,
            walletName: row.walletName,
            currentWalletBalance: row.walletBalance,
          })),
        };
        const jsonContent = JSON.stringify(payload, null, 2);
        const fileName = `${baseName}.json`;
        if (Platform.OS === "android") {
          const result = await saveWithAndroidFallback(
            fileName,
            "application/json",
            jsonContent,
            exportDirectory,
          );
          Alert.alert(
            result.usedSaf ? "Export Saved" : "Export Ready",
            result.usedSaf
              ? `JSON saved to ${result.uri}`
              : "Choose Files to save the JSON.",
          );
        } else {
          const fileUri = `${exportDirectory}${fileName}`;
          await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          await shareFileToDocuments(
            fileUri,
            "application/json",
            "public.json",
          );
          Alert.alert("Export Ready", "Choose Files to save the JSON.");
        }
      } else {
        const html = buildPdfHtml(
          rangeStart,
          rangeEnd,
          summaries.map((entry) => entry.wallet.name),
          totalIncome,
          totalExpenses,
          exportRows,
        );
        const pdf = await Print.printToFileAsync({ html });
        await shareFileToDocuments(pdf.uri, "application/pdf", "com.adobe.pdf");
        Alert.alert("Export Ready", "Choose Files to send or save the PDF.");
      }
    } catch (error: any) {
      setGeneralError(error?.message ?? "Export failed. Try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={Colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Data Export</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Date Range</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setActivePicker("start")}
            >
              <MaterialCommunityIcons
                name="calendar-blank"
                size={18}
                color={Colors.textMuted}
              />
              <View>
                <Text style={styles.dateLabel}>Start</Text>
                <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setActivePicker("end")}
            >
              <MaterialCommunityIcons
                name="calendar-blank"
                size={18}
                color={Colors.textMuted}
              />
              <View>
                <Text style={styles.dateLabel}>End</Text>
                <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
              </View>
            </TouchableOpacity>
          </View>
          {activePicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={activePicker === "start" ? startDate : endDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Wallets</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={selectAllWallets}>
              <Text style={styles.linkText}>Select all</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            {selectedWallets.length > 0
              ? `${selectedWallets.length} selected`
              : "No wallets selected"}
          </Text>
          <TouchableOpacity
            style={styles.selectWalletsBtn}
            onPress={() => setWalletModalVisible(true)}
          >
            <MaterialCommunityIcons
              name="wallet-outline"
              size={20}
              color={Colors.text}
            />
            <Text style={styles.selectWalletsText}>Choose wallets</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={Colors.textDim}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          <View style={styles.formatRow}>
            {(["csv", "json", "pdf"] as ExportFormat[]).map((format) => {
              const active = exportFormat === format;
              return (
                <TouchableOpacity
                  key={format}
                  style={[styles.formatBtn, active && styles.formatBtnActive]}
                  onPress={() => setExportFormat(format)}
                >
                  <Text
                    style={[
                      styles.formatText,
                      active && styles.formatTextActive,
                    ]}
                  >
                    {format.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <ErrorMessage message={generalError} />

        <GradientButton
          label={exporting ? "Exporting..." : "Export Data"}
          onPress={handleExport}
          loading={exporting}
          disabled={exporting}
          style={styles.exportBtn}
        />
      </ScrollView>

      <Modal
        visible={walletModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Wallets</Text>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setWalletModalVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={Colors.text}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={wallets}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => {
                const selected = selectedWalletIds.has(item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.walletRow,
                      selected && styles.walletRowSelected,
                    ]}
                    onPress={() => toggleWalletSelection(item.id)}
                  >
                    <View style={styles.walletIcon}>
                      <MaterialCommunityIcons
                        name="wallet"
                        size={20}
                        color={Colors.accent1}
                      />
                    </View>
                    <View style={styles.walletInfo}>
                      <Text style={styles.walletName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.walletMeta}>
                        Balance{" "}
                        {formatCurrency(item.initialBalance + item.balance)}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={
                        selected
                          ? "check-circle"
                          : "checkbox-blank-circle-outline"
                      }
                      size={20}
                      color={selected ? Colors.accent1 : Colors.textDim}
                    />
                  </TouchableOpacity>
                );
              }}
            />
            <GradientButton
              label="Done"
              onPress={() => setWalletModalVisible(false)}
              style={styles.modalBtn}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerSpacer: { width: 40 },
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadow.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  dateRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  dateLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  dateValue: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  pickerWrap: {
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  linkBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
  },
  linkText: {
    color: Colors.accent2,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  selectWalletsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  selectWalletsText: {
    flex: 1,
    marginLeft: Spacing.sm,
    color: Colors.text,
    fontSize: FontSize.sm,
  },
  formatRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  formatBtnActive: {
    backgroundColor: Colors.accent1,
    borderColor: Colors.accent1,
  },
  formatText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  formatTextActive: {
    color: Colors.white,
  },
  exportBtn: {
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingBottom: Spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  modalList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  walletRowSelected: {
    borderColor: Colors.accent1,
    backgroundColor: Colors.accentGlow,
  },
  walletIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    marginRight: Spacing.md,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  walletMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  modalBtn: {
    marginHorizontal: Spacing.lg,
  },
});
