import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';

interface SuccessParams {
  wasteType: string;
  quantity: string;
  pickupDate: string;
  timeSlot: string;
  wasteId: string;
  imageUploaded?: string;
  specialInstructions?: string;
}

export default function WasteSubmissionSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const handleViewSchedules = () => {
    router.push('/waste-schedules');
  };

  const handleBackToHome = () => {
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <LinearGradient
        colors={['#ffffff', '#f0f8f0', '#e8f5e9']}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            justifyContent: 'center',
          }}
        >
          {/* Success Icon */}
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <MaterialIcons name="check-circle" size={60} color="#4CAF50" />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: '#2d3436',
                textAlign: 'center',
                marginBottom: 10,
              }}
            >
              Submission Successful!
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#388E3C',
                textAlign: 'center',
              }}
            >
              Your waste pickup has been scheduled
            </Text>
          </View>

          {/* Submission Summary */}
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 15,
              padding: 20,
              marginBottom: 30,
              borderWidth: 1,
              borderColor: '#4CAF50',
              shadowColor: '#4CAF50',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#2d3436',
                marginBottom: 15,
                textAlign: 'center',
              }}
            >
              Pickup Summary
            </Text>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 16, color: '#636e72', marginBottom: 5 }}>
                Waste ID:
              </Text>
              <Text style={{ fontSize: 18, color: '#2d3436', fontWeight: '600' }}>
                {params.wasteId}
              </Text>
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 16, color: '#636e72', marginBottom: 5 }}>
                Waste Type:
              </Text>
              <Text style={{ fontSize: 18, color: '#2d3436', fontWeight: '600' }}>
                {params.wasteType}
              </Text>
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 16, color: '#636e72', marginBottom: 5 }}>
                Quantity:
              </Text>
              <Text style={{ fontSize: 18, color: '#2d3436', fontWeight: '600' }}>
                {params.quantity}
              </Text>
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 16, color: '#636e72', marginBottom: 5 }}>
                Pickup Date:
              </Text>
              <Text style={{ fontSize: 18, color: '#2d3436', fontWeight: '600' }}>
                {params.pickupDate}
              </Text>
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 16, color: '#636e72', marginBottom: 5 }}>
                Time Slot:
              </Text>
              <Text style={{ fontSize: 18, color: '#2d3436', fontWeight: '600' }}>
                {params.timeSlot}
              </Text>
            </View>

            {params.imageUploaded === 'true' && (
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 16, color: Colors.light.icon, marginBottom: 5 }}>
                  Photo:
                </Text>
                <Text style={{ fontSize: 16, color: '#4CAF50', fontWeight: '600' }}>
                  ✓ Uploaded successfully
                </Text>
              </View>
            )}

            {params.specialInstructions && (
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 16, color: '#636e72', marginBottom: 5 }}>
                  Special Instructions:
                </Text>
                <Text style={{ fontSize: 16, color: '#2d3436' }}>
                  {params.specialInstructions}
                </Text>
              </View>
            )}
          </View>

          {/* Instructions */}
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 15,
              padding: 20,
              marginBottom: 30,
              borderWidth: 1,
              borderColor: '#4CAF50',
              shadowColor: '#4CAF50',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#2d3436',
                marginBottom: 15,
                textAlign: 'center',
              }}
            >
              What happens next?
            </Text>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 16, color: '#636e72', marginBottom: 5 }}>
                • Our team will contact you within 24 hours to confirm your pickup
              </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 16, color: '#636e72', marginBottom: 5 }}>
                • Please ensure your waste is ready at the scheduled time
              </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 16, color: '#636e72', marginBottom: 5 }}>
                • Keep your waste ID ({params.wasteId}) for reference
              </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 16, color: '#636e72', marginBottom: 5 }}>
                • You can track your pickup status in the schedules section
              </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 16, color: '#636e72' }}>
                • For any changes, contact us at least 4 hours before pickup time
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 15 }}>
            <TouchableOpacity
              style={{
                borderRadius: 15,
                overflow: 'hidden',
                shadowColor: '#4CAF50',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 8,
              }}
              onPress={handleViewSchedules}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049', '#388E3C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 18,
                  paddingHorizontal: 25,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
              >
                <MaterialIcons
                  name="schedule"
                  size={24}
                  color="#ffffff"
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#ffffff',
                    letterSpacing: 0.5,
                  }}
                >
                  View My Schedules
                </Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={20}
                  color="#ffffff"
                  style={{ marginLeft: 8 }}
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderWidth: 2,
                borderColor: '#4CAF50',
                borderRadius: 15,
                paddingVertical: 16,
                paddingHorizontal: 25,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                shadowColor: '#4CAF50',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={handleBackToHome}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="home"
                size={22}
                color="#4CAF50"
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: '#4CAF50',
                  letterSpacing: 0.3,
                }}
              >
                Back to Home
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}