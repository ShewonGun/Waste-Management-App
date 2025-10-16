import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';
import { getUserWaste, WasteData, cancelWasteData, deleteWasteData } from '../utils/database';

export default function WasteSchedulesScreen() {
  const router = useRouter();
  const [wasteSchedules, setWasteSchedules] = useState<WasteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWasteSchedules = async () => {
    try {
      const wasteData = await getUserWaste();
      setWasteSchedules(wasteData);
    } catch (error) {
      console.error('Error loading waste schedules:', error);
      Alert.alert('Error', 'Failed to load waste schedules. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWasteSchedules();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWasteSchedules();
  };

  const handleReschedule = (wasteItem: WasteData) => {
    router.push({
      pathname: '/waste-reschedule',
      params: {
        wasteId: wasteItem.wasteId,
        wasteType: wasteItem.wasteType,
        quantity: wasteItem.quantity,
        pickupDate: wasteItem.pickupDate,
        timeSlot: wasteItem.timeSlot,
        specialInstructions: wasteItem.specialInstructions || '',
        imageUrl: wasteItem.imageUrl || '',
      },
    });
  };

  const handleCancel = async (wasteId: string) => {
    Alert.alert(
      'Cancel Waste Pickup',
      'Are you sure you want to cancel this waste pickup? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelWasteData(wasteId);
              Alert.alert('Success', 'Waste pickup cancelled successfully.');
              loadWasteSchedules(); // Refresh the list
            } catch (error) {
              console.error('Error cancelling waste pickup:', error);
              Alert.alert('Error', 'Failed to cancel waste pickup. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (wasteId: string) => {
    Alert.alert(
      'Delete Waste Pickup',
      'Are you sure you want to permanently delete this waste pickup? This action cannot be undone.',
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
              await deleteWasteData(wasteId);
              Alert.alert('Success', 'Waste pickup deleted successfully.');
              loadWasteSchedules(); // Refresh the list
            } catch (error) {
              console.error('Error deleting waste pickup:', error);
              Alert.alert('Error', 'Failed to delete waste pickup. Please try again.');
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

  const getWasteTypeIcon = (wasteType: string) => {
    switch (wasteType) {
      case 'household':
        return 'home';
      case 'electronic':
        return 'devices';
      case 'construction':
        return 'build';
      case 'organic':
        return 'nature';
      case 'hazardous':
        return 'warning';
      default:
        return 'category';
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

  const renderWasteItem = ({ item }: { item: WasteData }) => (
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
          {item.wasteId}
        </Text>
        <View style={{
          backgroundColor: getStatusColor(item.status || 'scheduled'),
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
            {item.status || 'scheduled'}
          </Text>
        </View>
      </View>

      {/* Waste Type */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <MaterialIcons
          name={getWasteTypeIcon(item.wasteType) as any}
          size={20}
          color={Colors.light.icon}
        />
        <Text style={{
          fontSize: 16,
          color: Colors.light.text,
          fontWeight: '500',
          marginLeft: 8,
        }}>
          {item.wasteType.charAt(0).toUpperCase() + item.wasteType.slice(1)} Waste
        </Text>
      </View>

      {/* Quantity */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{
          fontSize: 14,
          color: Colors.light.icon,
          marginBottom: 4,
        }}>
          Quantity:
        </Text>
        <Text style={{
          fontSize: 16,
          color: Colors.light.text,
          fontWeight: '500',
        }}>
          {item.quantity}
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
            {formatTime(item.timeSlot)}
          </Text>
        </View>
      </View>

      {/* Special Instructions */}
      {item.specialInstructions && (
        <View style={{ marginBottom: 8 }}>
          <Text style={{
            fontSize: 14,
            color: Colors.light.icon,
            marginBottom: 4,
          }}>
            Instructions:
          </Text>
          <Text style={{
            fontSize: 14,
            color: Colors.light.text,
            lineHeight: 20,
          }}>
            {item.specialInstructions}
          </Text>
        </View>
      )}

      {/* Photo */}
      {item.imageUrl && (
        <View style={{ marginBottom: 8 }}>
          <Text style={{
            fontSize: 14,
            color: Colors.light.icon,
            marginBottom: 4,
          }}>
            Photo:
          </Text>
          <Image
            source={{ uri: item.imageUrl }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: Colors.light.inputBorder,
            }}
          />
        </View>
      )}

      {/* Action Buttons */}
      {item.status === 'scheduled' && (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 12,
          gap: 8,
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: Colors.light.button,
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
            onPress={() => handleReschedule(item)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="edit" size={16} color={Colors.light.buttonText} />
            <Text style={{
              color: Colors.light.buttonText,
              fontSize: 14,
              fontWeight: '600',
              marginLeft: 4,
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
              paddingHorizontal: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
            onPress={() => handleCancel(item.wasteId)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="cancel" size={16} color="#fff" />
            <Text style={{
              color: "#fff",
              fontSize: 14,
              fontWeight: '600',
              marginLeft: 4,
            }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Delete Button for Cancelled Items */}
      {item.status === 'cancelled' && (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 12,
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#dc3545',
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              minWidth: 120,
            }}
            onPress={() => handleDelete(item.wasteId)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete" size={16} color="#fff" />
            <Text style={{
              color: "#fff",
              fontSize: 14,
              fontWeight: '600',
              marginLeft: 4,
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
          Loading waste schedules...
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
        <FlatList
          data={wasteSchedules}
          renderItem={renderWasteItem}
          keyExtractor={(item) => item.wasteId}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.light.button]}
              tintColor={Colors.light.button}
            />
          }
          ListEmptyComponent={
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 60,
            }}>
              <MaterialIcons name="delete-outline" size={64} color={Colors.light.icon} />
              <Text style={{
                fontSize: 18,
                color: Colors.light.icon,
                marginTop: 16,
                textAlign: 'center',
              }}>
                No waste schedules found
              </Text>
              <Text style={{
                fontSize: 14,
                color: Colors.light.icon,
                marginTop: 8,
                textAlign: 'center',
              }}>
                Schedule your first waste pickup to get started
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}