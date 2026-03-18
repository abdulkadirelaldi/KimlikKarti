/**
 * Developer ID Card — App.js
 *
 * Gamified developer identity card with XP system, level progression,
 * achievement badges, and Glassmorphism design.
 *
 * Architecture: single-file, logically layered —
 *   Constants → Pure Helpers → UI Components → Root App → StyleSheet
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const XP_PER_HIRE = 120;

/** Minimum XP to reach each level (index 0 = Level 1) */
const LEVEL_THRESHOLDS = [0, 300, 700, 1300, 2100, 3200];

const ALL_BADGES = [
  { id: 'first',   minHires: 1,  emoji: '🚀', label: 'First Contact'   },
  { id: 'trusted', minHires: 3,  emoji: '💎', label: 'Trusted Dev'     },
  { id: 'senior',  minHires: 5,  emoji: '⭐', label: 'Senior Unlocked' },
  { id: 'legend',  minHires: 10, emoji: '🏆', label: 'Legend Status'   },
];

const BG_PALETTES = [
  { bg: '#0f0c29', blob1: '#302b63', blob2: '#24243e' },
  { bg: '#0d1117', blob1: '#162032', blob2: '#1a1a2e' },
  { bg: '#0a0a12', blob1: '#1a0533', blob2: '#2d1b69' },
  { bg: '#111827', blob1: '#1f2937', blob2: '#0f172a' },
  { bg: '#0c1445', blob1: '#1a2980', blob2: '#134e5e' },
  { bg: '#1a0a0a', blob1: '#7b2d2d', blob2: '#4a1942' },
];

const COLORS = {
  accent:      '#7c5cfc',
  accentBusy:  '#ff6b6b',
  glassBase:   'rgba(255, 255, 255, 0.07)',
  glassBorder: 'rgba(255, 255, 255, 0.13)',
  glassXp:     'rgba(255, 255, 255, 0.09)',
  textPrimary: '#f0f0f0',
  textMuted:   '#8a8aa0',
  green:       '#22c55e',
};

// ─── Pure Domain Helpers ─────────────────────────────────────────────────────

const getLevel = (xp) => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

const getLevelBounds = (level) => ({
  current: LEVEL_THRESHOLDS[level - 1] ?? 0,
  next:    LEVEL_THRESHOLDS[level]     ?? null, // null = max level
});

const getUnlockedBadges = (hireCount) =>
  ALL_BADGES.filter((b) => hireCount >= b.minHires);

const getInitials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// ─── AvatarInitials ──────────────────────────────────────────────────────────

const AvatarInitials = ({ name }) => (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>{getInitials(name)}</Text>
    <View style={styles.onlineDot} />
  </View>
);

// ─── XpBar ───────────────────────────────────────────────────────────────────

const XpBar = ({ xp, level }) => {
  const { current, next } = getLevelBounds(level);
  const progress = next
    ? Math.min((xp - current) / (next - current), 1)
    : 1;

  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue:         progress,
      tension:         60,
      friction:        7,
      useNativeDriver: false,
    }).start();
  }, [progress, fillAnim]);

  const fillWidth = fillAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.xpBarOuter}>
      <View style={styles.xpBarTrack}>
        <Animated.View style={[styles.xpBarFill, { width: fillWidth }]} />
      </View>
      <Text style={styles.xpBarLabel}>
        {next
          ? `${xp - current} / ${next - current} XP → Lv.${level + 1}`
          : '✨ MAX LEVEL'}
      </Text>
    </View>
  );
};

// ─── StatsBoard ──────────────────────────────────────────────────────────────

const StatItem = ({ value, label }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const StatsBoard = ({ xp, level, hireCount }) => (
  <View style={styles.statsRow}>
    <StatItem value={level}     label="LEVEL" />
    <View style={styles.statSep} />
    <StatItem value={xp}        label="XP"    />
    <View style={styles.statSep} />
    <StatItem value={hireCount} label="HIRES" />
  </View>
);

// ─── BadgeDisplay ────────────────────────────────────────────────────────────

const BadgeDisplay = ({ badges }) => {
  if (badges.length === 0) return null;

  return (
    <View style={styles.badgeRow}>
      {badges.map((b) => (
        <View key={b.id} style={styles.badgePill}>
          <Text style={styles.badgeEmoji}>{b.emoji}</Text>
          <Text style={styles.badgeLabel}>{b.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── ActionButton ────────────────────────────────────────────────────────────

const ActionButton = ({ musaitMi, onPress }) => {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(pressAnim, {
      toValue:         0.94,
      tension:         200,
      friction:        5,
      useNativeDriver: true,
    }).start();

  const handlePressOut = () =>
    Animated.spring(pressAnim, {
      toValue:         1,
      tension:         100,
      friction:        8,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
      <TouchableOpacity
        style={[
          styles.actionBtn,
          musaitMi ? styles.actionBtnAvail : styles.actionBtnBusy,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Text style={styles.actionBtnText}>
          {musaitMi ? '⚡  İşe Al' : '🔄  Projelerde Çalışıyor'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── ProfileCard ─────────────────────────────────────────────────────────────

const ProfileCard = ({
  ad,
  uzmanlik,
  musaitMi,
  seviye,
  xp,
  hireCount,
  badges,
  cardAnimStyle,
  onHirePress,
}) => (
  <Animated.View style={[styles.card, cardAnimStyle]}>
    {/* ── Header ── */}
    <View style={styles.cardHeader}>
      <AvatarInitials name={ad} />
      <View style={styles.headerMeta}>
        <Text style={styles.nameText}>{ad}</Text>
        <Text style={styles.uzmanlikText}>{uzmanlik}</Text>
        <View
          style={[
            styles.statusPill,
            musaitMi ? styles.pillAvail : styles.pillBusy,
          ]}
        >
          <Text style={styles.statusText}>
            {musaitMi ? '● Available' : '● In Project'}
          </Text>
        </View>
      </View>
    </View>

    <View style={styles.divider} />

    {/* ── Body ── */}
    <StatsBoard xp={xp} level={seviye} hireCount={hireCount} />
    <XpBar xp={xp} level={seviye} />
    <BadgeDisplay badges={badges} />

    {/* ── CTA ── */}
    <ActionButton musaitMi={musaitMi} onPress={onHirePress} />
  </Animated.View>
);

// ─── App (Root) ───────────────────────────────────────────────────────────────

const DEFAULT_AD       = 'Abdulkadir';
const DEFAULT_UZMANLIK = 'Full-Stack & Gömülü Sistemler\nSpectraloop / Sea Stars — Takım Lideri';
const DEFAULT_SEVIYE   = 1;

export default function App({
  ad       = DEFAULT_AD,
  uzmanlik = DEFAULT_UZMANLIK,
}) {
  // ── State ──
  const [musaitMi,     setMusaitMi]     = useState(true);
  const [deneyimPuani, setDeneyimPuani] = useState(0);
  const [seviye,       setSeviye]       = useState(DEFAULT_SEVIYE);
  const [hireCount,    setHireCount]    = useState(0);
  const [badges,       setBadges]       = useState([]);
  const [paletteIdx,   setPaletteIdx]   = useState(0);

  // ── Animation refs ──
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const cardShakeAnim = useRef(new Animated.Value(0)).current;

  // Subtle scale bounce: used on regular hire / release actions
  const triggerBounce = useCallback(() => {
    Animated.sequence([
      Animated.spring(cardScaleAnim, {
        toValue: 1.04, tension: 200, friction: 5, useNativeDriver: true,
      }),
      Animated.spring(cardScaleAnim, {
        toValue: 1, tension: 100, friction: 8, useNativeDriver: true,
      }),
    ]).start();
  }, [cardScaleAnim]);

  // Lateral shake: used exclusively on level-up events
  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(cardShakeAnim, { toValue:  1, duration:  60, useNativeDriver: true }),
      Animated.timing(cardShakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(cardShakeAnim, { toValue:  1, duration: 100, useNativeDriver: true }),
      Animated.timing(cardShakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(cardShakeAnim, { toValue:  0, duration:  60, useNativeDriver: true }),
    ]).start();
  }, [cardShakeAnim]);

  // ── Business logic ──
  const handleHirePress = useCallback(() => {
    if (!musaitMi) {
      // Project done → become available again
      setMusaitMi(true);
      triggerBounce();
      return;
    }

    // Accept new project → award XP, check level-up & new badges
    const newXp        = deneyimPuani + XP_PER_HIRE;
    const newLevel     = getLevel(newXp);
    const newHireCount = hireCount + 1;
    const didLevelUp   = newLevel > seviye;

    setMusaitMi(false);
    setDeneyimPuani(newXp);
    setHireCount(newHireCount);
    setBadges(getUnlockedBadges(newHireCount));

    if (didLevelUp) {
      setSeviye(newLevel);
      setPaletteIdx((i) => (i + 1) % BG_PALETTES.length);
      triggerShake();
    } else {
      triggerBounce();
    }
  }, [musaitMi, deneyimPuani, hireCount, seviye, triggerBounce, triggerShake]);

  // ── Derived values ──
  const palette = BG_PALETTES[paletteIdx];

  const cardAnimStyle = {
    transform: [
      { scale: cardScaleAnim },
      {
        translateX: cardShakeAnim.interpolate({
          inputRange:  [-1, 0, 1],
          outputRange: [-14, 0, 14],
        }),
      },
    ],
  };

  // ── Render ──
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Layered blob background — Glassmorphism backdrop */}
      <View style={[styles.bgBase, { backgroundColor: palette.bg }]} />
      <View style={[styles.bgBlob, styles.blobTL, { backgroundColor: palette.blob1 }]} />
      <View style={[styles.bgBlob, styles.blobBR, { backgroundColor: palette.blob2 }]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.appTag}>DEV ID CARD</Text>
        <Text style={styles.appTitle}>Yazılımcı Kimlik Kartı</Text>

        <ProfileCard
          ad={ad}
          uzmanlik={uzmanlik}
          musaitMi={musaitMi}
          seviye={seviye}
          xp={deneyimPuani}
          hireCount={hireCount}
          badges={badges}
          cardAnimStyle={cardAnimStyle}
          onHirePress={handleHirePress}
        />

        <Text style={styles.hint}>
          {musaitMi
            ? '"İşe Al" ile yeni bir projeye başla'
            : 'Proje bitince butona tekrar bas'}
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── StyleSheet — Glassmorphism Design System ────────────────────────────────

const styles = StyleSheet.create({
  // Root
  root: {
    flex: 1,
  },

  // ── Background blobs ──
  bgBase: {
    ...StyleSheet.absoluteFillObject,
  },
  bgBlob: {
    position:     'absolute',
    width:        SCREEN_WIDTH * 1.3,
    height:       SCREEN_WIDTH * 1.3,
    borderRadius: SCREEN_WIDTH * 0.65,
    opacity:      0.5,
  },
  blobTL: {
    top:  -SCREEN_WIDTH * 0.5,
    left: -SCREEN_WIDTH * 0.25,
  },
  blobBR: {
    bottom: -SCREEN_WIDTH * 0.55,
    right:  -SCREEN_WIDTH * 0.3,
  },

  // ── Scroll ──
  scroll: {
    flexGrow:          1,
    alignItems:        'center',
    paddingTop:        Platform.OS === 'ios' ? 64 : 44,
    paddingBottom:     48,
    paddingHorizontal: 20,
  },

  // ── App header ──
  appTag: {
    fontSize:      12,
    fontWeight:    '800',
    letterSpacing: 6,
    color:         COLORS.accent,
    marginBottom:  6,
  },
  appTitle: {
    fontSize:     24,
    fontWeight:   '700',
    color:        COLORS.textPrimary,
    marginBottom: 32,
  },

  // ── Card (Glassmorphism panel) ──
  card: {
    width:           '100%',
    maxWidth:        400,
    backgroundColor: COLORS.glassBase,
    borderRadius:    28,
    borderWidth:     1,
    borderColor:     COLORS.glassBorder,
    padding:         24,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 24 },
    shadowOpacity:   0.45,
    shadowRadius:    32,
    elevation:       24,
  },

  // ── Card header ──
  cardHeader: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    marginBottom:  20,
  },
  avatar: {
    width:           64,
    height:          64,
    borderRadius:    20,
    backgroundColor: COLORS.accent,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     16,
    shadowColor:     COLORS.accent,
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.55,
    shadowRadius:    16,
  },
  avatarText: {
    fontSize:   22,
    fontWeight: '800',
    color:      '#fff',
  },
  onlineDot: {
    position:        'absolute',
    bottom:          -3,
    right:           -3,
    width:           14,
    height:          14,
    borderRadius:    7,
    backgroundColor: COLORS.green,
    borderWidth:     2.5,
    borderColor:     '#0f0c29',
  },
  headerMeta: {
    flex: 1,
  },
  nameText: {
    fontSize:     22,
    fontWeight:   '800',
    color:        COLORS.textPrimary,
    marginBottom: 4,
  },
  uzmanlikText: {
    fontSize:     12,
    lineHeight:   18,
    color:        COLORS.textMuted,
    marginBottom: 10,
  },
  statusPill: {
    alignSelf:         'flex-start',
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      20,
  },
  pillAvail: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  pillBusy: {
    backgroundColor: 'rgba(255, 107, 107, 0.18)',
  },
  statusText: {
    fontSize:   11,
    fontWeight: '600',
    color:      COLORS.textPrimary,
  },

  // ── Divider ──
  divider: {
    height:          1,
    backgroundColor: COLORS.glassBorder,
    marginBottom:    20,
  },

  // ── StatsBoard ──
  statsRow: {
    flexDirection:  'row',
    justifyContent: 'space-around',
    marginBottom:   20,
  },
  statItem: {
    flex:       1,
    alignItems: 'center',
  },
  statValue: {
    fontSize:   30,
    fontWeight: '800',
    color:      COLORS.textPrimary,
  },
  statLabel: {
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing: 2,
    color:         COLORS.textMuted,
    marginTop:     3,
  },
  statSep: {
    width:           1,
    backgroundColor: COLORS.glassBorder,
    marginVertical:  4,
  },

  // ── XP Bar ──
  xpBarOuter: {
    marginBottom: 20,
  },
  xpBarTrack: {
    height:          7,
    backgroundColor: COLORS.glassXp,
    borderRadius:    4,
    overflow:        'hidden',
    marginBottom:    6,
  },
  xpBarFill: {
    height:          '100%',
    backgroundColor: COLORS.accent,
    borderRadius:    4,
    shadowColor:     COLORS.accent,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.9,
    shadowRadius:    8,
  },
  xpBarLabel: {
    fontSize:  11,
    color:     COLORS.textMuted,
    textAlign: 'right',
  },

  // ── Badges ──
  badgeRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
    marginBottom:  20,
  },
  badgePill: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(124, 92, 252, 0.14)',
    borderWidth:       1,
    borderColor:       'rgba(124, 92, 252, 0.35)',
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   5,
    gap:               5,
  },
  badgeEmoji: {
    fontSize: 13,
  },
  badgeLabel: {
    fontSize:   11,
    fontWeight: '600',
    color:      COLORS.textPrimary,
  },

  // ── Action Button ──
  actionBtn: {
    borderRadius:    16,
    paddingVertical: 16,
    alignItems:      'center',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.5,
    shadowRadius:    16,
    elevation:       10,
  },
  actionBtnAvail: {
    backgroundColor: COLORS.accent,
    shadowColor:     COLORS.accent,
  },
  actionBtnBusy: {
    backgroundColor: COLORS.accentBusy,
    shadowColor:     COLORS.accentBusy,
  },
  actionBtnText: {
    fontSize:      16,
    fontWeight:    '800',
    color:         '#fff',
    letterSpacing: 0.5,
  },

  // ── Footer hint ──
  hint: {
    marginTop:  24,
    fontSize:   13,
    color:      'rgba(255,255,255,0.35)',
    textAlign:  'center',
    lineHeight: 20,
  },
});
