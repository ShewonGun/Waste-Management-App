import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/theme';
import { getUserProfile, updateUserProfile, createUserProfile, UserProfile, getUserPoints } from '../utils/database';
import { uploadProfileImageToCloudinary } from '../utils/cloudinary';
import ProfileAvatar from '../components/profile-avatar';
import { useRouter } from 'expo-router';
import { auth } from '../utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadUserProfile();
      } else {
        router.replace('/login');
      }
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      if (profile) {
        setUserProfile(profile);
        setFormData({
          displayName: profile.displayName || '',
          email: profile.email || '',
        });
        
        // Load current points separately to ensure accuracy
        const points = await getUserPoints();
        setCurrentPoints(points);
      } else {
        // If no profile exists, create one with Firebase Auth data
        const user = auth.currentUser;
        if (user) {
          const defaultProfile = {
            userId: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            role: 'user' as const, // Default role
            points: 0, // Initialize with 0 points
            createdAt: new Date(),
          };

          // Create the profile in database
          await createUserProfile({
            email: defaultProfile.email,
            displayName: defaultProfile.displayName,
            role: defaultProfile.role,
            points: 0, // Initialize with 0 points
          });

          setUserProfile(defaultProfile as any);
          setFormData({
            displayName: defaultProfile.displayName,
            email: defaultProfile.email,
          });
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUserProfile();
  };

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: formData.displayName.trim(),
      });
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
      await loadUserProfile(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/login');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setFormData({
      displayName: userProfile?.displayName || '',
      email: userProfile?.email || '',
    });
    setIsEditing(false);
  };

  const pickImage = async () => {
    // Request camera roll permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    Alert.alert(
      'Select Profile Picture',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Photo Library', onPress: () => openImagePicker() },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadProfileImage(result.assets[0].uri);
    }
  };

  const openImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadProfileImage(result.assets[0].uri);
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    setIsUploadingImage(true);
    try {
      console.log('Uploading profile image:', imageUri);
      const imageUrl = await uploadProfileImageToCloudinary(imageUri);
      console.log('Profile image uploaded successfully:', imageUrl);

      // Update user profile with new image URL
      await updateUserProfile({ profileImageUrl: imageUrl });
      
      // Reload profile to get updated data
      await loadUserProfile();
      
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[Colors.light.tint]}
        />
      }
    >
      <LinearGradient
        colors={[Colors.light.tint, Colors.light.tint + '80']}
        style={{ padding: 20, paddingTop: 60 }}
      >
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <ProfileAvatar
            imageUrl={userProfile?.profileImageUrl}
            size={100}
            onPress={pickImage}
            isLoading={isUploadingImage}
            showEditButton={true}
          />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: 15 }}>
            {userProfile?.displayName || 'User'}
          </Text>
          <Text style={{ fontSize: 16, color: 'white', opacity: 0.9 }}>
            {userProfile?.role === 'admin' ? 'Administrator' : 'User'}
          </Text>
          <Text style={{ fontSize: 12, color: 'white', opacity: 0.7, marginTop: 5 }}>
            Tap photo to change
          </Text>
        </View>
      </LinearGradient>

      <View style={{ padding: 20 }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 15,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.light.tint, marginBottom: 20 }}>
            Profile Information
          </Text>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Display Name</Text>
            {isEditing ? (
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: '#f9f9f9',
                }}
                value={formData.displayName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
                placeholder="Enter your display name"
              />
            ) : (
              <Text style={{ fontSize: 16, color: '#333', padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                {userProfile?.displayName || 'Not set'}
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Email</Text>
            <Text style={{ fontSize: 16, color: '#333', padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
              {userProfile?.email || 'Not set'}
            </Text>
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Role</Text>
            <Text style={{ fontSize: 16, color: '#333', padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
              {userProfile?.role === 'admin' ? 'Administrator' : 'User'}
            </Text>
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Eco Points</Text>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              padding: 12, 
              backgroundColor: '#f0f9f0', 
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: '#4CAF50'
            }}>
              <MaterialIcons name="eco" size={20} color="#4CAF50" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 16, color: '#2d5a2d', fontWeight: 'bold', flex: 1 }}>
                {currentPoints} points
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                ≈ LKR {(currentPoints * 3.00).toFixed(2)} discount
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Member Since</Text>
            <Text style={{ fontSize: 16, color: '#333', padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
              {userProfile?.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: 'white',
          borderRadius: 15,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          {isEditing ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#f44336',
                  padding: 15,
                  borderRadius: 10,
                  marginRight: 10,
                  alignItems: 'center',
                }}
                onPress={handleCancel}
                disabled={isSaving}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: isSaving ? '#ccc' : Colors.light.tint,
                  padding: 15,
                  borderRadius: 10,
                  marginLeft: 10,
                  alignItems: 'center',
                }}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: Colors.light.tint,
                padding: 15,
                borderRadius: 10,
                alignItems: 'center',
                marginBottom: 15,
              }}
              onPress={() => setIsEditing(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="edit" size={20} color="white" />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }}>
                  Edit Profile
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{
              backgroundColor: '#f44336',
              padding: 15,
              borderRadius: 10,
              alignItems: 'center',
            }}
            onPress={handleLogout}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="logout" size={20} color="white" />
              <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }}>
                Logout
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}