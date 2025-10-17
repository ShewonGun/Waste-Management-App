import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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

export default function PickupConfirmationPage() {
  const router = useRouter();
  const {
    materials,
    quantities,
    total,
    payment,
    date,
    time,
    pickupId,
    address,
    receiptUrl
  } = useLocalSearchParams();

  const selectedMaterials = materials ? (Array.isArray(materials) ? materials : materials.split(',')) : [];
  const quantitiesObj = quantities ? JSON.parse(quantities as string) : {};
  const totalAmount = parseFloat(total as string) || 0;
  const selectedPayment = payment as string;
  const pickupDate = date as string;
  const pickupTime = time as string;
  const generatedPickupId = pickupId as string || `ECO${Date.now().toString().slice(-8)}`;
  const pickupAddress = address as string;
  const paymentReceiptUrl = receiptUrl as string;

  const calculateTotalWeight = () => {
    return selectedMaterials.reduce((total, key) => {
      return total + (parseFloat(quantitiesObj[key] || '0'));
    }, 0);
  };

  const getPaymentMethodLabel = (key: string) => {
    const options = {
      'cash': 'Cash Payment',
      'bank': 'Bank Transfer',
      'paycheck': 'Paycheck'
    };
    return options[key as keyof typeof options] || key;
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <LinearGradient
        colors={["#14532d", "#166534", "#22c55e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientHeader}
      >
        <Text style={styles.appTitle}>EcoRecycle</Text>
        <Text style={styles.appSubtitle}>Pickup Confirmed</Text>
      </LinearGradient>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Success Message */}
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <MaterialIcons name="check-circle" size={48} color="#22c55e" />
          </View>
          <Text style={styles.successTitle}>Pickup Scheduled Successfully!</Text>
          <Text style={styles.successMessage}>
            Your waste pickup has been scheduled. Our team will collect your recyclable materials at the specified date and time.
          </Text>
        </View>

        {/* Pickup Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Pickup Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup ID:</Text>
            <Text style={styles.detailValue}>{generatedPickupId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled Date:</Text>
            <Text style={styles.detailValue}>{pickupDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled Time:</Text>
            <Text style={styles.detailValue}>{pickupTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup Address:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{pickupAddress}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Materials:</Text>
            <Text style={styles.detailValue}>
              {selectedMaterials.map(key => {
                const material = MATERIALS.find(m => m.key === key);
                return material?.label;
              }).join(', ')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Weight:</Text>
            <Text style={styles.detailValue}>{calculateTotalWeight().toFixed(2)} kg</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>{getPaymentMethodLabel(selectedPayment)}</Text>
          </View>

          {(selectedPayment === 'bank' || selectedPayment === 'paycheck') && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Receipt Status:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons 
                  name={paymentReceiptUrl ? "check-circle" : "warning"} 
                  size={16} 
                  color={paymentReceiptUrl ? "#4CAF50" : "#FF9800"} 
                  style={{ marginRight: 4 }}
                />
                <Text style={[
                  styles.detailValue,
                  { color: paymentReceiptUrl ? "#4CAF50" : "#FF9800" }
                ]}>
                  {paymentReceiptUrl ? "Receipt Uploaded ✓" : "No Receipt Uploaded"}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Estimated Earnings:</Text>
            <Text style={styles.totalValue}>LKR {totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="home" size={24} color={Colors.light.buttonText} />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rescheduleButton}
            onPress={() => router.push({
              pathname: '/reschedule',
              params: {
                pickupId: generatedPickupId,
                materials: selectedMaterials.join(','),
                quantities: JSON.stringify(quantitiesObj),
                total: totalAmount.toString(),
                payment: selectedPayment,
                date: pickupDate,
                time: pickupTime,
                address: pickupAddress,
              }
            } as any)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="schedule" size={24} color={Colors.light.buttonText} />
            <Text style={styles.rescheduleButtonText}>Reschedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewSchedulesButton}
            onPress={() => router.push('/view-schedules' as any)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="list" size={24} color={Colors.light.buttonText} />
            <Text style={styles.viewSchedulesButtonText}>View Schedules</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientHeader: {
    width: '100%',
    paddingTop: 72,
    paddingBottom: 48,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    minHeight: 180,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  appTitle: {
    color: '#fff',
    fontSize: 32,
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
  successContainer: {
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f7ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  detailsContainer: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: Colors.light.button,
  },
  detailLabel: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  totalLabel: {
    fontSize: 18,
    color: Colors.light.button,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    color: Colors.light.button,
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 12,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.button,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: Colors.light.button,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  doneButtonText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  rescheduleButtonText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  viewSchedulesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.icon,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: Colors.light.icon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  viewSchedulesButtonText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});