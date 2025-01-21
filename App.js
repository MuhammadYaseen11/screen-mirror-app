import React, { useState } from 'react';
import { View, Button, FlatList, Text, TouchableOpacity, Alert } from 'react-native';

// Mock function to simulate device discovery
const discoverDevices = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '1', name: 'Samsung TV Living Room' },
        { id: '2', name: 'Samsung TV Bedroom' },
      ]);
    }, 2000); // Simulate network delay
  });
};

// Mock function to simulate starting streaming
const startStreaming = (device) => {
  Alert.alert('Streaming Started', `Streaming to ${device.name}`);
};

const App = () => {
  const [devices, setDevices] = useState([]);

  const handleDiscoverDevices = async () => {
    try {
      const discoveredDevices = await discoverDevices();
      setDevices(discoveredDevices);
    } catch (error) {
      console.error('Error discovering devices:', error);
      Alert.alert('Error', 'Failed to discover devices. Please try again.');
    }
  };

  const handleConnectToDevice = (device) => {
    console.log('Connecting to device:', device.name);
    startStreaming(device); // Simulate streaming
  };

  return (
    <View style={{ flex: 1, padding: 100, backgroundColor: '#f8f8f8' }}>
      <Button title="Discover Devices" onPress={handleDiscoverDevices} />
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleConnectToDevice(item)}
            style={{
              padding: 15,
              marginVertical: 5,
              backgroundColor: '#e0e0e0',
              borderRadius: 5,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default App;
