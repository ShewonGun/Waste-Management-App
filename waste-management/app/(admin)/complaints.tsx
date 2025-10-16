import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, RefreshControl, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';

interface Complaint {
  id: string;
  userId: string;
  complaint: string;
  status: 'pending' | 'resolved';
  timestamp: Date;
  imageUrl?: string;
}

export default function AdminComplaintsScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const complaintsData: Complaint[] = [];
      querySnapshot.forEach((doc) => {
        complaintsData.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
        } as Complaint);
      });
      setComplaints(complaintsData);
    });

    return unsubscribe;
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Since we're using real-time updates, just set refreshing to false
    setTimeout(() => setRefreshing(false), 1000);
  };

  const updateComplaintStatus = async (complaintId: string, newStatus: 'pending' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), {
        status: newStatus,
      });
      Alert.alert('Success', `Complaint marked as ${newStatus}.`);
    } catch (error) {
      console.error('Error updating complaint:', error);
      Alert.alert('Error', 'Failed to update complaint status.');
    }
  };

  const renderComplaint = ({ item }: { item: Complaint }) => (
    <View style={styles.complaintCard}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.complaintImage} />
      )}
      <Text style={styles.complaintText}>{item.complaint}</Text>
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
      </Text>
      <View style={styles.statusContainer}>
        <Text style={[styles.status, item.status === 'pending' ? styles.pending : styles.resolved]}>
          {item.status.toUpperCase()}
        </Text>
        <View style={styles.buttonContainer}>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.button, styles.resolveButton]}
              onPress={() => updateComplaintStatus(item.id, 'resolved')}
            >
              <MaterialIcons name="check" size={16} color="#fff" />
              <Text style={styles.buttonText}>Resolve</Text>
            </TouchableOpacity>
          )}
          {item.status === 'resolved' && (
            <TouchableOpacity
              style={[styles.button, styles.pendingButton]}
              onPress={() => updateComplaintStatus(item.id, 'pending')}
            >
              <MaterialIcons name="undo" size={16} color="#fff" />
              <Text style={styles.buttonText}>Mark Pending</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.header}>
        <Text style={styles.title}>Manage Complaints</Text>
        <Text style={styles.subtitle}>View and resolve user complaints</Text>
      </LinearGradient>

      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id}
        renderItem={renderComplaint}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="feedback" size={64} color={Colors.light.button} />
            <Text style={styles.emptyText}>No complaints yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
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
  listContainer: {
    padding: 16,
  },
  complaintCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  complaintText: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  statusContainer: {
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
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  resolveButton: {
    backgroundColor: '#10b981',
  },
  pendingButton: {
    backgroundColor: '#fbbf24',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.light.text,
    marginTop: 16,
  },
  complaintImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
});
