/**
 * HoudeKharcha — Private INR Expense Tracker
 * Single-file Expo app with Bento Dashboard, Swipeable Edit/Delete & Month Grouping
 *
 * Dependencies:
 *   expo-haptics, @react-native-async-storage/async-storage,
 *   react-native-view-shot, expo-sharing, lucide-react-native,
 *   react-native-svg, react-native-gesture-handler,
 *   @react-native-community/datetimepicker
 *
 * Install:
 *   npx expo install @react-native-async-storage/async-storage expo-haptics \
 *     expo-sharing react-native-view-shot lucide-react-native react-native-svg \
 *     react-native-gesture-handler @react-native-community/datetimepicker
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {
  GestureHandlerRootView,
  Swipeable,
} from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ShoppingCart,
  Fuel,
  Coffee,
  Home,
  Stethoscope,
  Clapperboard,
  Layers,
  Plus,
  Share2,
  X,
  CheckCircle,
  TrendingUp,
  Calendar,
  IndianRupee,
  Pencil,
  Trash2,
  ChevronDown,
} from 'lucide-react-native';

// ─── Web-safe haptics helper ──────────────────────────────────────────────────
const haptic = (fn) => { if (Platform.OS !== 'web') { fn(); } };

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const STORAGE_KEY = '@houde_kharcha_expenses';
const DAILY_LIMIT = 500;

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  accent: '#10B981',
  accentDim: '#065F46',
  accentGlow: 'rgba(16,185,129,0.15)',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  danger: '#F87171',
  dangerDim: '#7F1D1D',
  editBlue: '#60A5FA',
  editBlueDim: '#1E3A5F',
  warn: '#FBBF24',
  border: 'rgba(148,163,184,0.08)',
  borderAccent: 'rgba(16,185,129,0.3)',
};

const CATEGORIES = [
  { label: 'Groceries',      icon: 'shopping-cart', color: '#34D399' },
  { label: 'Fuel/Transport', icon: 'fuel',           color: '#60A5FA' },
  { label: 'Dining/Chai',    icon: 'coffee',         color: '#F59E0B' },
  { label: 'Rent/Bills',     icon: 'home',           color: '#A78BFA' },
  { label: 'Health',         icon: 'stethoscope',    color: '#F87171' },
  { label: 'Entertainment',  icon: 'clapperboard',   color: '#FB923C' },
  { label: 'Others',         icon: 'layers',         color: '#94A3B8' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (n) =>
  '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStr = () => new Date().toISOString().slice(0, 7);

const getCategoryMeta = (label) =>
  CATEGORIES.find((c) => c.label === label) || CATEGORIES[6];

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
};

const monthLabel = (isoPrefix) => {
  const [year, month] = isoPrefix.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

// Smart label: "Today", "Yesterday", or formatted date
const smartDateLabel = (date) => {
  const d  = new Date(date);
  const t  = new Date();
  const ds = d.toISOString().slice(0, 10);
  const ts = t.toISOString().slice(0, 10);
  const yesterday = new Date(t);
  yesterday.setDate(t.getDate() - 1);
  const ys = yesterday.toISOString().slice(0, 10);
  if (ds === ts) return 'Today';
  if (ds === ys) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Group expenses by YYYY-MM, sorted newest month first
const groupByMonth = (expenses) => {
  const map = {};
  expenses.forEach((e) => {
    const key = e.date.slice(0, 7);
    if (!map[key]) map[key] = [];
    map[key].push(e);
  });
  return Object.keys(map)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => ({
      monthKey: key,
      label: monthLabel(key),
      data: map[key].sort((a, b) => b.date.localeCompare(a.date)),
    }));
};

// ─── Category Icon ────────────────────────────────────────────────────────────

function CategoryIcon({ iconKey, size = 18, color = COLORS.accent }) {
  const props = { size, color, strokeWidth: 2 };
  switch (iconKey) {
    case 'shopping-cart': return <ShoppingCart {...props} />;
    case 'fuel':          return <Fuel {...props} />;
    case 'coffee':        return <Coffee {...props} />;
    case 'home':          return <Home {...props} />;
    case 'stethoscope':   return <Stethoscope {...props} />;
    case 'clapperboard':  return <Clapperboard {...props} />;
    default:              return <Layers {...props} />;
  }
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color = COLORS.accent }) {
  const pct = Math.min(value / max, 1);
  const barColor = pct > 0.9 ? COLORS.danger : pct > 0.7 ? COLORS.warn : color;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]} />
    </View>
  );
}

// ─── Add / Edit Expense Modal ─────────────────────────────────────────────────

function ExpenseModal({ visible, onClose, onSave, editingExpense }) {
  const isEditing = !!editingExpense;
  const [amount, setAmount]           = useState('');
  const [note, setNote]               = useState('');
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker]   = useState(false);
  const [success, setSuccess]         = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      setSuccess(false);
      setShowPicker(false);
      if (isEditing) {
        setAmount(String(editingExpense.amount));
        setNote(editingExpense.note || '');
        setSelectedCat(getCategoryMeta(editingExpense.category));
        setSelectedDate(new Date(editingExpense.date));
      } else {
        setAmount('');
        setNote('');
        setSelectedCat(CATEGORIES[0]);
        setSelectedDate(new Date());
      }
      Animated.spring(scaleAnim, {
        toValue: 1, useNativeDriver: true, tension: 120, friction: 8,
      }).start();
    } else {
      scaleAnim.setValue(0.92);
    }
  }, [visible, editingExpense]);

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
      return;
    }
    // Build ISO date string from selectedDate but preserve time-of-day as noon
    // so date grouping is always correct regardless of timezone
    const dateISO = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      12, 0, 0
    ).toISOString();

    const expense = isEditing
      ? { ...editingExpense, amount: parsed, note: note.trim(), category: selectedCat.label, date: dateISO }
      : {
          id: Date.now().toString(),
          amount: parsed,
          note: note.trim(),
          category: selectedCat.label,
          date: dateISO,
        };
    await onSave(expense, isEditing);
    setSuccess(true);
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    setTimeout(() => onClose(), 900);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {success ? (
            <View style={styles.successState}>
              <CheckCircle size={48} color={COLORS.accent} />
              <Text style={styles.successText}>{isEditing ? 'Updated!' : 'Added!'}</Text>
            </View>
          ) : (
            <>
              <View style={styles.amountRow}>
                <IndianRupee size={28} color={COLORS.accent} strokeWidth={2.5} />
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.textDim}
                  autoFocus
                />
              </View>

              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (optional)"
                placeholderTextColor={COLORS.textDim}
                returnKeyType="done"
              />

              {/* Date picker */}
              {Platform.OS === 'web' ? (
                <View style={styles.datePicker}>
                  <Calendar size={16} color={COLORS.accent} strokeWidth={2} />
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [y, m, d] = e.target.value.split('-').map(Number);
                        setSelectedDate(new Date(y, m - 1, d, 12));
                      }
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      color: '#F1F5F9',
                      border: 'none',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      marginLeft: 8,
                      cursor: 'pointer',
                      colorScheme: 'dark',
                    }}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.datePicker}
                    onPress={() => { haptic(() => Haptics.selectionAsync()); setShowPicker(true); }}
                    activeOpacity={0.8}
                  >
                    <Calendar size={16} color={COLORS.accent} strokeWidth={2} />
                    <Text style={styles.datePickerText}>{smartDateLabel(selectedDate)}</Text>
                    <ChevronDown size={16} color={COLORS.textMuted} strokeWidth={2} />
                  </TouchableOpacity>
                  {showPicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                      maximumDate={new Date()}
                      themeVariant="dark"
                      onChange={(event, date) => {
                        if (Platform.OS === 'android') setShowPicker(false);
                        if (event.type !== 'dismissed' && date) {
                          haptic(() => Haptics.selectionAsync());
                          setSelectedDate(date);
                        }
                      }}
                    />
                  )}
                </>
              )}

              <Text style={styles.sectionLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {CATEGORIES.map((cat) => {
                  const active = cat.label === selectedCat.label;
                  return (
                    <TouchableOpacity
                      key={cat.label}
                      style={[styles.catChip, active && { borderColor: cat.color, backgroundColor: cat.color + '22' }]}
                      onPress={() => { haptic(() => Haptics.selectionAsync()); setSelectedCat(cat); }}
                    >
                      <CategoryIcon iconKey={cat.icon} size={15} color={active ? cat.color : COLORS.textMuted} />
                      <Text style={[styles.catChipLabel, active && { color: cat.color }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity style={styles.addBtn} onPress={handleSave} activeOpacity={0.85}>
                {isEditing
                  ? <Pencil size={16} color="#000" strokeWidth={2.5} />
                  : <Plus size={18} color="#000" strokeWidth={2.5} />}
                <Text style={styles.addBtnText}>{isEditing ? 'Update Expense' : 'Add Expense'}</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Swipeable Transaction Row ────────────────────────────────────────────────

function TxRow({ exp, onEdit, onDelete }) {
  const meta = getCategoryMeta(exp.category);
  const swipeRef = useRef(null);

  const close = () => swipeRef.current?.close();

  const renderRightActions = (progress) => {
    const editTrans = progress.interpolate({ inputRange: [0, 1], outputRange: [140, 0] });
    const delTrans  = progress.interpolate({ inputRange: [0, 1], outputRange: [70,  0] });
    return (
      <View style={styles.swipeActions}>
        <Animated.View style={{ transform: [{ translateX: editTrans }] }}>
          <TouchableOpacity
            style={[styles.swipeBtn, styles.swipeEdit]}
            onPress={() => { close(); onEdit(exp); }}
            activeOpacity={0.8}
          >
            <Pencil size={16} color="#fff" strokeWidth={2.5} />
            <Text style={styles.swipeBtnText}>Edit</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ transform: [{ translateX: delTrans }] }}>
          <TouchableOpacity
            style={[styles.swipeBtn, styles.swipeDelete]}
            onPress={() => {
              close();
              haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
              if (Platform.OS === 'web') {
                // window.confirm is blocked inside iframes; skip dialog and delete directly
                onDelete(exp.id);
              } else {
                Alert.alert(
                  'Delete Expense',
                  'Are you sure you want to delete this expense?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => onDelete(exp.id) },
                  ]
                );
              }
            }}
            activeOpacity={0.8}
          >
            <Trash2 size={16} color="#fff" strokeWidth={2.5} />
            <Text style={styles.swipeBtnText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      onSwipeableWillOpen={() => haptic(() => Haptics.selectionAsync())}
    >
      <View style={styles.txRow}>
        <View style={[styles.txIcon, { backgroundColor: meta.color + '22' }]}>
          <CategoryIcon iconKey={meta.icon} size={16} color={meta.color} />
        </View>
        <View style={styles.txMeta}>
          <Text style={styles.txCategory}>{exp.category}</Text>
          {exp.note ? <Text style={styles.txNote} numberOfLines={1}>{exp.note}</Text> : null}
          <Text style={styles.txDate}>{fmtDate(exp.date)}</Text>
        </View>
        <Text style={styles.txAmount}>{formatINR(exp.amount)}</Text>
      </View>
    </Swipeable>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [expenses, setExpenses]             = useState([]);
  const [modalVisible, setModalVisible]     = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const dashRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setExpenses(JSON.parse(raw));
      } catch (e) { console.warn('Load error', e); }
    })();
  }, []);

  const persist = useCallback(async (list) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
    catch (e) { console.warn('Save error', e); }
  }, []);

  const handleSave = useCallback(async (expense, isEditing) => {
    const updated = isEditing
      ? expenses.map((e) => e.id === expense.id ? expense : e)
      : [expense, ...expenses];
    setExpenses(updated);
    await persist(updated);
  }, [expenses, persist]);

  const handleDelete = useCallback(async (id) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    await persist(updated);
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }, [expenses, persist]);

  const openEdit = useCallback((exp) => { setEditingExpense(exp); setModalVisible(true); }, []);
  const openAdd  = useCallback(() => { setEditingExpense(null); setModalVisible(true); }, []);
  const closeModal = useCallback(() => { setModalVisible(false); setEditingExpense(null); }, []);

  // ── Derived stats — auto-scoped to today / this month ──
  const today = todayStr();
  const month = monthStr();

  const monthTotal    = expenses.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0);
  const todayExpenses = expenses.filter((e) => e.date.startsWith(today));
  const dailyTotal    = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const txToday       = todayExpenses.length;
  const grouped       = groupByMonth(expenses);

  // ── Share ──
  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      const uri = await captureRef(dashRef, { format: 'png', quality: 0.95 });
      if (Platform.OS === 'web') {
        // Web: open the captured image in a new tab — user can save from there
        window.open(uri, '_blank');
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share HoudeKharcha Summary' });
        } else {
          Alert.alert('Sharing not available on this device.');
        }
      }
    } catch (e) { Alert.alert('Could not capture dashboard', e.message); }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appName}>HoudeKharcha</Text>
            <Text style={styles.appSub}>होउ दे खर्च · Private Tracker</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Share2 size={16} color={COLORS.accent} />
            <Text style={styles.shareBtnText}>Export</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Bento Summary (captured for share) ── */}
          <View ref={dashRef} collapsable={false} style={styles.bentoWrapper}>
            <View style={styles.brandStripe}>
              <Text style={styles.brandText}>
                HoudeKharcha · {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
            </View>

            {/* Card A — Monthly Total */}
            <View style={[styles.card, styles.cardFull, styles.cardAccentBorder]}>
              <View style={styles.cardHeader}>
                <TrendingUp size={16} color={COLORS.accent} />
                <Text style={styles.cardLabel}>Monthly Total</Text>
              </View>
              <Text style={styles.monthTotal}>{formatINR(monthTotal)}</Text>
              <Text style={styles.cardSub}>
                {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
            </View>

            {/* Cards B + C */}
            <View style={styles.halfRow}>
              <View style={[styles.card, styles.cardHalf]}>
                <View style={styles.cardHeader}>
                  <IndianRupee size={14} color={COLORS.textMuted} />
                  <Text style={styles.cardLabel}>Today's Spend</Text>
                </View>
                <Text style={[styles.halfTotal, dailyTotal > DAILY_LIMIT && { color: COLORS.danger }]}>
                  {formatINR(dailyTotal)}
                </Text>
                <Text style={styles.limitLabel}>of ₹500 limit</Text>
                <ProgressBar value={dailyTotal} max={DAILY_LIMIT} />
              </View>

              <View style={[styles.card, styles.cardHalf]}>
                <View style={styles.cardHeader}>
                  <Calendar size={14} color={COLORS.textMuted} />
                  <Text style={styles.cardLabel}>Txns Today</Text>
                </View>
                <Text style={styles.halfTotal}>{txToday}</Text>
                <Text style={styles.limitLabel}>transactions</Text>
                <View style={styles.txDots}>
                  {Array.from({ length: Math.min(txToday, 7) }).map((_, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: CATEGORIES[i % CATEGORIES.length].color }]} />
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ── Card D — Month-Grouped Transaction History ── */}
          <View style={[styles.card, styles.cardFull, { marginTop: 0 }]}>
            <View style={styles.cardHeader}>
              <Layers size={16} color={COLORS.textMuted} />
              <Text style={styles.cardLabel}>History</Text>
              <Text style={styles.histCount}>{expenses.length} entries</Text>
            </View>

            {expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🪙</Text>
                <Text style={styles.emptyText}>No expenses yet.</Text>
                <Text style={styles.emptyHint}>Tap + to record your first one.</Text>
              </View>
            ) : (
              grouped.map((group) => (
                <View key={group.monthKey}>
                  {/* Month separator */}
                  <View style={styles.monthHeader}>
                    <Text style={styles.monthHeaderText}>{group.label.toUpperCase()}</Text>
                    <View style={styles.monthHeaderLine} />
                    <Text style={styles.monthHeaderTotal}>
                      {formatINR(group.data.reduce((s, e) => s + e.amount, 0))}
                    </Text>
                  </View>

                  {group.data.map((exp) => (
                    <TxRow key={exp.id} exp={exp} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
                </View>
              ))
            )}

            <Text style={styles.swipeHint}>← Swipe left on any entry to edit or delete</Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── FAB ── */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => { haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)); openAdd(); }}
          activeOpacity={0.85}
        >
          <Plus size={26} color="#000" strokeWidth={2.8} />
        </TouchableOpacity>

        {/* ── Add / Edit Modal ── */}
        <ExpenseModal
          visible={modalVisible}
          onClose={closeModal}
          onSave={handleSave}
          editingExpense={editingExpense}
        />
      </View>
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GAP    = 10;
const CARD_W = (SCREEN_W - 24 * 2 - GAP) / 2;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
  },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  appSub:  { fontSize: 11, color: COLORS.textDim, marginTop: 2, letterSpacing: 0.3 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1, borderColor: COLORS.borderAccent,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  shareBtnText: { color: COLORS.accent, fontWeight: '600', fontSize: 13 },

  scroll: { paddingHorizontal: 24, paddingTop: 4 },

  // Bento
  bentoWrapper: { backgroundColor: COLORS.bg, borderRadius: 16, overflow: 'hidden', marginBottom: GAP },
  brandStripe: {
    backgroundColor: COLORS.accentDim,
    paddingVertical: 6, paddingHorizontal: 14, marginBottom: GAP, borderRadius: 8,
  },
  brandText: { color: COLORS.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardFull:         { width: '100%', marginBottom: GAP },
  cardAccentBorder: { borderColor: COLORS.borderAccent },
  halfRow:          { flexDirection: 'row', gap: GAP, marginBottom: GAP },
  cardHalf:         { flex: 1 },
  cardHeader:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  histCount:  { color: COLORS.textDim, fontSize: 11 },
  monthTotal: { fontSize: 38, fontWeight: '900', color: COLORS.accent, letterSpacing: -1, lineHeight: 44 },
  cardSub:    { color: COLORS.textDim, fontSize: 12, marginTop: 4 },
  halfTotal:  { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  limitLabel: { color: COLORS.textDim, fontSize: 11, marginTop: 2, marginBottom: 10 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(148,163,184,0.12)', overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2 },
  txDots: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  dot:    { width: 8, height: 8, borderRadius: 4 },

  // Month group header
  monthHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 6 },
  monthHeaderText:  { color: COLORS.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  monthHeaderLine:  { flex: 1, height: 1, backgroundColor: COLORS.borderAccent },
  monthHeaderTotal: { color: COLORS.accent, fontSize: 12, fontWeight: '700' },

  // Swipeable row
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: 12,
    backgroundColor: COLORS.card,
  },
  txIcon:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txMeta:     { flex: 1 },
  txCategory: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  txNote:     { color: COLORS.textMuted, fontSize: 12, marginTop: 1 },
  txDate:     { color: COLORS.textDim, fontSize: 11, marginTop: 2 },
  txAmount:   { color: COLORS.accent, fontWeight: '700', fontSize: 15 },

  swipeActions: { flexDirection: 'row', alignItems: 'stretch' },
  swipeBtn:   { width: 70, alignItems: 'center', justifyContent: 'center', gap: 4 },
  swipeEdit:  { backgroundColor: COLORS.editBlueDim },
  swipeDelete:{ backgroundColor: COLORS.dangerDim },
  swipeBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  swipeHint: { color: COLORS.textDim, fontSize: 10, textAlign: 'center', marginTop: 14, letterSpacing: 0.3 },

  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 6 },
  emptyEmoji: { fontSize: 36 },
  emptyText:  { color: COLORS.textMuted, fontSize: 15, fontWeight: '600' },
  emptyHint:  { color: COLORS.textDim, fontSize: 12 },

  // FAB
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 10,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, borderWidth: 1, borderColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: COLORS.borderAccent,
    paddingBottom: 8, marginBottom: 16, gap: 6,
  },
  amountInput: { flex: 1, fontSize: 40, fontWeight: '900', color: COLORS.text, letterSpacing: -1 },
  noteInput: {
    backgroundColor: COLORS.bg, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.text, fontSize: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 20,
  },
  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    marginBottom: 16,
  },
  datePickerText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8, marginRight: 8,
    backgroundColor: COLORS.bg,
  },
  catChipLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 16,
  },
  addBtnText:  { color: '#000', fontWeight: '800', fontSize: 16, letterSpacing: -0.2 },
  successState:{ alignItems: 'center', paddingVertical: 36, gap: 12 },
  successText: { color: COLORS.accent, fontSize: 20, fontWeight: '800' },
});
