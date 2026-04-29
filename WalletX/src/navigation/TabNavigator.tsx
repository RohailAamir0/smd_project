// ─── Tab Navigator ────────────────────────────────────────────────────────────
// Bottom tabs: Home, Transactions, Statistics, Profile

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons }   from '@expo/vector-icons';
import { LinearGradient }           from 'expo-linear-gradient';
import Colors  from '../constants/colors';
import { Radius, FontSize, FontWeight } from '../constants/theme';

import HomeScreen         from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import StatisticsScreen   from '../screens/StatisticsScreen';
import ProfileScreen      from '../screens/ProfileScreen';
import type { TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();

type TabConfig = {
  name: keyof TabParamList;
  component: React.ComponentType<any>;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconActive: keyof typeof MaterialCommunityIcons.glyphMap;
};

const TABS: TabConfig[] = [
  { name: 'Home',         component: HomeScreen,         icon: 'home',            iconActive: 'home'             },
  { name: 'Transactions', component: TransactionsScreen, icon: 'swap-horizontal', iconActive: 'swap-horizontal'  },
  { name: 'Statistics',   component: StatisticsScreen,   icon: 'chart-bar',       iconActive: 'chart-bar'        },
  { name: 'Profile',      component: ProfileScreen,      icon: 'account-outline', iconActive: 'account'          },
];

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle:   styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarActiveTintColor:   Colors.accent1,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarIcon: ({ focused, color }) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const iconName = focused ? tab.iconActive : tab.icon;
          if (focused) {
            return (
              <View style={styles.activeIcon}>
                <LinearGradient
                  colors={Colors.gradientPrimary}
                  style={styles.activeIconGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialCommunityIcons name={iconName} size={22} color={Colors.white} />
                </LinearGradient>
              </View>
            );
          }
          return <MaterialCommunityIcons name={iconName} size={22} color={color} />;
        },
      })}
    >
      {TABS.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:  Colors.surface,
    borderTopColor:   Colors.border,
    borderTopWidth:   1,
    height:           68,
    paddingBottom:    10,
    paddingTop:       8,
  },
  label: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  activeIcon: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  activeIconGrad: {
    width:          44,
    height:         44,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    Colors.accent1,
    shadowOffset:   { width: 0, height: 3 },
    shadowOpacity:  0.4,
    shadowRadius:   8,
    elevation:      6,
  },
});
