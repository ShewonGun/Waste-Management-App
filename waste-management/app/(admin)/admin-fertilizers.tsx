import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';
import { addFertilizer, getAllFertilizers, updateFertilizer, deleteFertilizer, FertilizerData } from '../../utils/database';
import { useRouter } from 'expo-router';
import { auth } from '../../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isUserAdmin } from '../../utils/database';

export default function AdminFertilizersScreen() {
  const router = useRouter();
  const [fertilizers, setFertilizers] = useState<FertilizerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFertilizer, setEditingFertilizer] = useState<FertilizerData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'kg',
    imageUrl: '',
    available: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminStatus = await isUserAdmin(user.uid);
          if (!adminStatus) {
            router.replace('(tabs)/index' as any);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          router.replace('(tabs)/index' as any);
        }
      } else {
        router.replace('/login');
      }
    });

    return unsubscribe;
  }, []);

  const loadFertilizers = async () => {
    try {
      const fertilizerList = await getAllFertilizers();
      setFertilizers(fertilizerList);
    } catch (error) {
      console.error('Error loading fertilizers:', error);
      Alert.alert('Error', 'Failed to load fertilizers. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFertilizers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadFertilizers();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      unit: 'kg',
      imageUrl: '',
      available: true,
    });
    setEditingFertilizer(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (fertilizer: FertilizerData) => {
    setFormData({
      name: fertilizer.name,
      description: fertilizer.description,
      price: fertilizer.price.toString(),
      unit: fertilizer.unit,
      imageUrl: fertilizer.imageUrl || '',
      available: fertilizer.available,
    });
    setEditingFertilizer(fertilizer);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const fertilizerData: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        unit: formData.unit,
        available: formData.available,
      };

      // Only include imageUrl if it's not empty
      if (formData.imageUrl && formData.imageUrl.trim() !== '') {
        fertilizerData.imageUrl = formData.imageUrl;
      }

      if (editingFertilizer) {
        await updateFertilizer(editingFertilizer.fertilizerId, fertilizerData);
        Alert.alert('Success', 'Fertilizer updated successfully');
      } else {
        await addFertilizer(fertilizerData);
        Alert.alert('Success', 'Fertilizer added successfully');
      }

      setModalVisible(false);
      resetForm();
      loadFertilizers();
    } catch (error) {
      console.error('Error saving fertilizer:', error);
      Alert.alert('Error', 'Failed to save fertilizer. Please try again.');
    }
  };

  const handleDelete = async (fertilizerId: string, name: string) => {
    Alert.alert(
      'Delete Fertilizer',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFertilizer(fertilizerId);
              Alert.alert('Success', 'Fertilizer deleted successfully');
              loadFertilizers();
            } catch (error) {
              console.error('Error deleting fertilizer:', error);
              Alert.alert('Error', 'Failed to delete fertilizer. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderFertilizerItem = ({ item }: { item: FertilizerData }) => (
    <View style={{
      backgroundColor: 'white',
      margin: 10,
      borderRadius: 10,
      padding: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.light.tint }}>
          {item.name}
        </Text>
        <View style={{
          backgroundColor: item.available ? '#4CAF50' : '#F44336',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
            {item.available ? 'AVAILABLE' : 'UNAVAILABLE'}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
        {item.description}
      </Text>

      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4CAF50', marginBottom: 10 }}>
        ${item.price} per {item.unit}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#2196F3',
            padding: 10,
            borderRadius: 5,
            flex: 1,
            marginRight: 5,
          }}
          onPress={() => openEditModal(item)}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: '#F44336',
            padding: 10,
            borderRadius: 5,
            flex: 1,
            marginLeft: 5,
          }}
          onPress={() => handleDelete(item.fertilizerId, item.name)}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient colors={['#4CAF50', '#45a049']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: 'white', marginTop: 10, fontSize: 16 }}>Loading Fertilizers...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#4CAF50', '#45a049']} style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: 50 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: 'white',
          }}>
            Fertilizer Management
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              padding: 10,
              borderRadius: 25,
            }}
            onPress={openAddModal}
          >
            <MaterialIcons name="add" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={fertilizers}
          keyExtractor={(item) => item.fertilizerId}
          renderItem={renderFertilizerItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <MaterialIcons name="grass" size={64} color="white" />
              <Text style={{ color: 'white', fontSize: 18, marginTop: 10 }}>
                No fertilizers found
              </Text>
            </View>
          }
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: 'white', margin: 20, borderRadius: 10, padding: 20, width: '90%', maxHeight: '80%' }}>
              <ScrollView>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
                  {editingFertilizer ? 'Edit Fertilizer' : 'Add New Fertilizer'}
                </Text>

                <TextInput
                  style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 15, borderRadius: 5 }}
                  placeholder="Fertilizer Name *"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />

                <TextInput
                  style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 15, borderRadius: 5 }}
                  placeholder="Description *"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={3}
                />

                <TextInput
                  style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 15, borderRadius: 5 }}
                  placeholder="Price per unit *"
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  keyboardType="numeric"
                />

                <TextInput
                  style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 15, borderRadius: 5 }}
                  placeholder="Unit (kg, bag, liter, etc.)"
                  value={formData.unit}
                  onChangeText={(text) => setFormData({ ...formData, unit: text })}
                />

                <TextInput
                  style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 15, borderRadius: 5 }}
                  placeholder="Image URL (optional)"
                  value={formData.imageUrl}
                  onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                  <TouchableOpacity
                    style={{ backgroundColor: '#666', padding: 15, borderRadius: 5, flex: 1, marginRight: 10 }}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: '#4CAF50', padding: 15, borderRadius: 5, flex: 1, marginLeft: 10 }}
                    onPress={handleSave}
                  >
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                      {editingFertilizer ? 'Update' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
}