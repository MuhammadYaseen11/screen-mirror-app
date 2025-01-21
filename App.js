import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as Network from 'expo-network';
import * as ScreenCapture from 'expo-screen-capture';
import * as MediaLibrary from 'expo-media-library';

const App = () => {
  const [ipAddress, setIpAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Not Connected');
  const [websocket, setWebsocket] = useState(null);

  useEffect(() => {
    checkPermissions();
    return () => {
      disconnectFromTV();
    };
  }, []);

  const checkPermissions = async () => {
    try {
      // Check network connection
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected || networkState.type !== Network.NetworkStateType.WIFI) {
        Alert.alert('Error', 'Please connect to a WiFi network');
        return false;
      }

      // Request screen capture permission on Android
      if (Platform.OS === 'android') {
        const { status } = await ScreenCapture.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Screen capture permission is required');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking permissions:', error);
      Alert.alert('Error', 'Failed to check permissions');
      return false;
    }
  };

  const connectToTV = async () => {
    if (!ipAddress) {
      Alert.alert('Error', 'Please enter TV IP address');
      return;
    }

    const hasPermissions = await checkPermissions();
    if (!hasPermissions) return;

    try {
      // Format WebSocket URL with the TV app's IP address
      const ws = new WebSocket(`ws://${ipAddress}:8000`);

      ws.onopen = () => {
        console.log('Connected to TV');
        setWebsocket(ws);
        setIsConnected(true);
        setConnectionStatus('Connected');
        Alert.alert('Success', 'Connected to TV');
      };

      ws.onclose = () => {
        console.log('Disconnected from TV');
        handleDisconnect();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        Alert.alert('Connection Error', 'Failed to connect to TV. Please check the IP address and ensure you are on the same network.');
        handleDisconnect();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleTVMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Error', 'Failed to connect to TV');
      handleDisconnect();
    }
  };

  const handleTVMessage = (message) => {
    console.log('Received message from TV:', message);
    switch (message.type) {
      case 'ready':
        console.log('TV is ready to receive stream');
        break;
      case 'error':
        Alert.alert('TV Error', message.error);
        break;
    }
  };

  const startStreaming = async () => {
    if (!isConnected || !websocket) {
      Alert.alert('Error', 'Not connected to TV');
      return;
    }

    try {
      setIsStreaming(true);
      setConnectionStatus('Streaming');

      // Send start streaming message to TV
      websocket.send(JSON.stringify({
        type: 'start_stream',
        config: {
          resolution: '1080p',
          fps: 30
        }
      }));

    } catch (error) {
      console.error('Streaming error:', error);
      Alert.alert('Error', 'Failed to start streaming');
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    if (websocket) {
      try {
        websocket.send(JSON.stringify({ type: 'stop_stream' }));
      } catch (error) {
        console.error('Error sending stop stream message:', error);
      }
    }
    setIsStreaming(false);
    setConnectionStatus('Connected');
  };

  const disconnectFromTV = () => {
    if (isStreaming) {
      stopStreaming();
    }
    if (websocket) {
      websocket.close();
    }
    handleDisconnect();
  };

  const handleDisconnect = () => {
    setWebsocket(null);
    setIsConnected(false);
    setIsStreaming(false);
    setConnectionStatus('Not Connected');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Samsung TV Screen Mirror</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Status: {connectionStatus}</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter TV IP Address (e.g., 192.168.1.100)"
          value={ipAddress}
          onChangeText={setIpAddress}
          keyboardType="numeric"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.buttonContainer}>
        {!isConnected ? (
          <Button
            title="Connect to TV"
            onPress={connectToTV}
          />
        ) : (
          <>
            <Button
              title={isStreaming ? "Stop Streaming" : "Start Streaming"}
              onPress={isStreaming ? stopStreaming : startStreaming}
              color={isStreaming ? "#ff4444" : "#2196F3"}
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="Disconnect"
              onPress={disconnectFromTV}
              color="#666666"
            />
          </>
        )}
      </View>

      <View style={styles.helpContainer}>
        <Text style={styles.helpText}>
          1. Make sure your phone and TV are on the same WiFi network{'\n'}
          2. Open "Video & TV Cast" app on your Samsung TV{'\n'}
          3. Find the IP address shown in the TV app{'\n'}
          4. Enter the IP address above and tap "Connect to TV"
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    gap: 10,
  },
  buttonSpacer: {
    height: 10,
  },
  helpContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});

export default App;