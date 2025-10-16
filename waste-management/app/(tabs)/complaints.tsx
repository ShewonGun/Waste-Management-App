import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, FlatList, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { auth } from '../../utils/firebase';
import { addDoc, collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { uploadToCloudinary } from '../../utils/cloudinary';
import * as ImagePicker from 'expo-image-picker';

interface Complaint {
  id: string;
  complaint: string;
  status: 'pending' | 'resolved';
  timestamp: Date;
  imageUrl?: string;
}

export default function ComplaintsScreen() {
  const [complaint, setComplaint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingComplaintId, setEditingComplaintId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'complaints'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const complaintsData: Complaint[] = [];
      querySnapshot.forEach((doc) => {
        complaintsData.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
        } as Complaint);
      });
      // Sort by timestamp in descending order (newest first)
      complaintsData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setUserComplaints(complaintsData);
    });

    return unsubscribe;
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setIsUploadingImage(true);
      const imageUrl = await uploadToCloudinary(uri);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditComplaint = (complaint: Complaint) => {
    // Set the form to edit mode
    setComplaint(complaint.complaint);
    setSelectedImage(complaint.imageUrl || null);
    setEditingComplaintId(complaint.id);
  };

  const handleDeleteComplaint = (complaintId: string) => {
    Alert.alert(
      'Delete Complaint',
      'Are you sure you want to delete this complaint?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteComplaint(complaintId),
        },
      ]
    );
  };

  const deleteComplaint = async (complaintId: string) => {
    try {
      await deleteDoc(doc(db, 'complaints', complaintId));
      Alert.alert('Success', 'Complaint deleted successfully.');
    } catch (error) {
      console.error('Error deleting complaint:', error);
      Alert.alert('Error', 'Failed to delete complaint. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!complaint.trim()) {
      Alert.alert('Error', 'Please enter your complaint.');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to submit a complaint.');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = selectedImage;

      // Only upload new image if it's not already a URL (i.e., newly selected)
      if (selectedImage && !selectedImage.startsWith('http')) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          // Image upload failed, but continue with complaint submission
          Alert.alert('Warning', 'Image upload failed, but complaint will be submitted without image.');
          imageUrl = null;
        }
      }

      const complaintData = {
        userId: auth.currentUser.uid,
        complaint: complaint.trim(),
        status: 'pending' as const,
        timestamp: new Date(),
        imageUrl,
      };

      if (editingComplaintId) {
        // Update existing complaint
        await updateDoc(doc(db, 'complaints', editingComplaintId), complaintData);
        Alert.alert('Success', 'Complaint updated successfully.');
        setEditingComplaintId(null);
      } else {
        // Create new complaint
        await addDoc(collection(db, 'complaints'), complaintData);
        Alert.alert('Success', 'Your complaint has been submitted.');
      }

      setComplaint('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      Alert.alert('Error', 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComplaint = ({ item }: { item: Complaint }) => (
    <View style={styles.complaintCard}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.complaintImage} />
      )}
      <Text style={styles.complaintText}>{item.complaint}</Text>
      <View style={styles.complaintFooter}>
        <Text style={[styles.status, item.status === 'pending' ? styles.pending : styles.resolved]}>
          {item.status.toUpperCase()}
        </Text>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
        </Text>
      </View>
      <View style={styles.complaintActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditComplaint(item)}
        >
          <MaterialIcons name="edit" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteComplaint(item.id)}
        >
          <MaterialIcons name="delete" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.header}>
        <Text style={styles.title}>
          {editingComplaintId ? 'Edit Complaint' : 'Submit Complaint'}
        </Text>
        <Text style={styles.subtitle}>
          {editingComplaintId ? 'Update your complaint' : 'Let us know how we can improve'}
        </Text>
      </LinearGradient>

      <View style={styles.form}>
        <Text style={styles.label}>Your Complaint</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={6}
          placeholder="Describe your complaint or suggestion..."
          value={complaint}
          onChangeText={setComplaint}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Attach Photo (Optional)</Text>
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          <MaterialIcons name="photo-camera" size={24} color="#666" />
          <Text style={styles.imagePickerText}>
            {selectedImage ? 'Change Photo' : 'Add Photo'}
          </Text>
        </TouchableOpacity>

        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <MaterialIcons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {editingComplaintId && (
            <TouchableOpacity
              style={[styles.cancelButton]}
              onPress={() => {
                setEditingComplaintId(null);
                setComplaint('');
                setSelectedImage(null);
              }}
            >
              <MaterialIcons name="cancel" size={20} color="#666" />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitButton, (isSubmitting || isUploadingImage) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || isUploadingImage}
          >
            <MaterialIcons name={editingComplaintId ? "update" : "send"} size={20} color="#fff" />
            <Text style={styles.submitText}>
              {isSubmitting ? 'Submitting...' : isUploadingImage ? 'Uploading...' : editingComplaintId ? 'Update Complaint' : 'Submit Complaint'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {userComplaints.length > 0 && (
        <View style={styles.complaintsSection}>
          <Text style={styles.sectionTitle}>Your Previous Complaints</Text>
          <FlatList
            data={userComplaints}
            keyExtractor={(item) => item.id}
            renderItem={renderComplaint}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 44,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 24,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: Colors.light.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  complaintsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  complaintCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  complaintText: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pending: {
    backgroundColor: '#fbbf24',
    color: '#fff',
  },
  resolved: {
    backgroundColor: '#10b981',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  separator: {
    height: 8,
  },
  complaintImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
    gap: 8,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#666',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complaintActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 8,
  },
  cancelText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
});
