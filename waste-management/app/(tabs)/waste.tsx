import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/theme';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { saveWasteData } from '../../utils/database';
import { auth } from '../../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isUserAdmin } from '../../utils/database';

interface WasteType {
  id: string;
  name: string;
  icon: string;
}

const wasteTypes: WasteType[] = [
  { id: 'household', name: 'Household Waste', icon: 'home' },
  { id: 'electronic', name: 'Electronic Waste', icon: 'devices' },
  { id: 'construction', name: 'Construction Waste', icon: 'build' },
  { id: 'organic', name: 'Organic Waste', icon: 'nature' },
  { id: 'hazardous', name: 'Hazardous Waste', icon: 'warning' },
  { id: 'other', name: 'Other', icon: 'category' },
];

const timeSlots = [
  '9:00 AM - 11:00 AM',
  '11:00 AM - 1:00 PM',
  '1:00 PM - 3:00 PM',
  '3:00 PM - 5:00 PM',
  '5:00 PM - 7:00 PM',
];

export default function WasteScreen() {
  const router = useRouter();
  const [selectedWasteType, setSelectedWasteType] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [pickupDate, setPickupDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminStatus = await isUserAdmin(user.uid);
          if (adminStatus) {
            router.replace('(admin)/admin-recycle-schedules' as any);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
    });

    return unsubscribe;
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await uploadImageToCloudinary(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await uploadImageToCloudinary(result.assets[0].uri);
    }
  };

  const uploadImageToCloudinary = async (uri: string) => {
    setIsUploading(true);
    try {
      const cloudinaryUrl = await uploadToCloudinary(uri);
      setCloudinaryUrl(cloudinaryUrl);
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
      setImageUri(null); // Remove the local image if upload failed
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedWasteType || !quantity || !pickupDate || !selectedTimeSlot) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    // Prepare waste data for saving
    const wasteData = {
      wasteType: selectedWasteType,
      quantity,
      pickupDate: pickupDate.toISOString(),
      timeSlot: selectedTimeSlot,
      specialInstructions,
      ...(cloudinaryUrl && { imageUrl: cloudinaryUrl }), // Only include if cloudinaryUrl exists
    };

    console.log('Submitting waste data:', wasteData);

    // Save to Firestore
    saveWasteData(wasteData)
      .then((wasteId) => {
        console.log('Waste data saved successfully with ID:', wasteId);

        // Navigate to success screen with submission details
        router.push({
          pathname: '/waste-submission-success',
          params: {
            wasteType: wasteTypes.find(type => type.id === selectedWasteType)?.name || selectedWasteType,
            quantity,
            pickupDate: pickupDate.toLocaleDateString(),
            timeSlot: selectedTimeSlot,
            wasteId,
            imageUploaded: cloudinaryUrl ? 'true' : 'false',
            specialInstructions: specialInstructions || '',
          },
        });
      })
      .catch((error) => {
        console.error('Error saving waste data:', error);
        Alert.alert(
          'Error',
          'Failed to schedule waste pickup. Please try again.',
          [{ text: 'OK' }]
        );
      });
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#22c55e', '#16a34a']}
        style={{
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
        }}
      >
        <View style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingLeft: 40,
          gap: 20,
        }}>
          <View style={{
            alignItems: 'center',
          }}>
            <Text style={{
              color: '#fff',
              fontSize: 38,
              fontWeight: 'bold',
              letterSpacing: 1.1,
              marginBottom: 6,
              textShadowColor: 'rgba(0,0,0,0.18)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 8,
            }}>
              Waste
            </Text>
            <Text style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: '600',
              letterSpacing: 0.7,
              textShadowColor: 'rgba(0,0,0,0.13)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 6,
            }}>
              Schedule a pickup
            </Text>
          </View>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
            onPress={() => router.push('/waste-schedules')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="schedule" size={20} color="#fff" />
            <Text style={{
              color: '#fff',
              fontSize: 14,
              fontWeight: '600',
              marginLeft: 6,
            }}>
              My Schedules
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>

        {/* Waste Type Selection */}
        <View style={{ marginBottom: 25 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: 15,
          }}>
            Select Waste Type *
          </Text>
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            {wasteTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: selectedWasteType === type.id
                    ? Colors.light.button
                    : Colors.light.inputBackground,
                  borderRadius: 12,
                  padding: 15,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: selectedWasteType === type.id
                    ? Colors.light.button
                    : Colors.light.inputBorder,
                }}
                onPress={() => setSelectedWasteType(type.id)}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={type.icon as any}
                  size={24}
                  color={selectedWasteType === type.id
                    ? Colors.light.buttonText
                    : Colors.light.icon}
                />
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: selectedWasteType === type.id
                    ? Colors.light.buttonText
                    : Colors.light.text,
                  marginTop: 5,
                  textAlign: 'center',
                }}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quantity Input */}
        <View style={{ marginBottom: 25 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: 10,
          }}>
            Estimated Quantity *
          </Text>
          <TextInput
            style={{
              backgroundColor: Colors.light.inputBackground,
              borderRadius: 12,
              padding: 15,
              fontSize: 16,
              color: Colors.light.text,
              borderWidth: 1,
              borderColor: Colors.light.inputBorder,
            }}
            placeholder="e.g., 2 bags, 50kg, 3 boxes"
            placeholderTextColor={Colors.light.icon}
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>

        {/* Pickup Date */}
        <View style={{ marginBottom: 25 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: 10,
          }}>
            Pickup Date *
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: Colors.light.inputBackground,
              borderRadius: 12,
              padding: 15,
              borderWidth: 1,
              borderColor: Colors.light.inputBorder,
            }}
            onPress={openDatePicker}
            activeOpacity={0.8}
          >
            <Text style={{
              fontSize: 16,
              color: pickupDate ? Colors.light.text : Colors.light.icon,
            }}>
              {pickupDate ? pickupDate.toDateString() : 'Select pickup date'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Slots */}
        <View style={{ marginBottom: 25 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: 15,
          }}>
            Available Time Slots *
          </Text>
          {timeSlots.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={{
                backgroundColor: selectedTimeSlot === slot
                  ? Colors.light.button
                  : Colors.light.inputBackground,
                borderRadius: 12,
                padding: 15,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: selectedTimeSlot === slot
                  ? Colors.light.button
                  : Colors.light.inputBorder,
              }}
              onPress={() => setSelectedTimeSlot(slot)}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 16,
                color: selectedTimeSlot === slot
                  ? Colors.light.buttonText
                  : Colors.light.text,
                textAlign: 'center',
              }}>
                {slot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Picture Upload */}
        <View style={{ marginBottom: 25 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: 10,
          }}>
            Photo (Optional)
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: Colors.light.inputBackground,
                borderRadius: 12,
                padding: 15,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.light.inputBorder,
              }}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <MaterialIcons name="photo-library" size={24} color={Colors.light.icon} />
              <Text style={{
                fontSize: 14,
                color: Colors.light.icon,
                marginTop: 5,
              }}>
                Gallery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: Colors.light.inputBackground,
                borderRadius: 12,
                padding: 15,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.light.inputBorder,
              }}
              onPress={takePhoto}
              activeOpacity={0.8}
            >
              <MaterialIcons name="camera-alt" size={24} color={Colors.light.icon} />
              <Text style={{
                fontSize: 14,
                color: Colors.light.icon,
                marginTop: 5,
              }}>
                Camera
              </Text>
            </TouchableOpacity>
          </View>
          {imageUri && (
            <View style={{ marginTop: 10, alignItems: 'center' }}>
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: Colors.light.inputBorder,
                }}
              />
              {isUploading && (
                <View style={{
                  position: 'absolute',
                  top: 35,
                  left: 35,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  borderRadius: 20,
                  padding: 8,
                }}>
                  <ActivityIndicator size="small" color={Colors.light.buttonText} />
                </View>
              )}
              <TouchableOpacity
                style={{ marginTop: 5 }}
                onPress={() => {
                  setImageUri(null);
                  setCloudinaryUrl(null);
                }}
                activeOpacity={0.8}
                disabled={isUploading}
              >
                <Text style={{
                  fontSize: 14,
                  color: isUploading ? Colors.light.icon : Colors.light.error,
                }}>
                  {isUploading ? 'Uploading...' : 'Remove photo'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Special Instructions */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: 10,
          }}>
            Special Instructions (Optional)
          </Text>
          <TextInput
            style={{
              backgroundColor: Colors.light.inputBackground,
              borderRadius: 12,
              padding: 15,
              fontSize: 16,
              color: Colors.light.text,
              borderWidth: 1,
              borderColor: Colors.light.inputBorder,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            placeholder="Any special handling instructions..."
            placeholderTextColor={Colors.light.icon}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={{
            backgroundColor: Colors.light.button,
            borderRadius: 12,
            padding: 18,
            alignItems: 'center',
            marginBottom: 20,
          }}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: Colors.light.buttonText,
          }}>
            Schedule Waste Pickup
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={pickupDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event: any, selectedDate?: Date) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setPickupDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}