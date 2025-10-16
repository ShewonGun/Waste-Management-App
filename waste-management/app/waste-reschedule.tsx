import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/theme';
import { updateWasteData } from '../utils/database';
import { uploadToCloudinary } from '../utils/cloudinary';

interface WasteRescheduleParams {
  wasteId: string;
  wasteType: string;
  quantity: string;
  pickupDate: string;
  timeSlot: string;
  specialInstructions?: string;
  imageUrl?: string;
}

export default function WasteRescheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Helper function to get string value from params
  const getParamValue = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
  };

  // Form state - pre-filled with existing data
  const [selectedWasteType, setSelectedWasteType] = useState(getParamValue(params.wasteType));
  const [quantity, setQuantity] = useState(getParamValue(params.quantity));
  const [pickupDate, setPickupDate] = useState(getParamValue(params.pickupDate));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(getParamValue(params.timeSlot));
  const [specialInstructions, setSpecialInstructions] = useState(getParamValue(params.specialInstructions));
  const getSingleImageUrl = (url: string | string[] | null | undefined): string | null => {
    if (Array.isArray(url)) return url[0] || null;
    return url ?? null;
  };
  const [imageUri, setImageUri] = useState<string | null>(getSingleImageUrl(params.imageUrl));
  const [cloudinaryUrl, setCloudinaryUrl] = useState(getSingleImageUrl(params.imageUrl));

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const wasteTypes = [
    { id: 'household', name: 'Household Waste', icon: 'home' },
    { id: 'electronic', name: 'Electronic Waste', icon: 'devices' },
    { id: 'construction', name: 'Construction Waste', icon: 'build' },
    { id: 'organic', name: 'Organic Waste', icon: 'nature' },
    { id: 'hazardous', name: 'Hazardous Waste', icon: 'warning' },
  ];

  const timeSlots = [
    '9:00 AM - 11:00 AM',
    '11:00 AM - 1:00 PM',
    '1:00 PM - 3:00 PM',
    '3:00 PM - 5:00 PM',
  ];

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setCloudinaryUrl(null); // Reset cloudinary URL when new image is selected
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async () => {
    if (!imageUri || cloudinaryUrl) return; // Already uploaded or no image

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadToCloudinary(imageUri);
      setCloudinaryUrl(uploadedUrl);
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedWasteType || !quantity || !pickupDate || !selectedTimeSlot) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    // Upload image if selected but not uploaded yet
    if (imageUri && !cloudinaryUrl) {
      await uploadImage();
      if (!cloudinaryUrl) {
        Alert.alert('Upload Required', 'Please wait for image upload to complete');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        wasteType: selectedWasteType,
        quantity: quantity,
        pickupDate: pickupDate,
        timeSlot: selectedTimeSlot,
        specialInstructions: specialInstructions,
        ...(cloudinaryUrl && { imageUrl: cloudinaryUrl }),
      };

      await updateWasteData(Array.isArray(params.wasteId) ? params.wasteId[0] : params.wasteId, updateData);

      Alert.alert(
        'Rescheduled Successfully',
        'Your waste pickup has been rescheduled successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/waste-schedules'),
          },
        ]
      );
    } catch (error) {
      console.error('Error rescheduling waste pickup:', error);
      Alert.alert('Error', 'Failed to reschedule waste pickup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPickupDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.secondary]}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <TouchableOpacity
              style={{
                position: 'absolute',
                left: 0,
                padding: 10,
              }}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <MaterialIcons name="arrow-back" size={24} color={Colors.light.buttonText} />
            </TouchableOpacity>

            <MaterialIcons name="edit" size={48} color={Colors.light.buttonText} />
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: Colors.light.buttonText,
              marginTop: 10,
            }}>
              Reschedule Pickup
            </Text>
            <Text style={{
              fontSize: 16,
              color: Colors.light.buttonText,
              textAlign: 'center',
              marginTop: 5,
              opacity: 0.8,
            }}>
              Update your waste pickup details
            </Text>
          </View>

          {/* Waste Type Selection */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: Colors.light.buttonText,
              marginBottom: 15,
            }}>
              Waste Type
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {wasteTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: selectedWasteType === type.id ? Colors.light.button : 'rgba(255,255,255,0.3)',
                    backgroundColor: selectedWasteType === type.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  }}
                  onPress={() => setSelectedWasteType(type.id)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={type.icon as any}
                    size={20}
                    color={selectedWasteType === type.id ? Colors.light.button : Colors.light.buttonText}
                  />
                  <Text style={{
                    color: selectedWasteType === type.id ? Colors.light.button : Colors.light.buttonText,
                    fontSize: 14,
                    fontWeight: '600',
                    marginLeft: 8,
                  }}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quantity Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: Colors.light.buttonText,
              marginBottom: 10,
            }}>
              Quantity
            </Text>
            <TextInput
              style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 12,
                padding: 15,
                fontSize: 16,
                color: Colors.light.text,
                borderWidth: 1,
                borderColor: Colors.light.inputBorder,
              }}
              placeholder="e.g., 2 bags, 5 kg, 3 boxes"
              placeholderTextColor={Colors.light.icon}
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>

          {/* Date Selection */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: Colors.light.buttonText,
              marginBottom: 10,
            }}>
              Pickup Date
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 12,
                padding: 15,
                borderWidth: 1,
                borderColor: Colors.light.inputBorder,
              }}
              onPress={showDatePickerModal}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 16,
                color: pickupDate ? Colors.light.text : Colors.light.icon,
              }}>
                {pickupDate || 'Select pickup date'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time Slot Selection */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: Colors.light.buttonText,
              marginBottom: 15,
            }}>
              Time Slot
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: selectedTimeSlot === slot ? Colors.light.button : 'rgba(255,255,255,0.3)',
                    backgroundColor: selectedTimeSlot === slot ? 'rgba(255,255,255,0.1)' : 'transparent',
                  }}
                  onPress={() => setSelectedTimeSlot(slot)}
                  activeOpacity={0.8}
                >
                  <Text style={{
                    color: selectedTimeSlot === slot ? Colors.light.button : Colors.light.buttonText,
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Special Instructions */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: Colors.light.buttonText,
              marginBottom: 10,
            }}>
              Special Instructions (Optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 12,
                padding: 15,
                fontSize: 16,
                color: Colors.light.text,
                borderWidth: 1,
                borderColor: Colors.light.inputBorder,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Any special instructions for pickup..."
              placeholderTextColor={Colors.light.icon}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Photo Upload */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: Colors.light.buttonText,
              marginBottom: 10,
            }}>
              Photo (Optional)
            </Text>

            {(imageUri || cloudinaryUrl) && (
              <View style={{ marginBottom: 10 }}>
                <Image
                  source={{ uri: imageUri || cloudinaryUrl || '' }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: Colors.light.inputBorder,
                  }}
                />
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: 12,
                  padding: 15,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: Colors.light.inputBorder,
                }}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <MaterialIcons name="photo-library" size={20} color={Colors.light.text} />
                <Text style={{
                  color: Colors.light.text,
                  fontSize: 14,
                  fontWeight: '600',
                  marginTop: 5,
                }}>
                  {imageUri ? 'Change Photo' : 'Select Photo'}
                </Text>
              </TouchableOpacity>

              {imageUri && !cloudinaryUrl && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: Colors.light.button,
                    borderRadius: 12,
                    padding: 15,
                    alignItems: 'center',
                  }}
                  onPress={uploadImage}
                  disabled={isUploading}
                  activeOpacity={0.8}
                >
                  {isUploading ? (
                    <ActivityIndicator color={Colors.light.buttonText} />
                  ) : (
                    <>
                      <MaterialIcons name="cloud-upload" size={20} color={Colors.light.buttonText} />
                      <Text style={{
                        color: Colors.light.buttonText,
                        fontSize: 14,
                        fontWeight: '600',
                        marginTop: 5,
                      }}>
                        Upload
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={{
              backgroundColor: Colors.light.button,
              borderRadius: 12,
              padding: 18,
              alignItems: 'center',
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.light.buttonText} />
            ) : (
              <>
                <MaterialIcons name="update" size={20} color={Colors.light.buttonText} />
                <Text style={{
                  color: Colors.light.buttonText,
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginTop: 5,
                }}>
                  Update Schedule
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={pickupDate ? new Date(pickupDate) : new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}