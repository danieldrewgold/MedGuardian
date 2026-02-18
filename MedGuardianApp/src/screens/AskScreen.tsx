import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { API_URL } from '../config';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'I have trouble sleeping through the night',
  'What are the side effects of my medications?',
  'Can I take ibuprofen with my current meds?',
  'I feel dizzy when I stand up',
  'What foods should I avoid with my medications?',
  'I have a headache, what can I take?',
];

export default function AskScreen({ navigation }: any) {
  const { getCurrentPatient } = useApp();
  const patient = getCurrentPatient();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const activeMeds = (patient.medications || []).filter((m) => m.status !== 'discontinued');
  const allergies = (patient.allergies || []).map((a) => a.name);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const askQuestion = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: question.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    Keyboard.dismiss();

    try {
      const response = await fetch(`${API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          medications: activeMeds.map((m) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            reason: m.reason,
          })),
          allergies,
          patientName: patient.name,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errData.error || `Error (${response.status})`);
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.answer || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      const errMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: `Sorry, something went wrong: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Context banner */}
      <View style={styles.contextBanner}>
        <Text style={styles.contextText}>
          Answering for {patient.name} — {activeMeds.length} med{activeMeds.length !== 1 ? 's' : ''}
          {allergies.length > 0 ? `, ${allergies.length} allerg${allergies.length !== 1 ? 'ies' : 'y'}` : ''}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Welcome + suggestions */}
        {showSuggestions && (
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Ask MedGuardian</Text>
            <Text style={styles.welcomeSubtitle}>
              Ask any health question — answers are personalized based on {patient.name}'s current medications and allergies.
            </Text>

            <Text style={styles.suggestLabel}>Try asking:</Text>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestBtn}
                onPress={() => askQuestion(q)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            {msg.role === 'assistant' && (
              <Text style={styles.bubbleLabel}>MedGuardian</Text>
            )}
            <Text
              style={[
                styles.messageText,
                msg.role === 'user' ? styles.userText : styles.assistantText,
              ]}
              selectable
            >
              {msg.text}
            </Text>
            <Text style={[styles.timestamp, msg.role === 'user' && styles.timestampUser]}>
              {msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
          </View>
        ))}

        {/* Loading indicator */}
        {loading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <Text style={styles.bubbleLabel}>MedGuardian</Text>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#667eea" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask a health question..."
          placeholderTextColor="#a0aec0"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!loading}
          onSubmitEditing={() => askQuestion(inputText)}
          blurOnSubmit
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => askQuestion(inputText)}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendBtnText}>Ask</Text>
        </TouchableOpacity>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          AI-generated responses. Not medical advice. Always consult your provider.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contextBanner: {
    backgroundColor: '#667eea',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  contextText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    textAlign: 'center',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 8,
  },

  // Welcome / suggestions
  welcomeSection: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
    marginBottom: 20,
  },
  suggestLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a0aec0',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  suggestText: {
    fontSize: 14,
    color: '#4a5568',
  },

  // Messages
  messageBubble: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    maxWidth: '88%',
  },
  userBubble: {
    backgroundColor: '#667eea',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bubbleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#2d3748',
  },
  timestamp: {
    fontSize: 10,
    color: '#a0aec0',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  timestampUser: {
    color: 'rgba(255,255,255,0.7)',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#718096',
  },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#2d3748',
  },
  sendBtn: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Disclaimer
  disclaimer: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  disclaimerText: {
    fontSize: 10,
    color: '#a0aec0',
    textAlign: 'center',
  },
});
