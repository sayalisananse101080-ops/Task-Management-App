import { useState } from "react";
import React from "react";
import { View, StyleSheet, TextInput, Text, TouchableOpacity,Alert } from "react-native";
import { createTask } from "../api/taskApi";
import type { RootStackParamList } from "../../App";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TaskStatus } from "../types/task";
type Props = NativeStackScreenProps<
RootStackParamList,
"AddEditTask"
>;
const AddEditTaskScreen = ({navigation}: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<
    'Low' | 'Medium' | 'High'
  >('Medium');
  const [status, setStatus] = useState<TaskStatus>("Pending");

  const [error, setError] = useState('');

  const handleSave =async() => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }
    try{
      setError("");
      createTask(title, description, status, priority)
      const newTask = await createTask(
        title.trim(),
        description.trim(),
        status,
        priority
      );

    Alert.alert(
      'Validation Successfully',
      `Your Task has been created. ID: ${newTask.id}`,
      [
        {
          text: "OK",
          onPress:()=> navigation.goBack(),
        },
      ]
    );
  }
  catch (error) {
  console.log("CREATE TASK ERROR:", error);

  setError(
    error instanceof Error?
    error.message: "Unable to create task"
  );
  // if (error instanceof Error) {
  //   setError(error.message);
  // } else {
  //   setError(String(error));
  // }
}
};

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Add New Task</Text>

      <Text style={styles.label}>Task Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter task title"
        value={title}
        onChangeText={(value)=>{
          setTitle(value);
          setError('');
        }}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.description]}
        placeholder="Enter task description"
        value={description}
        onChangeText={(value)=>{
          setDescription(value);
          setError('');
        }}
        // multiline
      />

      <Text style={styles.label}>Status</Text>
      <View>
        {(['Pending', 'In Progress', 'Completed'] as TaskStatus[]).map(item =>(
          <TouchableOpacity
          key={item}
          onPress={() => setStatus(item)}
          style={[
            styles.priorityButton,
            status === item && styles.selectedPriority,
          ]}
          >
            <Text style={[styles.priorityText,
              status === item && styles.selectedPriorityText,
            ]}
            >{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Priority</Text>

      <View style={styles.priorityContainer}>
        {(['Low', 'Medium', 'High'] as const).map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.priorityButton,
              priority === item && styles.selectedPriority,
            ]}
            onPress={() => setPriority(item)}
          >
            <Text
              style={[
                styles.priorityText,
                priority === item && styles.selectedPriorityText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Save Task</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F2F7FA',
  },
  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#BBBBBB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  description: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priorityButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  selectedPriority: {
    backgroundColor: '#1846EF',
  },
  priorityText: {
    color: '#333333',
  },
  selectedPriorityText: {
    color: 'white',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: '#1846EF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddEditTaskScreen;