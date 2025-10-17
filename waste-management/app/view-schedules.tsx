import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';
import { getUserPickups, PickupData, deletePickup } from '../utils/database';

export default function ViewSchedulesScreen() {
  const router = useRouter();
  const [pickups, setPickups] = useState<PickupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPickups = async () => {
    try {
      const userPickups = await getUserPickups();
      setPickups(userPickups);
    } catch (error) {
      console.error('Error loading pickups:', error);
      Alert.alert('Error', 'Failed to load pickups. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPickups();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPickups();
  };

  const handleDeletePickup = async (pickupId: string) => {
    Alert.alert(
      'Delete Pickup',
      'Are you sure you want to delete this pickup? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePickup(pickupId);
              Alert.alert('Success', 'Pickup deleted successfully.');
              // Refresh the list
              loadPickups();
            } catch (error) {
              console.error('Error deleting pickup:', error);
              Alert.alert('Error', 'Failed to delete pickup. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateValue: any) => {
    try {
      let date: Date;

      if (dateValue?.toDate) {
        // Firestore Timestamp object
        date = dateValue.toDate();
      } else if (typeof dateValue === 'string') {
        // ISO string
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        // Already a Date object
        date = dateValue;
      } else {
        // Fallback
        date = new Date();
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return 'Invalid Date';
    }
  };

  const formatTime = (timeValue: any) => {
    try {
      let time: Date;

      if (timeValue?.toDate) {
        // Firestore Timestamp object
        time = timeValue.toDate();
      } else if (typeof timeValue === 'string') {
        // ISO string
        time = new Date(timeValue);
      } else if (timeValue instanceof Date) {
        // Already a Date object
        time = timeValue;
      } else {
        // Fallback
        time = new Date();
      }

      // Check if time is valid
      if (isNaN(time.getTime())) {
        return 'Invalid Time';
      }

      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time:', error, timeValue);
      return 'Invalid Time';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return Colors.light.button;
      case 'completed':
        return '#22c55e';
      case 'cancelled':
        return Colors.light.error;
      default:
        return Colors.light.icon;
    }
  };

  const renderPickupItem = ({ item }: { item: PickupData }) => (
    <View style={{
      backgroundColor: Colors.light.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors.light.inputBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    }}>
      {/* Header with ID and Status */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: Colors.light.text,
        }}>
          {item.pickupId}
        </Text>
        <View style={{
          backgroundColor: getStatusColor(item.status),
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{
            color: Colors.light.buttonText,
            fontSize: 12,
            fontWeight: '600',
            textTransform: 'capitalize',
          }}>
            {item.status}
          </Text>
        </View>
      </View>

      {/* Materials */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{
          fontSize: 14,
          color: Colors.light.icon,
          marginBottom: 4,
        }}>
          Materials:
        </Text>
        <Text style={{
          fontSize: 16,
          color: Colors.light.text,
          fontWeight: '500',
        }}>
          {item.materials.join(', ')}
        </Text>
      </View>

      {/* Date & Time */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 14,
            color: Colors.light.icon,
            marginBottom: 2,
          }}>
            Date:
          </Text>
          <Text style={{
            fontSize: 16,
            color: Colors.light.text,
            fontWeight: '500',
          }}>
            {formatDate(item.pickupDate)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 14,
            color: Colors.light.icon,
            marginBottom: 2,
          }}>
            Time:
          </Text>
          <Text style={{
            fontSize: 16,
            color: Colors.light.text,
            fontWeight: '500',
          }}>
            {formatTime(item.pickupTime)}
          </Text>
        </View>
      </View>

      {/* Address */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{
          fontSize: 14,
          color: Colors.light.icon,
          marginBottom: 4,
        }}>
          Address:
        </Text>
        <Text style={{
          fontSize: 14,
          color: Colors.light.text,
          lineHeight: 20,
        }}>
          {item.pickupAddress}
        </Text>
      </View>

      {/* Payment & Total */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <View>
          <Text style={{
            fontSize: 14,
            color: Colors.light.icon,
            marginBottom: 2,
          }}>
            Payment:
          </Text>
          <Text style={{
            fontSize: 16,
            color: Colors.light.text,
            fontWeight: '500',
          }}>
            {item.paymentMethod}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: 14,
            color: Colors.light.icon,
            marginBottom: 2,
          }}>
            Total:
          </Text>
          <Text style={{
            fontSize: 18,
            color: Colors.light.button,
            fontWeight: 'bold',
          }}>
            LKR {item.totalAmount.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      {item.status === 'scheduled' && (
        <View style={{
          flexDirection: 'row',
          gap: 8,
          marginTop: 8,
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: Colors.light.tint,
              borderRadius: 8,
              paddingVertical: 10,
              alignItems: 'center',
            }}
            onPress={() => {
              // Convert dates to ISO strings for URL parameters
              let dateStr = item.pickupDate;
              let timeStr = item.pickupTime;

              if (item.pickupDate?.toDate) {
                dateStr = item.pickupDate.toDate().toISOString();
              } else if (typeof item.pickupDate === 'string') {
                dateStr = item.pickupDate;
              }

              if (item.pickupTime?.toDate) {
                timeStr = item.pickupTime.toDate().toISOString();
              } else if (typeof item.pickupTime === 'string') {
                timeStr = item.pickupTime;
              }

              router.push({
                pathname: '/reschedule',
                params: {
                  pickupId: item.pickupId,
                  materials: item.materials.join(','),
                  quantities: JSON.stringify(item.quantities),
                  total: item.totalAmount.toString(),
                  payment: item.paymentMethod,
                  date: dateStr,
                  time: timeStr,
                  address: item.pickupAddress,
                }
              } as any);
            }}
            activeOpacity={0.8}
          >
            <Text style={{
              color: Colors.light.buttonText,
              fontSize: 16,
              fontWeight: '600',
            }}>
              Reschedule
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: Colors.light.error,
              borderRadius: 8,
              paddingVertical: 10,
              alignItems: 'center',
            }}
            onPress={() => handleDeletePickup(item.pickupId)}
            activeOpacity={0.8}
          >
            <Text style={{
              color: Colors.light.buttonText,
              fontSize: 16,
              fontWeight: '600',
            }}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color={Colors.light.button} />
        <Text style={{
          marginTop: 16,
          fontSize: 16,
          color: Colors.light.text,
        }}>
          Loading your schedules...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.light.tint, Colors.light.button]}
        style={{
          width: '100%',
          paddingTop: 60,
          paddingBottom: 20,
          alignItems: 'center',
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          marginBottom: 20,
          minHeight: 120,
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: Colors.light.buttonText,
            textShadowColor: 'rgba(0,0,0,0.13)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 6,
          }}
        >
          My Schedules
        </Text>
      </LinearGradient>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {pickups.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}>
            <MaterialIcons
              name="schedule"
              size={80}
              color={Colors.light.icon}
              style={{ marginBottom: 20 }}
            />
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: Colors.light.text,
              textAlign: 'center',
              marginBottom: 8,
            }}>
              No Scheduled Pickups
            </Text>
            <Text style={{
              fontSize: 16,
              color: Colors.light.icon,
              textAlign: 'center',
              lineHeight: 22,
            }}>
              You haven't scheduled any pickups yet. Start by selecting materials and scheduling a pickup.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: Colors.light.button,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 24,
                marginTop: 24,
                shadowColor: Colors.light.button,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 3,
              }}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
            >
              <Text style={{
                color: Colors.light.buttonText,
                fontSize: 16,
                fontWeight: '600',
              }}>
                Schedule Pickup
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={pickups}
            keyExtractor={(item) => item.pickupId}
            renderItem={renderPickupItem}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.light.button]}
                tintColor={Colors.light.button}
              />
            }
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </View>
  );
}