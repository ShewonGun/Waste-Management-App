import { collection, addDoc, serverTimestamp, doc, updateDoc, setDoc, query, where, getDocs, getDoc, orderBy, deleteDoc, writeBatch } from "firebase/firestore";
import { db, auth } from "./firebase";

export interface PickupData {
  userId: string;
  materials: string[];
  quantities: Record<string, number>;
  totalAmount: number;
  paymentMethod: string;
  pickupDate: string | any; // Can be string or Firestore Timestamp
  pickupTime: string | any; // Can be string or Firestore Timestamp
  pickupAddress: string;
  pickupId: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: any;
}

export interface WasteData {
  userId: string;
  wasteType: string;
  quantity: string;
  pickupDate: string;
  timeSlot: string;
  specialInstructions: string;
  imageUrl?: string;
  wasteId: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: any;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  profileImageUrl?: string;
  createdAt: any;
}

export interface FertilizerData {
  fertilizerId: string;
  name: string;
  description: string;
  price: number;
  unit: string; // e.g., 'kg', 'bag', 'liter'
  imageUrl?: string;
  available: boolean;
  createdAt: any;
}

export interface FertilizerPurchaseData {
  purchaseId: string;
  userId: string;
  fertilizerId: string;
  fertilizerName: string;
  quantity: number;
  totalAmount: number;
  purchaseDate: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  createdAt: any;
}

export interface CartItem {
  cartItemId: string;
  userId: string;
  fertilizerId: string;
  fertilizerName: string;
  fertilzerPrice: number;
  fertilizerUnit: string;
  quantity: number;
  totalAmount: number;
  createdAt: any;
}

export const savePickupData = async (pickupData: Omit<PickupData, 'userId' | 'pickupId' | 'status' | 'createdAt'>): Promise<string> => {
  try {
    console.log('savePickupData called with:', pickupData);

    const user = auth.currentUser;
    console.log('Current user:', user);

    if (!user) {
      throw new Error('User must be authenticated to save pickup data');
    }

    // Generate unique pickup ID
    const pickupId = `ECO${Date.now().toString().slice(-8)}`;
    console.log('Generated pickupId:', pickupId);

    const dataToSave: PickupData = {
      ...pickupData,
      userId: user.uid,
      pickupId,
      status: 'scheduled',
      createdAt: serverTimestamp(),
    };

    console.log('Data to save:', dataToSave);
    console.log('Attempting to save to collection: pickups');

    const docRef = await addDoc(collection(db, 'pickups'), dataToSave);
    console.log('Pickup data saved successfully with document ID: ', docRef.id);
    console.log('Pickup ID returned:', pickupId);

    return pickupId;
  } catch (error) {
    console.error('Error in savePickupData:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

export const saveWasteData = async (wasteData: Omit<WasteData, 'userId' | 'wasteId' | 'status' | 'createdAt'>): Promise<string> => {
  try {
    console.log('saveWasteData called with:', wasteData);

    const user = auth.currentUser;
    console.log('Current user:', user);

    if (!user) {
      throw new Error('User must be authenticated to save waste data');
    }

    // Generate unique waste ID
    const wasteId = `WASTE${Date.now().toString().slice(-8)}`;
    console.log('Generated wasteId:', wasteId);

    const dataToSave: WasteData = {
      ...wasteData,
      userId: user.uid,
      wasteId,
      status: 'scheduled',
      createdAt: serverTimestamp(),
    };

    console.log('Data to save:', dataToSave);
    console.log('Attempting to save to collection: wastes');

    const docRef = await addDoc(collection(db, 'wastes'), dataToSave);
    console.log('Waste data saved successfully with document ID: ', docRef.id);
    console.log('Waste ID returned:', wasteId);

    return wasteId;
  } catch (error) {
    console.error('Error in saveWasteData:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

export const updatePickup = async (pickupId: string, updateData: Partial<PickupData>) => {
  try {
    console.log('updatePickup called with:', { pickupId, updateData });

    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to update pickup data');
    }

    // Query for the document with the specific pickupId
    const q = query(
      collection(db, 'pickups'),
      where('pickupId', '==', pickupId),
      where('userId', '==', user.uid)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Pickup not found or access denied');
    }

    const docRef = querySnapshot.docs[0].ref;

    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });

    console.log('Pickup updated successfully');
  } catch (error) {
    console.error('Error updating pickup:', error);
    throw error;
  }
};

export const deletePickup = async (pickupId: string) => {
  try {
    console.log('deletePickup called with:', { pickupId });

    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to delete pickup data');
    }

    // Query for the document with the specific pickupId
    const q = query(
      collection(db, 'pickups'),
      where('pickupId', '==', pickupId),
      where('userId', '==', user.uid)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Pickup not found or access denied');
    }

    const docRef = querySnapshot.docs[0].ref;

    await deleteDoc(docRef);

    console.log('Pickup deleted successfully');
  } catch (error) {
    console.error('Error deleting pickup:', error);
    throw error;
  }
};

export const getUserPickups = async (): Promise<PickupData[]> => {
  try {
    console.log('getUserPickups called');

    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to get pickups');
    }

    // First try with composite index (recommended for production)
    try {
      const q = query(
        collection(db, 'pickups'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const pickups: PickupData[] = [];

      querySnapshot.forEach((doc) => {
        pickups.push(doc.data() as PickupData);
      });

      console.log('Retrieved pickups with index:', pickups.length);
      return pickups;
    } catch (indexError) {
      // Fallback: Get all pickups and filter/sort in JavaScript
      console.log('Index not available, using fallback query');
      const q = query(collection(db, 'pickups'));
      const querySnapshot = await getDocs(q);
      const allPickups: PickupData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as PickupData;
        if (data.userId === user.uid) {
          allPickups.push(data);
        }
      });

      // Sort by createdAt in descending order
      allPickups.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt as string);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt as string);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('Retrieved pickups with fallback:', allPickups.length);
      return allPickups;
    }
  } catch (error) {
    console.error('Error getting user pickups:', error);
    throw error;
  }
};

export const updateWasteData = async (wasteId: string, updateData: Partial<WasteData>) => {
  try {
    console.log('updateWasteData called with:', { wasteId, updateData });

    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to update waste data');
    }

    // Query for the document with the specific wasteId
    const q = query(
      collection(db, 'wastes'),
      where('wasteId', '==', wasteId),
      where('userId', '==', user.uid)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Waste pickup not found or access denied');
    }

    const docRef = querySnapshot.docs[0].ref;

    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });

    console.log('Waste pickup updated successfully');
  } catch (error) {
    console.error('Error updating waste pickup:', error);
    throw error;
  }
};

export const cancelWasteData = async (wasteId: string) => {
  try {
    console.log('cancelWasteData called with:', { wasteId });

    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to cancel waste data');
    }

    // Query for the document with the specific wasteId
    const q = query(
      collection(db, 'wastes'),
      where('wasteId', '==', wasteId),
      where('userId', '==', user.uid)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Waste pickup not found or access denied');
    }

    const docRef = querySnapshot.docs[0].ref;

    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });

    console.log('Waste pickup cancelled successfully');
  } catch (error) {
    console.error('Error cancelling waste pickup:', error);
    throw error;
  }
};

export const deleteWasteData = async (wasteId: string) => {
  try {
    console.log('deleteWasteData called with:', { wasteId });

    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to delete waste data');
    }

    // Query for the document with the specific wasteId
    const q = query(
      collection(db, 'wastes'),
      where('wasteId', '==', wasteId),
      where('userId', '==', user.uid)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Waste pickup not found or access denied');
    }

    const docRef = querySnapshot.docs[0].ref;

    await deleteDoc(docRef);

    console.log('Waste pickup deleted successfully');
  } catch (error) {
    console.error('Error deleting waste pickup:', error);
    throw error;
  }
};

export const getUserWaste = async (): Promise<WasteData[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to get waste data');
    }

    console.log('Getting waste data for user:', user.uid);

    try {
      // Try with index first (userId and createdAt)
      const q = query(
        collection(db, 'wastes'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const waste: WasteData[] = [];

      querySnapshot.forEach((doc) => {
        waste.push(doc.data() as WasteData);
      });

      console.log('Retrieved waste with index:', waste.length);
      return waste;
    } catch (indexError) {
      // Fallback: Get all waste and filter/sort in JavaScript
      console.log('Index not available, using fallback query');
      const q = query(collection(db, 'wastes'));
      const querySnapshot = await getDocs(q);
      const allWaste: WasteData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as WasteData;
        if (data.userId === user.uid) {
          allWaste.push(data);
        }
      });

      // Sort by createdAt in descending order
      allWaste.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt as string);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt as string);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('Retrieved waste with fallback:', allWaste.length);
      return allWaste;
    }
  } catch (error) {
    console.error('Error getting user waste:', error);
    throw error;
  }
}

// User Profile Functions
export const createUserProfile = async (userData: Omit<UserProfile, 'userId' | 'createdAt'>): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to create profile');
    }

    const userProfileRef = doc(db, 'userProfiles', user.uid);
    await setDoc(userProfileRef, {
      ...userData,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId?: string): Promise<UserProfile | null> => {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) {
      throw new Error('User must be authenticated to get profile');
    }

    const userProfileRef = doc(db, 'userProfiles', uid);
    const userProfileSnap = await getDoc(userProfileRef);

    if (userProfileSnap.exists()) {
      const data = userProfileSnap.data();
      return {
        userId: data.userId,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        profileImageUrl: data.profileImageUrl,
        createdAt: data.createdAt,
      } as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (updates: Partial<Omit<UserProfile, 'userId' | 'createdAt'>>): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to update profile');
    }

    const userProfileRef = doc(db, 'userProfiles', user.uid);
    await updateDoc(userProfileRef, updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const isUserAdmin = async (userId?: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(userId);
    return profile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Admin Functions for updating any waste/pickup data
export const adminUpdateWasteStatus = async (wasteId: string, status: WasteData['status']) => {
  try {
    console.log('adminUpdateWasteStatus called with:', { wasteId, status });

    // Query for the document with the specific wasteId (no user restriction for admin)
    const q = query(
      collection(db, 'wastes'),
      where('wasteId', '==', wasteId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Waste pickup not found');
    }

    const docRef = querySnapshot.docs[0].ref;

    await updateDoc(docRef, {
      status: status,
      updatedAt: serverTimestamp(),
    });

    console.log('Waste pickup status updated successfully by admin');
  } catch (error) {
    console.error('Error updating waste pickup status:', error);
    throw error;
  }
};

export const adminUpdatePickupStatus = async (pickupId: string, status: PickupData['status']) => {
  try {
    console.log('adminUpdatePickupStatus called with:', { pickupId, status });

    // Query for the document with the specific pickupId (no user restriction for admin)
    const q = query(
      collection(db, 'pickups'),
      where('pickupId', '==', pickupId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Pickup not found');
    }

    const docRef = querySnapshot.docs[0].ref;

    await updateDoc(docRef, {
      status: status,
      updatedAt: serverTimestamp(),
    });

    console.log('Pickup status updated successfully by admin');
  } catch (error) {
    console.error('Error updating pickup status:', error);
    throw error;
  }
};

// Fertilizer Management Functions
export const getAllPickups = async (): Promise<PickupData[]> => {
  try {
    const pickupsRef = collection(db, 'pickups');
    const q = query(pickupsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const pickups: PickupData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      pickups.push({
        userId: data.userId,
        materials: data.materials,
        quantities: data.quantities,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
        pickupAddress: data.pickupAddress,
        pickupId: data.pickupId,
        status: data.status,
        createdAt: data.createdAt,
      });
    });

    return pickups;
  } catch (error) {
    console.error('Error getting all pickups:', error);
    throw error;
  }
};

export const getAllWaste = async (): Promise<WasteData[]> => {
  try {
    const wasteRef = collection(db, 'wastes');
    const q = query(wasteRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const waste: WasteData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      waste.push({
        userId: data.userId,
        wasteType: data.wasteType,
        quantity: data.quantity,
        pickupDate: data.pickupDate,
        timeSlot: data.timeSlot,
        specialInstructions: data.specialInstructions,
        imageUrl: data.imageUrl,
        wasteId: data.wasteId,
        status: data.status,
        createdAt: data.createdAt,
      });
    });

    return waste;
  } catch (error) {
    console.error('Error getting all waste:', error);
    throw error;
  }
};

export const cancelPickupData = async (pickupId: string) => {
  return updatePickup(pickupId, { status: 'cancelled' });
};

export const deletePickupData = async (pickupId: string) => {
  return deletePickup(pickupId);
};

// Fertilizer Management Functions
export const addFertilizer = async (fertilizerData: Omit<FertilizerData, 'fertilizerId' | 'createdAt'>): Promise<string> => {
  try {
    const fertilizerRef = collection(db, 'fertilizers');
    const docRef = await addDoc(fertilizerRef, {
      ...fertilizerData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding fertilizer:', error);
    throw error;
  }
};

export const getAllFertilizers = async (): Promise<FertilizerData[]> => {
  try {
    const fertilizerRef = collection(db, 'fertilizers');
    const q = query(fertilizerRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const fertilizers: FertilizerData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      fertilizers.push({
        fertilizerId: doc.id,
        name: data.name,
        description: data.description,
        price: data.price,
        unit: data.unit,
        imageUrl: data.imageUrl,
        available: data.available,
        createdAt: data.createdAt,
      });
    });

    return fertilizers;
  } catch (error) {
    console.error('Error getting all fertilizers:', error);
    throw error;
  }
};

export const updateFertilizer = async (fertilizerId: string, updates: Partial<FertilizerData>) => {
  try {
    const fertilizerRef = doc(db, 'fertilizers', fertilizerId);
    await updateDoc(fertilizerRef, updates);
  } catch (error) {
    console.error('Error updating fertilizer:', error);
    throw error;
  }
};

export const deleteFertilizer = async (fertilizerId: string) => {
  try {
    const fertilizerRef = doc(db, 'fertilizers', fertilizerId);
    await deleteDoc(fertilizerRef);
  } catch (error) {
    console.error('Error deleting fertilizer:', error);
    throw error;
  }
};

// Fertilizer Purchase Functions
export const purchaseFertilizer = async (purchaseData: Omit<FertilizerPurchaseData, 'purchaseId' | 'userId' | 'createdAt'>): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to purchase fertilizer');
    }

    const purchaseRef = collection(db, 'fertilizerPurchases');
    const docRef = await addDoc(purchaseRef, {
      ...purchaseData,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error purchasing fertilizer:', error);
    throw error;
  }
};

export const getUserFertilizerPurchases = async (userId?: string): Promise<FertilizerPurchaseData[]> => {
  try {
    const targetUserId = userId || auth.currentUser?.uid;
    if (!targetUserId) {
      throw new Error('User must be authenticated');
    }

    // Get all purchases and filter client-side to avoid index requirement
    const allPurchases = await getAllFertilizerPurchases();
    const userPurchases = allPurchases.filter(purchase => purchase.userId === targetUserId);

    return userPurchases;
  } catch (error) {
    console.error('Error getting user fertilizer purchases:', error);
    throw error;
  }
};

export const getAllFertilizerPurchases = async (): Promise<FertilizerPurchaseData[]> => {
  try {
    const purchaseRef = collection(db, 'fertilizerPurchases');
    const q = query(purchaseRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const purchases: FertilizerPurchaseData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      purchases.push({
        purchaseId: doc.id,
        userId: data.userId,
        fertilizerId: data.fertilizerId,
        fertilizerName: data.fertilizerName,
        quantity: data.quantity,
        totalAmount: data.totalAmount,
        purchaseDate: data.purchaseDate,
        status: data.status,
        deliveryAddress: data.deliveryAddress,
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        customerEmail: data.customerEmail || '',
        createdAt: data.createdAt,
      });
    });

    return purchases;
  } catch (error) {
    console.error('Error getting all fertilizer purchases:', error);
    throw error;
  }
};

export const updateFertilizerPurchaseStatus = async (purchaseId: string, status: FertilizerPurchaseData['status']) => {
  try {
    const purchaseRef = doc(db, 'fertilizerPurchases', purchaseId);
    await updateDoc(purchaseRef, { status });
  } catch (error) {
    console.error('Error updating fertilizer purchase status:', error);
    throw error;
  }
};


// Update fertilizer purchase
export const updateFertilizerPurchase = async (
  purchaseId: string,
  updates: Partial<FertilizerPurchaseData>
): Promise<void> => {
  try {
    const purchaseRef = doc(db, 'fertilizerPurchases', purchaseId);
    await updateDoc(purchaseRef, updates);
    console.log(`Fertilizer purchase ${purchaseId} updated successfully`);
  } catch (error) {
    console.error('Error updating fertilizer purchase:', error);
    throw error;
  }
};


// Delete fertilizer purchase
export const deleteFertilizerPurchase = async (purchaseId: string): Promise<void> => {
  try {
    const purchaseRef = doc(db, 'fertilizerPurchases', purchaseId);
    await deleteDoc(purchaseRef);
    console.log(`Fertilizer purchase ${purchaseId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting fertilizer purchase:', error);
    throw error;
  }
};

// Cart Management Functions

// Add item to cart
export const addToCart = async (cartData: Omit<CartItem, 'cartItemId' | 'userId' | 'createdAt'>): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to add to cart');
    }

    const cartRef = collection(db, 'cart');
    const docRef = await addDoc(cartRef, {
      ...cartData,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

    console.log('Item added to cart successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

// Get user's cart items
export const getUserCartItems = async (userId?: string): Promise<CartItem[]> => {
  try {
    const targetUserId = userId || auth.currentUser?.uid;
    if (!targetUserId) {
      throw new Error('User must be authenticated');
    }

    const cartRef = collection(db, 'cart');
    const q = query(cartRef, where('userId', '==', targetUserId));
    const querySnapshot = await getDocs(q);

    const cartItems: CartItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      cartItems.push({
        cartItemId: doc.id,
        userId: data.userId,
        fertilizerId: data.fertilizerId,
        fertilizerName: data.fertilizerName,
        fertilzerPrice: data.fertilzerPrice,
        fertilizerUnit: data.fertilizerUnit,
        quantity: data.quantity,
        totalAmount: data.totalAmount,
        createdAt: data.createdAt,
      });
    });

    // Sort client-side by creation time (most recent first)
    cartItems.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });

    return cartItems;
  } catch (error) {
    console.error('Error getting cart items:', error);
    throw error;
  }
};

// Update cart item quantity
export const updateCartItemQuantity = async (cartItemId: string, quantity: number): Promise<void> => {
  try {
    const cartItemRef = doc(db, 'cart', cartItemId);
    
    // Get current item to calculate new total
    const itemDoc = await getDoc(cartItemRef);
    if (!itemDoc.exists()) {
      throw new Error('Cart item not found');
    }
    
    const itemData = itemDoc.data();
    const newTotalAmount = itemData.fertilzerPrice * quantity;
    
    await updateDoc(cartItemRef, {
      quantity,
      totalAmount: newTotalAmount,
    });
    
    console.log(`Cart item ${cartItemId} quantity updated successfully`);
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (cartItemId: string): Promise<void> => {
  try {
    const cartItemRef = doc(db, 'cart', cartItemId);
    await deleteDoc(cartItemRef);
    console.log(`Cart item ${cartItemId} removed successfully`);
  } catch (error) {
    console.error('Error removing cart item:', error);
    throw error;
  }
};

// Clear entire cart for user
export const clearCart = async (userId?: string): Promise<void> => {
  try {
    const targetUserId = userId || auth.currentUser?.uid;
    if (!targetUserId) {
      throw new Error('User must be authenticated');
    }

    const cartRef = collection(db, 'cart');
    const q = query(cartRef, where('userId', '==', targetUserId));
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('Cart cleared successfully');
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Purchase all items from cart
export const purchaseCartItems = async (customerInfo: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
}): Promise<string[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to purchase');
    }

    // Get all cart items
    const cartItems = await getUserCartItems(user.uid);
    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    const purchaseRef = collection(db, 'fertilizerPurchases');
    const batch = writeBatch(db);
    const purchaseIds: string[] = [];

    // Create purchase records for each cart item
    cartItems.forEach((cartItem) => {
      const newPurchaseRef = doc(purchaseRef);
      purchaseIds.push(newPurchaseRef.id);
      
      batch.set(newPurchaseRef, {
        userId: user.uid,
        fertilizerId: cartItem.fertilizerId,
        fertilizerName: cartItem.fertilizerName,
        quantity: cartItem.quantity,
        totalAmount: cartItem.totalAmount,
        purchaseDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        deliveryAddress: customerInfo.deliveryAddress,
        customerName: customerInfo.customerName,
        customerPhone: customerInfo.customerPhone,
        customerEmail: customerInfo.customerEmail || '',
        createdAt: serverTimestamp(),
      });
    });

    // Execute all purchases
    await batch.commit();

    // Clear the cart after successful purchase
    await clearCart(user.uid);

    console.log('Cart items purchased successfully:', purchaseIds);
    return purchaseIds;
  } catch (error) {
    console.error('Error purchasing cart items:', error);
    throw error;
  }
};
