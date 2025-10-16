import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const MATERIALS = [
  { key: 'metals', label: 'Metals', icon: 'hardware', pricePerKg: 20 },
  { key: 'paper', label: 'Paper', icon: 'description', pricePerKg: 15 },
  { key: 'glass', label: 'Glass', icon: 'wine-bar', pricePerKg: 10 },
  { key: 'cardboard', label: 'Cardboard', icon: 'inventory', pricePerKg: 12 },
  { key: 'plastic', label: 'Plastic', icon: 'water-drop', pricePerKg: 18 },
  { key: 'electronic', label: 'Electronic', icon: 'memory', pricePerKg: 25 },
];

export default function RecycleForm() {
  const router = useRouter();
  const { materials } = useLocalSearchParams();
  const selectedMaterials = materials ? (Array.isArray(materials) ? materials : materials.split(',')) : [];

  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const handleQuantityChange = (key: string, value: string) => {
    setQuantities((prev) => ({ ...prev, [key]: value }));
  };

  const handleContinue = () => {
    if (selectedMaterials.every(key => quantities[key] && parseFloat(quantities[key]) > 0)) {
      router.push({
        pathname: '/payment',
        params: {
          materials: selectedMaterials.join(','),
          quantities: JSON.stringify(quantities),
          total: calculateTotal().toString(),
        },
      } as any);
    }
  };

  const calculateTotal = () => {
    return selectedMaterials.reduce((total, key) => {
      const material = MATERIALS.find((m) => m.key === key);
      const quantity = parseFloat(quantities[key] || '0');
      return total + (material ? quantity * material.pricePerKg : 0);
    }, 0);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <LinearGradient
        colors={["#14532d", "#166534", "#22c55e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientHeader}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appTitle}>EcoRecycle</Text>
        <Text style={styles.appSubtitle}>Enter Quantities</Text>
      </LinearGradient>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.header}>Enter Quantities for Selected Materials</Text>
        {selectedMaterials.map((key: string) => {
          const material = MATERIALS.find((m) => m.key === key);
          if (!material) return null;
          return (
            <View key={key} style={styles.quantityRow}>
              <MaterialIcons
                name={material.icon as any}
                size={32}
                color={Colors.light.icon}
              />
              <View style={styles.materialInfo}>
                <Text style={styles.materialLabel}>{material.label}</Text>
                <Text style={styles.priceText}>LKR {material.pricePerKg}/kg</Text>
              </View>
              <TextInput
                style={styles.quantityInput}
                placeholder="0"
                keyboardType="numeric"
                value={quantities[key] || ''}
                onChangeText={(value) => handleQuantityChange(key, value)}
              />
              <Text style={styles.unitText}>kg</Text>
              <Text style={styles.totalText}>
                LKR {(parseFloat(quantities[key] || '0') * material.pricePerKg).toFixed(2)}
              </Text>
            </View>
          );
        })}
        
        {/* Material Totals Breakdown */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Material Breakdown:</Text>
          {selectedMaterials.map((key: string) => {
            const material = MATERIALS.find((m) => m.key === key);
            if (!material) return null;
            const quantity = parseFloat(quantities[key] || '0');
            const total = quantity * material.pricePerKg;
            return (
              <View key={`breakdown-${key}`} style={styles.breakdownRow}>
                <Text style={styles.breakdownMaterial}>{material.label}</Text>
                <Text style={styles.breakdownQuantity}>{quantity.toFixed(2)} kg × LKR {material.pricePerKg}</Text>
                <Text style={styles.breakdownTotal}>LKR {total.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>
        
        <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Grand Total:</Text>
          <Text style={styles.totalAmount}>LKR {calculateTotal().toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.continueButton, { opacity: selectedMaterials.every(key => quantities[key] && parseFloat(quantities[key]) > 0) ? 1 : 0.5 }]}
          onPress={handleContinue}
          disabled={!selectedMaterials.every(key => quantities[key] && parseFloat(quantities[key]) > 0)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="arrow-forward" size={24} color={Colors.light.buttonText} />
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientHeader: {
    width: '100%',
    paddingTop: 72,
    paddingBottom: 48,
    paddingHorizontal: 0,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    minHeight: 180,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    padding: 8,
  },
  appTitle: {
    color: '#fff',
    fontSize: 38,
    fontWeight: 'bold',
    letterSpacing: 1.1,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  appSubtitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.7,
    textShadowColor: 'rgba(0,0,0,0.13)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  materialLabel: {
    flex: 1,
    fontSize: 18,
    color: Colors.light.text,
    fontWeight: '600',
    marginLeft: 12,
  },
  materialInfo: {
    flex: 1,
    marginLeft: 12,
  },
  priceText: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.8,
  },
  quantityInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 8,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
  },
  unitText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 8,
  },
  totalText: {
    fontSize: 16,
    color: Colors.light.button,
    fontWeight: 'bold',
    marginLeft: 12,
    minWidth: 60,
    textAlign: 'right',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  totalLabel: {
    fontSize: 18,
    color: Colors.light.text,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    color: Colors.light.button,
    fontWeight: 'bold',
  },
  breakdownContainer: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  breakdownTitle: {
    fontSize: 18,
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
  },
  breakdownMaterial: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
    flex: 1,
  },
  breakdownQuantity: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.8,
    flex: 2,
    textAlign: 'center',
  },
  breakdownTotal: {
    fontSize: 16,
    color: Colors.light.button,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.button,
    borderRadius: 24,
    paddingVertical: 18,
    marginTop: 24,
    shadowColor: Colors.light.button,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 56,
  },
  continueText: {
    color: Colors.light.buttonText,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
});