import React, { useState } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

interface ProfileAvatarProps {
  imageUrl?: string;
  size?: number;
  onPress?: () => void;
  isLoading?: boolean;
  showEditButton?: boolean;
}

export default function ProfileAvatar({ 
  imageUrl, 
  size = 100, 
  onPress, 
  isLoading = false,
  showEditButton = false 
}: ProfileAvatarProps) {
  const [imageLoadError, setImageLoadError] = useState(false);

  const renderContent = () => {
    if (imageUrl && !imageLoadError) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          onError={() => setImageLoadError(true)}
        />
      );
    } else {
      return (
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'white',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <MaterialIcons name="person" size={size * 0.5} color={Colors.light.tint} />
        </View>
      );
    }
  };

  const content = (
    <View style={{
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    }}>
      {renderContent()}
      
      {showEditButton && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          backgroundColor: Colors.light.tint,
          borderRadius: size * 0.15,
          width: size * 0.3,
          height: size * 0.3,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: 'white',
        }}>
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialIcons name="camera-alt" size={size * 0.16} color="white" />
          )}
        </View>
      )}
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={onPress} disabled={isLoading}>
      {content}
    </TouchableOpacity>
  ) : (
    content
  );
}